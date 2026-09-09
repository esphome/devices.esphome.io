/**
 * Remark plugin: handle two attribute forms on yaml/yml fenced code blocks:
 *
 *   ```yaml file="path.yaml"        ->  inline contents at build time
 *   ```yaml url="https://github... or https://codeberg... or https://gitlab..."
 *                                    ->  fetch in the browser at visit time
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
// content failures, surprise content), so the allowlist mirrors the git
// hosts ESPHome's own `!include`/packages shorthand supports: GitHub,
// Codeberg and GitLab. The host check gives a targeted warning; the full
// path shape is then validated by parseUpstreamUrl below, since only the
// canonical shapes can be rewritten to a CORS-enabled raw endpoint by the
// client script.
const URL_HOST_ALLOWLIST = new Set([
  "github.com",
  "raw.githubusercontent.com",
  "codeberg.org",
  "gitlab.com",
]);

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

interface UpstreamRef {
  scheme: "github" | "codeberg" | "gitlab";
  // GitLab namespaces can be nested (`group/subgroup`); GitHub and Codeberg
  // owners are always a single segment.
  namespace: string;
  repo: string;
  ref: string;
  rest: string;
}

const YAML_EXT = /\.ya?ml$/i;

// Parse the exact upstream URL shapes a `url=` fence may use - the same set
// scripts/validate-yaml-configs.ts enforces in CI and the client script
// (public/js/remote-yaml-include.js) knows how to rewrite to a fetchable raw
// endpoint:
//   raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>.y[a]ml
//   raw.githubusercontent.com/<owner>/<repo>/refs/(heads|tags)/<ref>/<path>
//   github.com/<owner>/<repo>/(blob|raw)/<ref>/<path>.y[a]ml
//   github.com/<owner>/<repo>/(blob|raw)/refs/(heads|tags)/<ref>/<path>
//   codeberg.org/<owner>/<repo>/(src|raw)/(branch|tag|commit)/<ref>/<path>
//   gitlab.com/<namespace...>/<repo>/-/(blob|raw)/<ref>/<path>.y[a]ml
// Returns null for everything else (repo roots, directory listings, the
// legacy Gitea `/src/<ref>/<path>` shape without a branch/tag/commit
// segment, GitLab URLs without the `-` separator, malformed input) so the
// caller can warn instead of emitting markup that would fail to load.
//
// Branch names that contain `/` are inherently ambiguous from a github.com
// blob URL (`/blob/feature/foo/path/file.yaml` could be branch `feature`
// + path `foo/path/...` OR branch `feature/foo` + path `path/...`); we
// only handle the explicit `/blob/refs/{heads,tags}/<ref>/` form for those
// and otherwise take the single segment after the marker as the ref.
// Codeberg's `/(src|raw)/(branch|tag|commit)/<ref>/<path>` and GitLab's
// `/-/(blob|raw)/<ref>/<path>` forms share that ambiguity and get the same
// single-segment treatment.
function parseUpstreamUrl(url: string): UpstreamRef | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch (_) {
    return null;
  }
  if (u.protocol !== "https:") return null;
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

  let scheme: UpstreamRef["scheme"];
  let namespace: string | undefined;
  let repo: string | undefined;
  let ref: string | undefined;
  let rest: string | undefined;
  if (u.hostname === "raw.githubusercontent.com") {
    scheme = "github";
    if (p.length < 4) return null;
    namespace = p[0];
    repo = p[1];
    if (p[2] === "refs" && (p[3] === "heads" || p[3] === "tags") && p.length >= 6) {
      ref = p[4];
      rest = p.slice(5).join("/");
    } else {
      ref = p[2];
      rest = p.slice(3).join("/");
    }
  } else if (u.hostname === "github.com") {
    scheme = "github";
    if (p.length < 5) return null;
    namespace = p[0];
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
  } else if (u.hostname === "codeberg.org") {
    scheme = "codeberg";
    // owner/repo/(src|raw)/(branch|tag|commit)/ref/path... - at least 6
    // segments. The legacy Gitea `/src/<ref>/<path>` shape (no
    // branch/tag/commit segment) is ambiguous and rejected.
    if (p.length < 6) return null;
    namespace = p[0];
    repo = p[1];
    if (p[2] !== "src" && p[2] !== "raw") return null;
    if (p[3] !== "branch" && p[3] !== "tag" && p[3] !== "commit") return null;
    ref = p[4];
    rest = p.slice(5).join("/");
  } else if (u.hostname === "gitlab.com") {
    scheme = "gitlab";
    // Namespaces can be nested (group/subgroup/repo), so locate the
    // literal `-` separator segment rather than assuming a fixed position.
    // It must be at index >= 2 (at least one namespace segment plus the
    // repo before it).
    let dashIndex = -1;
    for (let i = 2; i < p.length; i++) {
      if (p[i] === "-") {
        dashIndex = i;
        break;
      }
    }
    if (dashIndex === -1) return null;
    if (p[dashIndex + 1] !== "blob" && p[dashIndex + 1] !== "raw") return null;
    ref = p[dashIndex + 2];
    rest = p.slice(dashIndex + 3).join("/");
    namespace = p.slice(0, dashIndex - 1).join("/");
    repo = p[dashIndex - 1];
  } else {
    return null;
  }
  if (!namespace || !repo || !ref || !rest) return null;
  if (!YAML_EXT.test(p[p.length - 1])) return null;
  return { scheme, namespace, repo, ref, rest };
}

// Build an `!include github://owner/repo/path@ref` (or `codeberg://...` /
// `gitlab://...`) directive from a canonical upstream URL. Returns null for
// anything parseUpstreamUrl rejects, and for a GitLab namespace with more
// than one segment (ESPHome's shorthand grammar takes a single-segment
// `owner`), so the caller can skip rendering the button rather than emit a
// broken directive.
function includeDirective(url: string): string | null {
  const ref = parseUpstreamUrl(url);
  if (!ref) return null;
  if (ref.namespace.includes("/")) return null;
  return `!include ${ref.scheme}://${ref.namespace}/${ref.repo}/${ref.rest}@${ref.ref}`;
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
              `<a class="yaml-source-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener" title="Open the upstream source">${escapeHtml(sourceUrl)}</a>` +
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
        if (parseUpstreamUrl(url) === null) {
          warn(
            file,
            node,
            `url="${url}" is not a recognised upstream yaml file URL; expected a github.com blob/raw, raw.githubusercontent.com, codeberg.org src/raw (branch|tag|commit), or gitlab.com /-/blob|raw URL ending in .yaml`,
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
        const directive = includeDirective(url);
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

export { includeDirective, parseUpstreamUrl };
export default remarkYamlInclude;
