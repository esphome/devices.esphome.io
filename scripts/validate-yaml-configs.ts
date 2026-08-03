#!/usr/bin/env tsx
/**
 * Enforce the device-config rules across every yaml file referenced by a
 * markdown `file=` fence under src/docs/devices/, plus the page-level
 * conventions on each migrated markdown.
 *
 * Rules — applied to every referenced yaml file (any device):
 *   1. The file must parse as valid YAML.
 *   2. No passwords on any `password:`, `*_password:`, or `psk:` key —
 *      neither literal strings nor `!secret` references. Example configs
 *      must not carry credentials of any form; the user supplies them in
 *      their own config.
 *   3. No `!secret` references anywhere (not just on password keys).
 *      Example configs must not depend on entries the user may not have
 *      defined in their secrets file.
 *
 * Additional rules for the page-level form (markdown with `file=`/`url=`
 * fences):
 *   4. The first `file=` fence on a page must reference `config.yaml`.
 *      `url=` fences may appear before or after — the ordering rule only
 *      counts `file=` fences, since `config.yaml` is the in-repo hardware
 *      manifest and `url=` is the live upstream link. Pages added or
 *      modified in the current PR (detected via BASE_SHA/HEAD_SHA env
 *      vars) must use `file=`- or `url=`-based fences exclusively — no
 *      inline yaml. Pages untouched by the PR remain unchecked for inline
 *      yaml so the in-flight migration of legacy pages isn't blocked.
 *   5. `config.yaml` must be hardware-only:
 *        - No top-level `api:`, `ota:`, `mqtt:`, `web_server:`,
 *          `web_server_idf:`, `improv_serial:`, `captive_portal:`,
 *          `bluetooth_proxy:`, or `dashboard_import:`.
 *        - `wifi:` is allowed for radio tunables (country, power_save_mode,
 *          output_power, …) but must not contain `ssid`, `password`,
 *          `networks`, `manual_ip`, `eap`, or `use_address`. An empty
 *          `ap:` is allowed (and recommended) for first-flash usability.
 *        - No `platform: homeassistant`, `platform: mqtt`, or
 *          `platform: template` anywhere in the tree — those are
 *          network-dependent or user-derived, not hardware.
 *   6. Pages with `made-for-esphome: true` in frontmatter that are added
 *      or modified in the current PR must include at least one `url=`
 *      yaml fence pointing at a yaml file on the manufacturer's GitHub
 *      repo (`github.com/<owner>/<repo>/(blob|raw)/<ref>/<path>.y[a]ml`
 *      or `raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>.y[a]ml`).
 *      The Made-for-ESPHome programme requires the firmware config to be
 *      open and reachable; a live link to the upstream yaml is how we
 *      surface that on the device page. `url=` is also permitted on
 *      non-made-for-esphome pages (e.g. to mirror an upstream config) but
 *      isn't the standard form there — `file=config.yaml` is.
 *   7. One device per pull request: a PR may add at most one new device
 *      page (a newly-added `src/docs/devices/<Device>/index.md`). Detected
 *      via BASE_SHA/HEAD_SHA, so enforced on pull_request events only.
 */
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import matter from "gray-matter";
// js-yaml is a transitive dep of gray-matter; import directly to parse.
import yaml from "js-yaml";

// Hosts a `url=` yaml fence may point at — kept in sync with the build-time
// allowlist in src/integrations/remark-yaml-include.ts. A `url=` fence is
// only counted as "the upstream config is reachable" if its host is one
// of these AND the path resolves to a yaml file the renderer can actually
// fetch as raw bytes; anything else is dropped at render time and
// shouldn't satisfy the made-for-esphome rule either.
const URL_HOST_ALLOWLIST = new Set(["github.com", "raw.githubusercontent.com"]);
const YAML_EXT = /\.ya?ml$/i;

