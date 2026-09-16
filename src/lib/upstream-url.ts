/**
 * Parse the exact upstream yaml URL shapes a `url=` fence, the yaml
 * validator, and the Made-for-ESPHome reviewer all need to agree on:
 *
 *   raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>.y[a]ml
 *   raw.githubusercontent.com/<owner>/<repo>/refs/(heads|tags)/<ref>/<path>
 *   github.com/<owner>/<repo>/(blob|raw)/<ref>/<path>.y[a]ml
 *   github.com/<owner>/<repo>/(blob|raw)/refs/(heads|tags)/<ref>/<path>
 *   codeberg.org/<owner>/<repo>/(src|raw)/(branch|tag|commit)/<ref>/<path>.y[a]ml
 *   gitlab.com/<namespace...>/<repo>/-/(blob|raw)/<ref>/<path>.y[a]ml
 *
 * This is the single source of truth for that grammar - it used to be
 * hand-copied across src/integrations/remark-yaml-include.ts,
 * scripts/validate-yaml-configs.ts, and scripts/review-made-for-esphome.ts,
 * and the three copies drifted (percent-decoding inconsistently, and
 * disagreeing on whether a bare `refs` segment with no explicit ref/path
 * counted as a match). Everything that needs to recognise or decompose one
 * of these URLs should import parseUpstreamUrl from here instead of
 * re-implementing the shapes.
 *
 * The host allowlist mirrors the git hosts ESPHome's own `!include`/packages
 * shorthand supports (see esphome/esphome's `esphome/git.py` GIT_DOMAINS):
 * GitHub, Codeberg and GitLab. We don't want a device page to be able to
 * make a reader's browser fetch arbitrary origins (tracking, mixed-content
 * failures, surprise content), so anything else is rejected outright.
 *
 * Branch names that contain `/` are inherently ambiguous from a github.com
 * blob URL (`/blob/feature/foo/path/file.yaml` could be branch `feature`
 * + path `foo/path/...` OR branch `feature/foo` + path `path/...`); we only
 * handle the explicit `/blob/refs/{heads,tags}/<ref>/` form for those and
 * otherwise take the single segment after the marker as the ref. Codeberg's
 * `/(src|raw)/(branch|tag|commit)/<ref>/<path>` and GitLab's
 * `/-/(blob|raw)/<ref>/<path>` forms share that ambiguity and get the same
 * single-segment treatment.
 */

export type UpstreamHost = "github.com" | "codeberg.org" | "gitlab.com";
export type UpstreamScheme = "github" | "codeberg" | "gitlab";

export interface UpstreamRef {
  host: UpstreamHost;
  scheme: UpstreamScheme;
  // GitLab namespaces can be nested (`group/subgroup`); GitHub and Codeberg
  // owners are always a single segment.
  owner: string;
  repo: string;
  ref: string;
  filePath: string;
}

// Hosts a `url=` fence may point at. A raw.githubusercontent.com URL is
// recognised too, but yields host "github.com" in the returned ref - it's
// the same upstream, just a different fetch host.
export const URL_HOST_ALLOWLIST: ReadonlySet<string> = new Set([
  "github.com",
  "raw.githubusercontent.com",
  "codeberg.org",
  "gitlab.com",
]);

const YAML_EXT = /\.ya?ml$/i;

// Parse one of the URL shapes documented above. Returns null for everything
// else (repo roots, directory listings, the legacy Gitea `/src/<ref>/<path>`
// shape without a branch/tag/commit segment, GitLab URLs without the `-`
// separator, an explicit `refs/(heads|tags)` marker with no ref/path after
// it, malformed input) so the caller can warn instead of emitting markup
// that would fail to load.
export function parseUpstreamUrl(url: string): UpstreamRef | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch (_) {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (!URL_HOST_ALLOWLIST.has(u.hostname)) return null;

  // Decode each segment so `%2F` in a branch name, `%20` in a path, etc.
  // round-trip back to their literal form.
  const decode = (s: string): string | null => {
    try {
      return decodeURIComponent(s);
    } catch (_) {
      return null;
    }
  };
  const segments = u.pathname.replace(/^\/+|\/+$/g, "").split("/").map(decode);
  if (segments.some((s) => s === null)) return null;
  const p = segments as string[];

  let host: UpstreamHost;
  let scheme: UpstreamScheme;
  let owner: string | undefined;
  let repo: string | undefined;
  let ref: string | undefined;
  let filePath: string | undefined;
  if (u.hostname === "raw.githubusercontent.com") {
    host = "github.com";
    scheme = "github";
    if (p.length < 4) return null;
    owner = p[0];
    repo = p[1];
    if (p[2] === "refs" && (p[3] === "heads" || p[3] === "tags")) {
      // Explicit refs/(heads|tags)/<ref>/<path...> form - requires a ref
      // AND at least one path segment; a bare `refs` marker with nothing
      // after it does not fall back to treating "refs" itself as the ref.
      if (p.length < 6) return null;
      ref = p[4];
      filePath = p.slice(5).join("/");
    } else {
      ref = p[2];
      filePath = p.slice(3).join("/");
    }
  } else if (u.hostname === "github.com") {
    host = "github.com";
    scheme = "github";
    if (p.length < 5) return null;
    owner = p[0];
    repo = p[1];
    if (p[2] !== "blob" && p[2] !== "raw") return null;
    if (p[3] === "refs" && (p[4] === "heads" || p[4] === "tags")) {
      if (p.length < 7) return null;
      ref = p[5];
      filePath = p.slice(6).join("/");
    } else {
      ref = p[3];
      filePath = p.slice(4).join("/");
    }
  } else if (u.hostname === "codeberg.org") {
    host = "codeberg.org";
    scheme = "codeberg";
    // owner/repo/(src|raw)/(branch|tag|commit)/ref/path... - at least 6
    // segments. The legacy Gitea `/src/<ref>/<path>` shape (no
    // branch/tag/commit segment) is ambiguous and rejected.
    if (p.length < 6) return null;
    owner = p[0];
    repo = p[1];
    if (p[2] !== "src" && p[2] !== "raw") return null;
    if (p[3] !== "branch" && p[3] !== "tag" && p[3] !== "commit") return null;
    ref = p[4];
    filePath = p.slice(5).join("/");
  } else {
    // gitlab.com - the URL_HOST_ALLOWLIST check above guarantees this is
    // the only remaining possibility once the three checks above fall
    // through.
    host = "gitlab.com";
    scheme = "gitlab";
    // Namespaces can be nested (group/subgroup/repo), so locate the literal
    // `-` separator segment rather than assuming a fixed position. It must
    // be at index >= 2 (at least one namespace segment plus the repo before
    // it).
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
    filePath = p.slice(dashIndex + 3).join("/");
    owner = p.slice(0, dashIndex - 1).join("/");
    repo = p[dashIndex - 1];
  }
  if (!owner || !repo || !ref || !filePath) return null;
  if (!YAML_EXT.test(p[p.length - 1])) return null;
  return { host, scheme, owner, repo, ref, filePath };
}
