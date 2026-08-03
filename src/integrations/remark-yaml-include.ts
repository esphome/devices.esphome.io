/**
 * Remark plugin: handle two attribute forms on yaml/yml fenced code blocks:
 *
 *   ```yaml file="path.yaml"        ->  inline contents at build time
 *   ```yaml url="https://github..."  ->  fetch in the browser at visit time
 *
 * `file=` resolves a path relative to the markdown file (with traversal
 * guarded), reads it from disk, and rewrites the code node so the rest of
 * the markdown pipeline highlights and renders the contents normally.
 *
 * `url=` is left to the client. The code node is replaced with a raw HTML
 * `<remote-yaml-include>` custom element plus a `<noscript>` fallback link;
 * a small client script (public/js/remote-yaml-include.js) fetches the URL
 * on connect and swaps in the content. We deliberately do not fetch at
 * build time — the whole point is to let device authors point at a live
 * config in their own repo without us re-vendoring it.
 *
 * For yaml files referenced via `file=`, the resolved path is added to
 * `file.data.astro.watchedFiles` so Vite reloads the page in dev mode when
 * the yaml changes.
 */
import * as fs from "fs";
import * as path from "path";
import type { Plugin } from "unified";
import type { Root, Code, Html } from "mdast";
import type { VFile } from "vfile";

const FILE_ATTR = /(^|\s)file=(?:"([^"]+)"|'([^']+)'|([^\s"']+))/;
const URL_ATTR = /(^|\s)url=(?:"([^"]+)"|'([^']+)'|([^\s"']+))/;
// Bare `inline` marker (no `=value`) opting a small snippet out of file
// extraction. The validator and extractor honour it too.
const INLINE_ATTR = /(^|\s)inline(?=\s|$)/;
const YAML_LANGS = new Set(["yaml", "yml"]);

// Hosts a `url=` fence may point at. We don't want a device page to be able
// to make a reader's browser fetch arbitrary origins (tracking, mixed-
// content failures, surprise content), so the allowlist is GitHub only —
// which is also the only host the `Copy !include` directive can target.
const URL_HOST_ALLOWLIST = new Set(["github.com", "raw.githubusercontent.com"]);

// Used to build a one-click `!include github://…@<branch>` directive that
// users can paste into their own ESPHome config to pull this device's yaml
// straight from GitHub. Tracks the editLink baseUrl in astro.config.mjs.
const REPO_OWNER = "esphome";
const REPO_NAME = "devices.esphome.io";
const REPO_BRANCH = "main";

function stripAttrs(meta: string, ...attrs: string[]): string {
  let out = meta;
  for (const a of attrs) {
    const re = new RegExp(`(^|\\s)${a}=(?:"[^"]+"|'[^']+'|\\S+)`);
    out = out.replace(re, "");
  }
  return out.replace(/\s+/g, " ").trim();
}

function extractAttr(re: RegExp, meta: string | null | undefined): string | null {
  if (!meta) return null;
  const m = meta.match(re);
  if (!m) return null;
  return m[2] ?? m[3] ?? m[4] ?? null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Build an `!include github://owner/repo/path@ref` directive from any
// github.com / raw.githubusercontent.com URL. Returns null for everything
// else (gitlab, raw HTTP, malformed input) so the caller can skip rendering
// the button rather than emit a broken directive.
//
// Branch names that contain `/` are inherently ambiguous from a github.com
// blob URL (`/blob/feature/foo/path/file.yaml` could be branch `feature`
// + path `foo/path/...` OR branch `feature/foo` + path `path/...`); we
// only handle the explicit `/blob/refs/{heads,tags}/<ref>/` form for those
// and return null otherwise so the user can paste the raw URL directly.
function githubIncludeDirective(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch (_) {
    return null;
  }
  // Decode each segment so `%2F` in a branch name, `%20` in a path, etc.
  // round-trip back to their literal form in the directive.
  const decode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch (_) {
      return null;
    }
  };
  const segments = u.pathname.replace(/^\/+|\/+$/g, "").split("/").map(decode);
  if (segments.some((s) => s === null)) return null;
  const p = segments as string[];

  let owner: string | undefined;
  let repo: string | undefined;
  let ref: string | undefined;
  let rest: string | undefined;
  if (u.hostname === "raw.githubusercontent.com") {
    if (p.length < 4) return null;
    owner = p[0];
    repo = p[1];
    if (p[2] === "refs" && (p[3] === "heads" || p[3] === "tags") && p.length >= 6) {
      ref = p[4];
      rest = p.slice(5).join("/");
    } else {
      ref = p[2];
      rest = p.slice(3).join("/");
    }
  } else if (u.hostname === "github.com") {
    if (p.length < 5) return null;
    owner = p[0];
    repo = p[1];
    if (p[2] !== "blob" && p[2] !== "raw") return null;
    if (
      p[3] === "refs" &&
      (p[4] === "heads" || p[4] === "tags") &&
      p.length >= 7
    ) {
      ref = p[5];
      rest = p.slice(6).join("/");
    } else {
      ref = p[3];
      rest = p.slice(4).join("/");
    }
  } else {
    return null;
  }
  if (!owner || !repo || !ref || !rest) return null;
  return `!include github://${owner}/${repo}/${rest}@${ref}`;
}