// Recognise the exact URL shapes that `remark-yaml-include` knows how to
// normalise to a raw yaml fetch. Anything else (e.g. a repo root, a
// directory listing, an HTML page) would render as HTML or 404 in the
// browser — those mustn't satisfy the made-for-esphome rule.
//
//   raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>.y[a]ml
//   raw.githubusercontent.com/<owner>/<repo>/refs/(heads|tags)/<ref>/<path>.y[a]ml
//   github.com/<owner>/<repo>/(blob|raw)/<ref>/<path>.y[a]ml
//   github.com/<owner>/<repo>/(blob|raw)/refs/(heads|tags)/<ref>/<path>.y[a]ml
function isAllowedGitHubUrl(value: string): boolean {
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  if (!URL_HOST_ALLOWLIST.has(u.hostname)) return false;

  const segments = u.pathname.replace(/^\/+|\/+$/g, "").split("/");

  let pathStart: number;
  if (u.hostname === "raw.githubusercontent.com") {
    // owner/repo/ref/path…  OR  owner/repo/refs/(heads|tags)/ref/path…
    if (segments.length < 4) return false;
    pathStart =
      segments[2] === "refs" && (segments[3] === "heads" || segments[3] === "tags")
        ? 5
        : 3;
  } else {
    // github.com — must be /blob/ or /raw/
    if (segments.length < 5) return false;
    if (segments[2] !== "blob" && segments[2] !== "raw") return false;
    pathStart =
      segments[3] === "refs" && (segments[4] === "heads" || segments[4] === "tags")
        ? 6
        : 4;
  }
  if (segments.length <= pathStart) return false; // no path past the ref
  const lastSeg = segments[segments.length - 1];
  return YAML_EXT.test(lastSeg);
}

// Truthy `made-for-esphome` covers the YAML boolean (`true`/`True` parse to
// the JS boolean `true`) and the rare string form. Anything else — missing,
// `false`, `pending` — is treated as not made-for-esphome.
function isMadeForEsphome(content: string): boolean {
  let data: Record<string, unknown>;
  try {
    data = matter(content).data as Record<string, unknown>;
  } catch {
    return false;
  }
  const v = data["made-for-esphome"];
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return /^true$/i.test(v.trim());
  return false;
}

const HARDWARE_ONLY_FORBIDDEN = new Set([
  "api",
  "ota",
  "mqtt",
  "web_server",
  "web_server_idf",
  "improv_serial",
  "captive_portal",
  "bluetooth_proxy",
  "dashboard_import",
]);

// `wifi:` is permitted in config.yaml because some radio settings (country,
// power_save_mode, output_power, passive_scan, …) are genuinely hardware
// tunables. But user-network details belong in the user's own config.
// `ap:` is allowed: it lets a freshly-flashed device boot into a fallback
// hotspot so users can provision Wi-Fi without further yaml edits.
const WIFI_USER_KEYS = new Set([
  "ssid",
  "password",
  "networks",
  "manual_ip",
  "eap",
  "use_address",
]);

// Platforms that don't belong in a hardware-only config.yaml:
//   - homeassistant / mqtt depend on a network connection at runtime.
//   - template entries are user-defined derivations layered on top of
//     hardware (e.g. a "Battery %" sensor computed from a voltage sensor,
//     or a friendlier select wrapping a GPIO switch). They go in their own
//     companion yaml so config.yaml stays a pure hardware manifest.
const HARDWARE_ONLY_FORBIDDEN_PLATFORMS = new Set([
  "homeassistant",
  "mqtt",
  "template",
]);

// Match `password`, `*_password`, or `psk` at the parsed-tree key level.
const PASSWORD_KEY = /^([\w-]*password[\w-]*|psk)$/i;

function checkSensitiveInTree(
  node: unknown,
  pathStack: (string | number)[],
  rel: string,
  issues: Issue[]
): void {
  if (Array.isArray(node)) {
    node.forEach((item, idx) =>
      checkSensitiveInTree(item, [...pathStack, idx], rel, issues)
    );
    return;
  }
  // Strings are visited as leaves to catch !secret references regardless of
  // the surrounding key.
  if (typeof node === "string") {
    if (/^!secret\b/.test(node.trim())) {
      const where = pathStack.length > 0 ? pathStack.join(".") : "(root)";
      issues.push({
        file: rel,
        message: `\`!secret\` reference at \`${where}\` — example configs must not depend on secrets the user may not have defined`,
      });
    }
    return;
  }
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (PASSWORD_KEY.test(key) && typeof value === "string") {
      // Any non-empty string value on a password key is forbidden — both
      // literals and `!secret` references. The user provides credentials
      // through their own config, never through the example.
      if (value.trim() !== "") {
        const where = [...pathStack, key].join(".");
        issues.push({
          file: rel,
          message: `password at \`${where}\` — example configs must not carry passwords (literal or \`!secret\`); leave the key out and let the user add it`,
        });
      }
    }
    checkSensitiveInTree(value, [...pathStack, key], rel, issues);
  }
}

interface YamlFence {
  fileAttr: string | null; // null when the fence has no `file=` attr
  urlAttr: string | null; // null when the fence has no `url=` attr
  inline: boolean; // true when the fence carries the bare `inline` marker
  lineNumber: number; // 1-indexed source line of the fence opener
}