const remarkYamlInclude: Plugin<[], Root> = () => {
  return (tree, file: VFile) => {
    const docPath = file.path;
    const docDir = docPath ? path.dirname(docPath) : null;

    visitCodeNodes(tree, (parent, index, node) => {
      const lang = (node.lang ?? "").toLowerCase();
      if (!YAML_LANGS.has(lang)) return;

      // `inline` keeps a small snippet on the page verbatim instead of
      // extracting it to a sibling yaml file. Strip the marker so it never
      // leaks into the rendered fence meta; the rest of the pipeline then
      // highlights the block as an ordinary inline yaml fence.
      if (node.meta && INLINE_ATTR.test(node.meta)) {
        const stripped = node.meta.replace(INLINE_ATTR, "").replace(/\s+/g, " ").trim();
        node.meta = stripped.length > 0 ? stripped : null;
      }

      const filePath = extractAttr(FILE_ATTR, node.meta);
      const url = extractAttr(URL_ATTR, node.meta);

      // Prefer file= when both are present; the build-time include wins.
      if (filePath) {
        if (!docDir) return;
        if (path.isAbsolute(filePath)) {
          warn(file, node, `file="${filePath}" must be a relative path`);
          return;
        }
        const resolved = path.resolve(docDir, filePath);
        const rel = path.relative(docDir, resolved);
        if (rel.startsWith("..") || path.isAbsolute(rel)) {
          warn(file, node, `file="${filePath}" resolves outside the markdown file's directory`);
          return;
        }

        let contents: string;
        try {
          contents = fs.readFileSync(resolved, "utf8");
        } catch (err) {
          warn(
            file,
            node,
            `Unable to read yaml include "${filePath}": ${(err as Error).message}`
          );
          return;
        }
        if (contents.endsWith("\r\n")) contents = contents.slice(0, -2);
        else if (contents.endsWith("\n")) contents = contents.slice(0, -1);

        node.value = contents;
        const stripped = stripAttrs(node.meta ?? "", "file");
        node.meta = stripped.length > 0 ? stripped : null;

        const data = (file.data ??= {} as Record<string, unknown>);
        const astro = (data as { astro?: { watchedFiles?: string[] } }).astro ??
          ((data as Record<string, unknown>).astro = {});
        const watched = ((astro as { watchedFiles?: string[] }).watchedFiles ??=
          []);
        if (!watched.includes(resolved)) watched.push(resolved);

        // Surround the code block with:
        //   - a header above showing the github source URL (for parity with
        //     the live `url=` blocks),
        //   - a `<yaml-include-action>` after carrying the !include directive.
        const repoRel = path.relative(process.cwd(), resolved).replace(/\\/g, "/");
        const sourceUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${REPO_BRANCH}/${repoRel}`;
        const directive = `!include github://${REPO_OWNER}/${REPO_NAME}/${repoRel}@${REPO_BRANCH}`;
        if (parent && typeof index === "number") {
          const header: Html = {
            type: "html",
            value:
              `<div class="yaml-source-header">` +
              `<a class="yaml-source-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener" title="Open the source on GitHub">${escapeHtml(sourceUrl)}</a>` +
              `</div>`,
          } as Html;
          parent.children.splice(
            index,
            0,
            header as unknown as Root["children"][number],
          );
          // After the splice the code node has shifted to index + 1.
          insertActionAfter(parent, index + 1, directive);
        }
        return;
      }

      if (url) {
        // Validate the URL before we emit any markup that would cause a
        // visit-time fetch. Reject anything not https:// on an allowlisted
        // host so a device page can't redirect readers' browsers at an
        // attacker-controlled origin.
        let parsed: URL;
        try {
          parsed = new URL(url);
        } catch (_) {
          warn(file, node, `url="${url}" is not a valid URL`);
          return;
        }
        if (parsed.protocol !== "https:") {
          warn(file, node, `url="${url}" must use https://`);
          return;
        }
        if (!URL_HOST_ALLOWLIST.has(parsed.hostname)) {
          warn(
            file,
            node,
            `url="${url}" host \`${parsed.hostname}\` is not allowed; only ${[...URL_HOST_ALLOWLIST].join(", ")} are permitted`,
          );
          return;
        }

        // Replace the code node with raw HTML for the custom element, plus
        // a leading explanatory paragraph (so individual device pages don't
        // need to write the same boilerplate sentence above each url=
        // block). The client script (public/js/remote-yaml-include.js)
        // hydrates the custom element on connect.
        const safeUrl = escapeHtml(url);
        const intro: Html = {
          type: "html",
          value:
            `<p class="remote-yaml-intro">The current firmware configuration is fetched live from the upstream repository:</p>`,
        } as Html;
        const html: Html = {
          type: "html",
          value: [
            `<remote-yaml-include url="${safeUrl}">`,
            `  <pre class="remote-yaml-placeholder"><code class="language-yaml"># Loading ${safeUrl}…</code></pre>`,
            `  <noscript>JavaScript is required to load this YAML inline. <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">View source</a></noscript>`,
            `</remote-yaml-include>`,
          ].join("\n"),
        } as Html;
        let htmlIndex = index;
        if (parent && typeof index === "number") {
          parent.children.splice(
            index,
            1,
            intro as unknown as Root["children"][number],
            html as unknown as Root["children"][number],
          );
          htmlIndex = index + 1; // intro now at `index`, html at `index + 1`
        }
        const directive = githubIncludeDirective(url);
        if (directive) insertActionAfter(parent, htmlIndex, directive);

        // Force Expressive Code's CSS to load on this page so the markup the
        // client script renders (`<div class="expressive-code">…`) gets EC's
        // styling. EC injects its `<link>` per build-time code block; on a
        // page with only `url=` blocks there are no other code blocks, so we
        // emit a hidden one here. The `<link>` loads CSS regardless of the
        // wrapper's visibility.
        injectEcLoaderOnce(tree, file);
      }
    });
  };
};

function insertActionAfter(
  parent: { children: unknown[] } | null,
  index: number | null,
  directive: string
): void {
  if (!parent || typeof index !== "number") return;
  const action: Html = {
    type: "html",
    value: `<yaml-include-action data-include="${escapeHtml(directive)}"></yaml-include-action>`,
  } as Html;
  parent.children.splice(index + 1, 0, action as unknown as Root["children"][number]);
}

function injectEcLoaderOnce(tree: Root, file: VFile): void {
  const data = (file.data ??= {} as Record<string, unknown>) as Record<string, unknown>;
  if (data.__remoteYamlEcLoaded) return;
  data.__remoteYamlEcLoaded = true;

  // Wrap a tiny code node in a `hidden` div so EC's rendered markup doesn't
  // render visibly, but the `<link rel="stylesheet">` EC injects still loads
  // the stylesheet (links work regardless of CSS visibility).
  tree.children.unshift(
    { type: "html", value: '<div hidden aria-hidden="true">' } as unknown as Root["children"][number],
    { type: "code", lang: "yaml", value: "#" } as unknown as Root["children"][number],
    { type: "html", value: "</div>" } as unknown as Root["children"][number],
  );
}

function warn(file: VFile, node: Code, message: string): void {
  const msg = file.message(message, node);
  msg.source = "remark-yaml-include";
  msg.fatal = false;
}

// Walks the tree, calling fn(parent, index, node) for each `code` node so the
// caller can replace the node in place if needed.
function visitCodeNodes(
  tree: Root,
  fn: (parent: { children: unknown[] } | null, index: number | null, node: Code) => void
): void {
  const walk = (node: { type: string; children?: unknown[] }, parent: { children: unknown[] } | null, index: number | null) => {
    if (node.type === "code") {
      fn(parent, index, node as unknown as Code);
      return;
    }
    if (Array.isArray(node.children)) {
      // Walk a snapshot — fn may splice into parent.children, but we are not
      // visiting the splice replacements (they are html nodes).
      const snapshot = node.children.slice();
      for (let i = 0; i < snapshot.length; i++) {
        const child = snapshot[i] as { type: string; children?: unknown[] };
        // Recompute the live index; splices may have shifted earlier siblings.
        const liveIndex = (node.children as unknown[]).indexOf(child);
        if (liveIndex === -1) continue;
        walk(child, node as { children: unknown[] }, liveIndex);
      }
    }
  };
  walk(tree as unknown as { type: string; children?: unknown[] }, null, null);
}

export default remarkYamlInclude;