function findYamlFences(md: string): YamlFence[] {
  const lines = md.split(/\r?\n/);
  const fences: YamlFence[] = [];
  let inFence: { char: string; len: number } | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (inFence) {
      const closeRe = new RegExp(
        `^\\s*${inFence.char === "`" ? "`" : "~"}{${inFence.len},}\\s*$`
      );
      if (closeRe.test(line)) inFence = null;
      continue;
    }
    const m = line.match(/^(\s*)(`{3,}|~{3,})\s*([A-Za-z0-9_+\-]+)?\s*(.*)$/);
    if (!m || !m[2]) continue;
    const fenceChar = m[2][0];
    const fenceLen = m[2].length;
    const lang = (m[3] ?? "").toLowerCase();
    const meta = m[4] ?? "";
    inFence = { char: fenceChar, len: fenceLen };
    if (lang !== "yaml" && lang !== "yml") continue;
    const fileMatch = meta.match(/(^|\s)file=(?:"([^"]+)"|'([^']+)'|([^\s"']+))/);
    const fileAttr = fileMatch
      ? fileMatch[2] ?? fileMatch[3] ?? fileMatch[4] ?? ""
      : null;
    const urlMatch = meta.match(/(^|\s)url=(?:"([^"]+)"|'([^']+)'|([^\s"']+))/);
    const urlAttr = urlMatch
      ? urlMatch[2] ?? urlMatch[3] ?? urlMatch[4] ?? ""
      : null;
    const inline = /(^|\s)inline(?=\s|$)/.test(meta);
    fences.push({ fileAttr, urlAttr, inline, lineNumber: i + 1 });
  }
  return fences;
}

interface Issue {
  file: string;
  line?: number;
  message: string;
}

function checkYamlFile(absPath: string, isHardwareOnly: boolean): Issue[] {
  const issues: Issue[] = [];
  const rel = path.relative(process.cwd(), absPath);
  let raw: string;
  try {
    raw = fs.readFileSync(absPath, "utf8");
  } catch (err) {
    issues.push({ file: rel, message: `unable to read: ${(err as Error).message}` });
    return issues;
  }

  // Parse — tolerate ESPHome custom tags. Re-stamp the tag onto the
  // resulting string so `password: !secret foo` parses to `"!secret foo"`,
  // which the password check correctly recognises as non-literal.
  const schema = yaml.DEFAULT_SCHEMA.extend(
    ["!secret", "!lambda", "!include", "!env", "!extend", "!remove"].map(
      (tag) =>
        new yaml.Type(tag, {
          kind: "scalar",
          construct: (data) =>
            data === null || data === undefined ? tag : `${tag} ${data}`,
          represent: (data) => data as string,
        })
    )
  );
  let parsed: unknown = undefined;
  try {
    parsed = yaml.load(raw, { schema });
  } catch (err) {
    const e = err as yaml.YAMLException;
    issues.push({
      file: rel,
      line: e.mark?.line !== undefined ? e.mark.line + 1 : undefined,
      message: `invalid yaml: ${e.reason || e.message}`,
    });
    return issues;
  }

  checkSensitiveInTree(parsed, [], rel, issues);

  if (isHardwareOnly && parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const root = parsed as Record<string, unknown>;
    for (const key of Object.keys(root)) {
      if (HARDWARE_ONLY_FORBIDDEN.has(key)) {
        issues.push({
          file: rel,
          message: `config.yaml must be hardware-only — top-level \`${key}:\` belongs in a separate yaml file`,
        });
      }
    }
    // wifi: is allowed but must not contain user-network specifics.
    // `ap:` is allowed but only as an empty block — its sole purpose here is
    // to make the config bootable into ESPHome's default fallback hotspot;
    // any subkey under it (ssid, password, …) is user-shaped data.
    const wifi = root.wifi;
    if (wifi && typeof wifi === "object" && !Array.isArray(wifi)) {
      const wifiObj = wifi as Record<string, unknown>;
      for (const k of Object.keys(wifiObj)) {
        if (WIFI_USER_KEYS.has(k)) {
          issues.push({
            file: rel,
            message: `config.yaml \`wifi:\` must not contain user-specific \`${k}:\` — keep only radio/hardware tunables here`,
          });
        }
      }
      const ap = wifiObj.ap;
      if (ap !== undefined && ap !== null) {
        const isEmpty =
          (typeof ap === "object" && !Array.isArray(ap) &&
            Object.keys(ap as Record<string, unknown>).length === 0) ||
          ap === "";
        if (!isEmpty) {
          issues.push({
            file: rel,
            message: `config.yaml \`wifi.ap:\` must be empty — ESPHome's defaults give a usable fallback hotspot without device-baked credentials`,
          });
        }
      }
    }
    // Walk the parsed tree and flag any `platform: homeassistant` / `mqtt`
    // entry — these depend on a network/API connection at runtime.
    const visit = (node: unknown, pathStack: (string | number)[]): void => {
      if (Array.isArray(node)) {
        node.forEach((item, idx) => visit(item, [...pathStack, idx]));
        return;
      }
      if (node && typeof node === "object") {
        const obj = node as Record<string, unknown>;
        if (
          typeof obj.platform === "string" &&
          HARDWARE_ONLY_FORBIDDEN_PLATFORMS.has(obj.platform)
        ) {
          const where = pathStack.length > 0 ? pathStack.join(".") : "(root)";
          const reason =
            obj.platform === "template"
              ? "is a user-derived value, not hardware"
              : "depends on a network connection";
          issues.push({
            file: rel,
            message: `config.yaml must be hardware-only — \`platform: ${obj.platform}\` at \`${where}\` ${reason}`,
          });
        }
        for (const k of Object.keys(obj)) visit(obj[k], [...pathStack, k]);
      }
    };
    visit(parsed, []);
  }

  return issues;
}

// Walk subdirectories of devicesRoot only. Top-level files like
// `adding-devices.mdx` and `tuya-convert.md` are docs about the devices
// tree, not device pages — they contain illustrative yaml examples
// (inline frontmatter, `url=` demos) that aren't bound by the
// per-device rules. Real device pages always live one level deeper at
// `src/docs/devices/<Device>/index.md`.
function walkMarkdown(dir: string, out: string[], depth = 0): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      walkMarkdown(p, out, depth + 1);
    } else if (
      entry.isFile() &&
      depth > 0 &&
      /\.(md|mdx)$/i.test(entry.name)
    ) {
      out.push(p);
    }
  }
}

// Resolve the set of markdown files in `devicesRoot` that the current PR
// adds, modifies, renames, copies, or changes type for, between BASE_SHA
// and HEAD_SHA. Returns absolute paths so callers can match against the
// same form `walkMarkdown` produces. Returns null if the env vars are
// absent (the no-inline-yaml rule is then skipped — local runs and `push`
// builds don't have a meaningful diff base).
//
// `--name-status -z` (instead of `--diff-filter=… --name-only`) so we can
// see git's per-entry status code and pull the *new* path on R/C entries.
// Any entry whose new path lands on a device markdown counts as changed —
// including pure renames (`R100`). A pure rename is still a file
// modification from the contributor's perspective, and the new-rules
// requirement applies. Only `D` (deletion) and `U` (unmerged, shouldn't
// appear in CI) are ignored.
function findChangedMarkdown(devicesRoot: string): Set<string> | null {
  const base = process.env.BASE_SHA;
  const head = process.env.HEAD_SHA;
  if (!base || !head) return null;
  let out: string;
  try {
    out = execFileSync(
      "git",
      [
        "diff",
        "--name-status",
        "-z",
        `${base}..${head}`,
        "--",
        "src/docs/devices",
      ],
      { encoding: "utf8" }
    );
  } catch (err) {
    console.error(`git diff failed: ${(err as Error).message}`);
    process.exit(1);
  }
  const changed = new Set<string>();
  const tokens = out.split("\0");
  let i = 0;
  while (i < tokens.length) {
    const status = tokens[i];
    if (!status) { i++; continue; }
    const code = status[0];
    let candidatePath: string | null = null;
    if (code === "R" || code === "C") {
      // Format: <Rxx|Cxx>\0<old>\0<new> — take the new path, similarity
      // index ignored: any rename/copy onto a device markdown must follow
      // the rules.
      candidatePath = tokens[i + 2];
      i += 3;
    } else {
      // Format: <code>\0<path>
      const p = tokens[i + 1];
      i += 2;
      // A = added, M = modified, T = type change. D (deleted) and U
      // (unmerged — shouldn't appear in CI) are ignored.
      if (code === "A" || code === "M" || code === "T") candidatePath = p;
    }
    if (!candidatePath) continue;
    if (!/\.(md|mdx)$/i.test(candidatePath)) continue;
    const abs = path.resolve(process.cwd(), candidatePath);
    // Restrict to the devices tree (the path-spec already does, but be
    // defensive against future trigger changes).
    if (!abs.startsWith(devicesRoot + path.sep) && abs !== devicesRoot) continue;
    changed.add(abs);
  }
  return changed;
}

// Identify the device directories this PR newly adds — i.e. each
// `src/docs/devices/<Device>/index.md` that appears with git status `A`.
// A new device always introduces a new `index.md` one level under the
// devices root, so that addition is the signal. Renames (status `R`) move
// an existing device to a new slug and don't count; only true additions do
// (`C` copies, which git only emits with `-C`, are treated as additions
// defensively). Returns null when BASE_SHA/HEAD_SHA are absent (local runs
// and `push` builds have no meaningful diff base), so the one-device rule
// is enforced on pull_request events only.
function findAddedDevices(): string[] | null {
  const base = process.env.BASE_SHA;
  const head = process.env.HEAD_SHA;
  if (!base || !head) return null;
  let out: string;
  try {
    out = execFileSync(
      "git",
      ["diff", "--name-status", "-z", `${base}..${head}`, "--", "src/docs/devices"],
      { encoding: "utf8" }
    );
  } catch (err) {
    console.error(`git diff failed: ${(err as Error).message}`);
    process.exit(1);
  }
  const devices = new Set<string>();
  const tokens = out.split("\0");
  let i = 0;
  while (i < tokens.length) {
    const status = tokens[i];
    if (!status) { i++; continue; }
    const code = status[0];
    let candidatePath: string | null = null;
    if (code === "R" || code === "C") {
      // <Rxx|Cxx>\0<old>\0<new>. A rename relocates an existing device, so
      // it isn't a new one; a copy spawns a new device dir, so take the new
      // path.
      if (code === "C") candidatePath = tokens[i + 2];
      i += 3;
    } else {
      const p = tokens[i + 1];
      i += 2;
      if (code === "A") candidatePath = p;
    }
    if (!candidatePath) continue;
    const m = candidatePath.match(
      /^src\/docs\/devices\/([^/]+)\/index\.(?:md|mdx)$/i
    );
    if (m) devices.add(m[1]);
  }
  return [...devices].sort();
}

const ADDING_DEVICES_HELP_URL =
  "https://devices.esphome.io/devices/adding-devices#configuration-yaml-files";

// The report is posted verbatim as a bot review on the PR, and parts of it
// derive from fork-controlled input (device slugs, file paths). Insert a
// zero-width space after any `@` that precedes a word character so those
// values can't turn into `@mention` notifications to third parties.
function neutralizeMentions(text: string): string {
  return text.replace(/@(?=[A-Za-z0-9_-])/g, "@" + String.fromCharCode(0x200b));
}

// Render the collected issues as a markdown report suitable for a PR review
// body. Grouped by file so a contributor sees, per page, exactly what to fix.
// Written to the path in VALIDATION_REPORT (set in CI) so a follow-up
// workflow can surface it as a `REQUEST_CHANGES` review.
function buildReport(issues: Issue[]): string {
  const byFile = new Map<string, Issue[]>();
  for (const issue of issues) {
    const list = byFile.get(issue.file) ?? [];
    list.push(issue);
    byFile.set(issue.file, list);
  }

  const lines: string[] = [];
  lines.push("## ❌ Device configuration checks failed");
  lines.push("");
  lines.push(
    `The automated checks for the device pages in this pull request found ` +
      `**${issues.length} issue${issues.length === 1 ? "" : "s"}**. ` +
      `Please address the items below and push an update — this review ` +
      `refreshes automatically and will be dismissed once the checks pass.`
  );
  lines.push("");
  for (const file of [...byFile.keys()].sort()) {
    lines.push(`### \`${file}\``);
    for (const issue of byFile.get(file) ?? []) {
      const prefix = issue.line !== undefined ? `**line ${issue.line}** — ` : "";
      lines.push(`- ${prefix}${issue.message}`);
    }
    lines.push("");
  }
  lines.push("---");
  lines.push(`Need help? See the [Adding Devices guide](${ADDING_DEVICES_HELP_URL}).`);
  return neutralizeMentions(lines.join("\n") + "\n");
}

function main(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const devicesRoot = process.env.DEVICES_ROOT
    ? path.resolve(process.env.DEVICES_ROOT)
    : path.resolve(__dirname, "..", "src", "docs", "devices");

  if (!fs.existsSync(devicesRoot)) {
    console.error(`Devices root not found: ${devicesRoot}`);
    process.exit(1);
  }

  const issues: Issue[] = [];

  // Pages added or modified by the current PR (when BASE_SHA/HEAD_SHA are
  // set) must be on the migrated `file=`-based form — no inline yaml fences
  // allowed. Pages the PR doesn't touch are mid-migration and remain
  // unchecked here.
  const changedMarkdown = findChangedMarkdown(devicesRoot);

  // One device per pull request: a PR may add at most one new device page so
  // each can be reviewed on its own and a failure points at a single device.
  const addedDevices = findAddedDevices();
  if (addedDevices && addedDevices.length > 1) {
    issues.push({
      file: "src/docs/devices",
      message:
        `this PR adds ${addedDevices.length} new devices ` +
        `(${addedDevices.map((d) => `\`${d}\``).join(", ")}) — ` +
        "add a single device per pull request and split the rest into separate PRs. " +
        `See ${ADDING_DEVICES_HELP_URL}`,
    });
  }

  // Walk markdown first to collect every yaml file referenced via a `file=`
  // fence. Pre-existing yaml files that no markdown points at (legacy
  // downloadable examples) are intentionally out of scope: this validator
  // gates the migrated `file=`-based form.
  const mdFiles: string[] = [];
  walkMarkdown(devicesRoot, mdFiles);

  const referencedYaml = new Set<string>();
  for (const md of mdFiles) {
    const rawMd = fs.readFileSync(md, "utf8");
    const fences = findYamlFences(rawMd);
    const rel = path.relative(process.cwd(), md);
    const isChangedPage = changedMarkdown?.has(md) ?? false;
    const madeForEsphome = isMadeForEsphome(rawMd);

    const refs = fences.filter(
      (f): f is YamlFence & { fileAttr: string } => f.fileAttr !== null
    );

    if (isChangedPage) {
      for (const f of fences) {
        // A fence is "inline" only when it has neither `file=` nor `url=`.
        // `url=` blocks pull from the manufacturer's repo at visit time —
        // they're a valid migrated form for made-for-esphome devices that
        // don't want their config vendored into this repo. The bare `inline`
        // marker is an explicit opt-out for tiny snippets that shouldn't be
        // extracted to a file at all.
        if (f.fileAttr === null && f.urlAttr === null && !f.inline) {
          issues.push({
            file: rel,
            line: f.lineNumber,
            message:
              "added or modified device pages must use `file=`- or `url=`-based yaml fences — inline yaml is no longer accepted; move the config into a sibling yaml file and reference it. " +
              `See ${ADDING_DEVICES_HELP_URL}`,
          });
        }
      }

      // Made-for-ESPHome devices certify that their config is open and
      // available to end users (see .github/made-for-esphome-checklist.md).
      // The way we surface that on a device page is a `url=` yaml fence
      // pointing at the manufacturer's repo so the rendered page shows the
      // current upstream config. Require at least one such fence on every
      // PR that adds or modifies a made-for-esphome page.
      if (madeForEsphome) {
        const hasGitHubUrlFence = fences.some(
          (f) => f.urlAttr !== null && isAllowedGitHubUrl(f.urlAttr)
        );
        if (!hasGitHubUrlFence) {
          issues.push({
            file: rel,
            message:
              "`made-for-esphome: true` pages must include a yaml fence with `url=` pointing at a `.yaml` file in the manufacturer's GitHub repo — e.g. ```` ```yaml url=https://github.com/<owner>/<repo>/blob/<ref>/<path>.yaml ```` (or the `raw.githubusercontent.com` equivalent) — so the rendered page shows the upstream config live. " +
              `See ${ADDING_DEVICES_HELP_URL}`,
          });
        }
      }
    }

    if (refs.length === 0) continue;
    if (refs[0].fileAttr.toLowerCase() !== "config.yaml") {
      issues.push({
        file: rel,
        line: refs[0].lineNumber,
        message: `first yaml fence must reference \`config.yaml\` (saw \`${refs[0].fileAttr}\`)`,
      });
    }
    const dir = path.dirname(md);
    for (const r of refs) {
      const yamlAbs = path.resolve(dir, r.fileAttr);
      referencedYaml.add(yamlAbs);
    }
  }

  const yamlFiles = [...referencedYaml].sort();
  for (const f of yamlFiles) {
    const isConfig = path.basename(f).toLowerCase() === "config.yaml";
    issues.push(...checkYamlFile(f, isConfig));
  }

  if (issues.length === 0) {
    console.log(`Validated ${yamlFiles.length} yaml file(s) — clean.`);
    return;
  }

  const reportPath = process.env.VALIDATION_REPORT;
  if (reportPath) {
    fs.writeFileSync(reportPath, buildReport(issues), "utf8");
  }

  console.error(`Found ${issues.length} issue(s):`);
  for (const i of issues) {
    const loc = i.line !== undefined ? `${i.file}:${i.line}` : i.file;
    console.error(`  ${loc}  ${i.message}`);
  }
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
