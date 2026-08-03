#!/usr/bin/env tsx
/**
 * Automated, deterministic Made-for-ESPHome (m4e) PR review.
 *
 * For every `src/docs/devices/<Device>/index.md` this PR adds or modifies
 * whose frontmatter carries `made-for-esphome: true`, this script:
 *
 *   1. Extracts the first ```yaml url=<URL>``` fence (the canonical link to
 *      the manufacturer's upstream config). If there is none, that is the
 *      only finding for the page — nothing to compile.
 *   2. Downloads the whole upstream repo tree at the pinned ref (not just the
 *      one file) so relative `!include`s and sibling packages resolve exactly
 *      as they do upstream.
 *   3. Writes a `secrets.yaml` next to the config containing ONLY placeholder
 *      `wifi_ssid` / `wifi_password` — the pair the ESPHome Builder supplies
 *      on adoption. A dependency on any OTHER `!secret` therefore makes
 *      expansion fail, which is itself a valid "does not build without user
 *      secrets" finding.
 *   4. Runs `esphome config <file>` to fully expand packages/includes/removes
 *      and validate the schema, capturing the expanded document.
 *   5. If that succeeds, runs `esphome compile <file>` to prove the config
 *      builds out of the box.
 *   6. Runs the m4e checklist as pure structural checks against the EXPANDED
 *      config (expansion is what resolves the real, as-compiled shape).
 *   7. Emits a structured markdown report (when there are blocking findings)
 *      for a follow-up `workflow_run` job to post as an esphome[bot] review.
 *
 * SECURITY: compiling a fork PR's linked YAML runs the ESPHome/PlatformIO
 * toolchain on contributor-controlled input (`external_components` can execute
 * arbitrary code at codegen time). This script is therefore designed to run
 * ONLY in the secret-free `pull_request` context with no secrets and minimal
 * permissions. It reads the tree, reaches out to GitHub/PlatformIO over the
 * network, and writes a report artifact — nothing else. The review-posting
 * job runs separately on `workflow_run` and never executes PR code.
 *
 * The checklist source of truth is `.github/made-for-esphome-checklist.md`.
 *
 * Modes:
 *   (default)   review changed m4e pages, write report to MFE_REVIEW_REPORT
 *   --detect    only report whether any changed page is m4e (for CI gating);
 *               writes `run=<bool>`/`count=<n>` to $GITHUB_OUTPUT (or stdout)
 *
 * Environment:
 *   BASE_SHA / HEAD_SHA  git diff range used to find changed device pages
 *   MFE_PAGES            explicit space/comma-separated page paths (bypasses
 *                        git detection — for local runs)
 *   MFE_REVIEW_REPORT    path to write the markdown report to (findings only)
 *   ESPHOME_BIN          esphome executable (default: "esphome")
 *   MFE_COMPILE          "0" to skip the compile step (config + checks only)
 *   MFE_WORK_DIR         base dir for downloads (default: a fresh mkdtemp)
 *   CONFIG_TIMEOUT_MS    per-page `esphome config` timeout (default 180000)
 *   COMPILE_TIMEOUT_MS   per-page `esphome compile` timeout (default 1500000)
 *   DEVICES_ROOT         override src/docs/devices location (tests)
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync } from "child_process";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import yaml from "js-yaml";

// ---------------------------------------------------------------------------
// Shared conventions (kept in step with scripts/validate-yaml-configs.ts)
// ---------------------------------------------------------------------------

const URL_HOST_ALLOWLIST = new Set(["github.com", "raw.githubusercontent.com"]);
const YAML_EXT = /\.ya?ml$/i;

// The only secrets we provide. Any config that references anything else fails
// `esphome config` — surfaced as a "depends on user secrets" finding.
const PLACEHOLDER_SECRETS: Record<string, string> = {
  wifi_ssid: "placeholder_ssid",
  wifi_password: "placeholder_password",
};
const ALLOWED_SECRET_NAMES = new Set(Object.keys(PLACEHOLDER_SECRETS));

const CHECKLIST_URL =
  "https://github.com/esphome/esphome-devices/blob/main/.github/made-for-esphome-checklist.md";

// Made for ESPHome requires an `id:` on every component — not just named
// entities, but buses and hubs too (uart, i2c, spi, canbus, modbus, …). We
// therefore check EVERY top-level list domain rather than a curated entity
// allowlist. A handful of top-level list domains are platform/automation lists
// whose entries legitimately carry no id; those are exempted here. (Confirmed
// against known-good configs: e.g. the NeatoFx `ota:` platforms and `interval:`
// automations carry no ids, while its `canbus:` bus does.)
const NON_ID_LIST_DOMAINS = new Set([
  "ota", // list of OTA platforms (`- platform: esphome`, …) — no id
  "interval", // anonymous time automations — no id
  "external_components", // source specs (`- source: github://…`) — no id
  "packages", // mapping in practice, but guard anyway
]);

interface GitHubYamlRef {
  owner: string;
  repo: string;
  ref: string;
  filePath: string;
}

// Parse the exact GitHub URL shapes remark-yaml-include (and the validator)
// accept, returning the pieces needed to fetch the whole repo at the ref:
//   raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>.y[a]ml
//   raw.githubusercontent.com/<owner>/<repo>/refs/(heads|tags)/<ref>/<path>
//   github.com/<owner>/<repo>/(blob|raw)/<ref>/<path>.y[a]ml
//   github.com/<owner>/<repo>/(blob|raw)/refs/(heads|tags)/<ref>/<path>
// Returns null for anything else (repo roots, directory listings, HTML pages).
function parseGitHubYamlUrl(value: string): GitHubYamlRef | null {
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (!URL_HOST_ALLOWLIST.has(u.hostname)) return null;

  const segments = u.pathname.replace(/^\/+|\/+$/g, "").split("/");

  let pathStart: number;
  if (u.hostname === "raw.githubusercontent.com") {
    if (segments.length < 4) return null;
    pathStart =
      segments[2] === "refs" &&
      (segments[3] === "heads" || segments[3] === "tags")
        ? 5
        : 3;
  } else {
    if (segments.length < 5) return null;
    if (segments[2] !== "blob" && segments[2] !== "raw") return null;
    pathStart =
      segments[3] === "refs" &&
      (segments[4] === "heads" || segments[4] === "tags")
        ? 6
        : 4;
  }
  if (segments.length <= pathStart) return null; // no path past the ref
  const lastSeg = segments[segments.length - 1];
  if (!YAML_EXT.test(lastSeg)) return null;

  const owner = segments[0];
  const repo = segments[1];
  const ref = segments[pathStart - 1];
  const filePath = segments.slice(pathStart).join("/");
  if (!owner || !repo || !ref || !filePath) return null;
  return { owner, repo, ref, filePath };
}

// Truthy `made-for-esphome` covers the YAML boolean and the rare string form.
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

function pageTitle(content: string): string | null {
  try {
    const t = (matter(content).data as Record<string, unknown>)["title"];
    return typeof t === "string" ? t : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// YAML fence extraction (mirrors validate-yaml-configs.ts:findYamlFences)
// ---------------------------------------------------------------------------

interface YamlFence {
  fileAttr: string | null;
  urlAttr: string | null;
  inline: boolean;
  lineNumber: number;
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
    const fileMatch = meta.match(
      /(^|\s)file=(?:"([^"]+)"|'([^']+)'|([^\s"']+))/
    );
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

// ---------------------------------------------------------------------------
// Expanded-YAML parsing — tolerate ESPHome custom tags, re-stamping scalar
// tags (so `!secret wifi_password` parses to the string "!secret wifi_password"
// and the password check can recognise it as a non-literal reference).
// ---------------------------------------------------------------------------

const ESPHOME_SCHEMA = yaml.DEFAULT_SCHEMA.extend(
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

// ---------------------------------------------------------------------------
// Findings & per-page results
// ---------------------------------------------------------------------------

type CheckStatus = "OK" | "MISSING" | "NEEDS-HUMAN-CHECK" | "FAIL" | "N/A";

interface CheckResult {
  item: string;
  status: CheckStatus;
  detail: string;
}

type CompileOutcome = "PASS" | "FAIL" | "INCONCLUSIVE" | "SKIPPED";

interface PageResult {
  page: string; // repo-relative markdown path
  url: string | null; // upstream url= (null when fence missing)
  fenceMissing: boolean;
  fatalError: string | null; // repo/url/download problem — no compile possible
  configOk: boolean | null; // null when not attempted
  configInconclusive: boolean; // config could not run (network/toolchain) — non-blocking
  configError: string | null; // trimmed `esphome config` error
  compile: CompileOutcome;
  compileLog: string | null; // trimmed tail on FAIL
  checks: CheckResult[];
}

// A page needs a blocking review when it has a hard failure: a missing/broken
// fence, an unreachable repo, a config that will not expand, a failed compile,
// or any MISSING/FAIL checklist item. NEEDS-HUMAN-CHECK notes and an
// INCONCLUSIVE (timed-out) compile are informational and do not block on their
// own — they ride along in the report only when something else already blocks.
function pageBlocks(r: PageResult): boolean {
  if (r.fenceMissing || r.fatalError) return true;
  if (r.configOk === false) return true;
  if (r.compile === "FAIL") return true;
  return r.checks.some((c) => c.status === "MISSING" || c.status === "FAIL");
}

// ---------------------------------------------------------------------------
// Changed-page detection
// ---------------------------------------------------------------------------

// Device index.md files this PR adds/modifies/renames between BASE_SHA and
// HEAD_SHA. Returns null when the env vars are absent (local runs / push).
function findChangedDevicePages(devicesRoot: string): Set<string> | null {
  const base = process.env.BASE_SHA;
  const head = process.env.HEAD_SHA;
  if (!base || !head) return null;
  // Derive the git pathspec from devicesRoot so a DEVICES_ROOT override stays
  // consistent with the filter below.
  const relRoot = path.relative(process.cwd(), devicesRoot) || ".";
  let out: string;
  try {
    out = execFileSync(
      "git",
      ["diff", "--name-status", "-z", `${base}..${head}`, "--", relRoot],
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
    if (!status) {
      i++;
      continue;
    }
    const code = status[0];
    let candidatePath: string | null = null;
    if (code === "R" || code === "C") {
      candidatePath = tokens[i + 2];
      i += 3;
    } else {
      const p = tokens[i + 1];
      i += 2;
      if (code === "A" || code === "M" || code === "T") candidatePath = p;
    }
    if (!candidatePath) continue;
    const abs = path.resolve(process.cwd(), candidatePath);
    if (!abs.startsWith(devicesRoot + path.sep)) continue;
    // Only depth-1 device pages: <devicesRoot>/<dir>/index.(md|mdx).
    if (!/^[^/\\]+[/\\]index\.(?:md|mdx)$/i.test(path.relative(devicesRoot, abs))) {
      continue;
    }
    changed.add(abs);
  }
  return changed;
}

// Resolve the list of in-scope m4e page absolute paths. Prefers an explicit
// MFE_PAGES list (local testing); otherwise diffs the PR and keeps pages whose
// head content is made-for-esphome.
function resolveScopePages(devicesRoot: string): string[] {
  const explicit = process.env.MFE_PAGES;
  if (explicit) {
    return explicit
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((p) => path.resolve(process.cwd(), p));
  }
  const changed = findChangedDevicePages(devicesRoot);
  if (changed === null) return [];
  const scope: string[] = [];
  for (const abs of changed) {
    if (!fs.existsSync(abs)) continue; // deleted at head
    const content = fs.readFileSync(abs, "utf8");
    if (isMadeForEsphome(content)) scope.push(abs);
  }
  return scope.sort();
}

// ---------------------------------------------------------------------------
// Upstream download
// ---------------------------------------------------------------------------

const MAX_TARBALL_BYTES = 300 * 1024 * 1024; // guard against abuse

// Download and extract the repo tarball at `ref`, returning the extracted root
// directory. Throws with a human-readable message on any failure.
async function downloadRepo(
  ref: GitHubYamlRef,
  workDir: string
): Promise<string> {
  const url = `https://codeload.github.com/${ref.owner}/${ref.repo}/tar.gz/${ref.ref}`;
  const tarPath = path.join(workDir, "repo.tar.gz");

  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow" });
  } catch (err) {
    throw new Error(`network error fetching ${url}: ${(err as Error).message}`);
  }
  if (!res.ok) {
    throw new Error(
      `could not download ${ref.owner}/${ref.repo}@${ref.ref} (HTTP ${res.status}) — ` +
        `is the repository public and the ref valid?`
    );
  }
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > MAX_TARBALL_BYTES) {
    throw new Error(
      `repository archive is ${(declared / 1e6).toFixed(0)} MB — too large to review automatically`
    );
  }
  if (!res.body) throw new Error("empty response body from codeload");

  const out = fs.createWriteStream(tarPath);
  let received = 0;
  try {
    // res.body is a web ReadableStream; async-iterable on Node 18+.
    for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
      received += chunk.length;
      if (received > MAX_TARBALL_BYTES) {
        out.destroy();
        throw new Error("repository archive exceeded the size limit mid-download");
      }
      if (!out.write(chunk)) {
        await new Promise<void>((resolve) => out.once("drain", () => resolve()));
      }
    }
  } finally {
    await new Promise<void>((resolve) => out.end(() => resolve()));
  }

  const extractDir = path.join(workDir, "extracted");
  fs.mkdirSync(extractDir, { recursive: true });
  try {
    execFileSync("tar", ["xzf", tarPath, "-C", extractDir], {
      encoding: "utf8",
    });
  } catch (err) {
    throw new Error(`failed to extract archive: ${(err as Error).message}`);
  }
  fs.rmSync(tarPath, { force: true });

  // codeload archives contain a single top-level directory.
  const tops = fs
    .readdirSync(extractDir, { withFileTypes: true })
    .filter((e) => e.isDirectory());
  if (tops.length !== 1) {
    throw new Error(
      `unexpected archive layout (${tops.length} top-level entries)`
    );
  }
  return path.join(extractDir, tops[0].name);
}

// ---------------------------------------------------------------------------
// esphome invocation
// ---------------------------------------------------------------------------

interface ExecResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

function runEsphome(
  bin: string,
  subcommand: "config" | "compile",
  configFile: string,
  cwd: string,
  timeoutMs: number
): ExecResult {
  try {
    const stdout = execFileSync(bin, [subcommand, configFile], {
      cwd,
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, stdout, stderr: "", timedOut: false };
  } catch (err) {
    const e = err as NodeJS.ErrnoException & {
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      killed?: boolean;
      signal?: string;
    };
    const timedOut = Boolean(e.killed) && e.signal === "SIGTERM";
    return {
      ok: false,
      stdout: e.stdout ? e.stdout.toString() : "",
      stderr: e.stderr ? e.stderr.toString() : e.message ?? "",
      timedOut,
    };
  }
}

// `esphome config` redacts secret/password values by wrapping them in SGR
// "conceal" escapes (ESC[8m…ESC[28m) and colourises other output. When stdout
// is not a TTY (as in CI, and when we capture the pipe) esphome writes those
// sequences as the LITERAL four-character text `\033[…m` rather than real
// escape bytes — so an empty concealed password comes through as the string
// "\033[8m\033[28m". Strip both the real-byte and literal-text forms before
// parsing so such a password reads as "" and other concealed scalars read as
// their plain text.
function stripAnsi(text: string): string {
  return (
    text
      // eslint-disable-next-line no-control-regex
      .replace(/\x1b\[[0-9;]*[A-Za-z]/g, "")
      .replace(/\\(?:033|x1b|e)\[[0-9;]*[A-Za-z]/g, "")
  );
}

function tail(text: string, lines: number): string {
  const all = text.replace(/\s+$/, "").split(/\r?\n/);
  if (all.length <= lines) return all.join("\n");
  return all.slice(all.length - lines).join("\n");
}

// Classify a failed `esphome config`. Returns a human-readable finding string
// and whether it looks like a network/toolchain problem (inconclusive) rather
// than a genuine config error.
function classifyConfigError(r: ExecResult): {
  message: string;
  network: boolean;
} {
  const blob = `${r.stderr}\n${r.stdout}`;
  const secret = blob.match(/Secret '([^']+)' not defined/);
  if (secret) {
    return {
      message:
        `config depends on \`!secret ${secret[1]}\` — the ESPHome Builder only ` +
        "supplies `wifi_ssid`/`wifi_password` on adoption, so this will not " +
        "build out of the box. Provide a sensible default in the config instead " +
        "of requiring the user to define this secret.",
      network: false,
    };
  }
  if (/Error reading file secrets\.yaml/.test(blob)) {
    // Should not happen — we always write secrets.yaml. Treat as network/env.
    return { message: "internal: secrets.yaml was not found", network: true };
  }
  if (
    /Failed to clone|Could not clone|unable to access|Connection (timed out|refused)|Temporary failure in name resolution|Network is unreachable|Could not resolve host/i.test(
      blob
    )
  ) {
    return {
      message:
        "could not fetch a remote package/component while expanding the config " +
        "(network or upstream repo problem) — treat this run as inconclusive",
      network: true,
    };
  }
  return { message: tail(blob, 30), network: false };
}

// ---------------------------------------------------------------------------
// Structural checklist checks against the expanded config
// ---------------------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

// "for ESPHome" suffix is allowed; any other occurrence of "esphome" in a
// project-facing name is not.
function nameViolatesEsphomeRule(name: string): boolean {
  if (!/esphome/i.test(name)) return false;
  const withoutSuffix = name.replace(/\bfor\s+esphome\s*$/i, "");
  return /esphome/i.test(withoutSuffix);
}

interface MissingId {
  domain: string;
  index: number;
  name: string | null;
  platform: string | null;
}

function entryHasId(entry: Record<string, unknown>): boolean {
  return typeof entry.id === "string" && entry.id.trim() !== "";
}

// A container/aggregate platform entry (e.g. `wifi_info`, `sun`) exposes its
// real entities as nested mappings that each carry their own `name:` (and can
// carry their own `id:`); the top-level entry takes no id itself. Detect that
// shape so we don't demand an id where one cannot go: no top-level id, no
// top-level name, but at least one child mapping that has a `name:`.
function isContainerEntry(entry: Record<string, unknown>): boolean {
  if (typeof entry.name === "string") return false;
  for (const value of Object.values(entry)) {
    if (isObject(value) && typeof value.name === "string") return true;
  }
  return false;
}

// Every component in the expanded config must carry an `id:`. Walk every
// top-level list domain (entities, buses, hubs, outputs, …) except the
// known non-id automation/platform domains, and flag each mapping entry
// lacking an id.
function collectMissingIds(cfg: Record<string, unknown>): MissingId[] {
  const missing: MissingId[] = [];
  for (const domain of Object.keys(cfg)) {
    if (NON_ID_LIST_DOMAINS.has(domain)) continue;
    const list = cfg[domain];
    if (!Array.isArray(list)) continue;
    list.forEach((entry, index) => {
      if (!isObject(entry)) return;
      if (entryHasId(entry)) return;
      if (isContainerEntry(entry)) return;
      missing.push({
        domain,
        index,
        name: typeof entry.name === "string" ? entry.name : null,
        platform: typeof entry.platform === "string" ? entry.platform : null,
      });
    });
  }
  return missing;
}

function describeMissingId(m: MissingId): string {
  const plat = m.platform ? ` (${m.platform})` : "";
  const label = m.name ? ` “${m.name}”` : ` #${m.index + 1}`;
  return `\`${m.domain}\`${plat}${label}`;
}

// Walk the expanded tree for password/psk keys carrying a baked-in credential.
// After `esphome config`, `!secret` refs survive as `"!secret <name>"` strings;
// the only defined secrets are the wifi pair, so a surviving `!secret` is
// always user-supplied wifi creds and is fine. Any non-empty literal is a
// baked-in password and is flagged.
const PASSWORD_KEY = /^([\w-]*password[\w-]*|psk)$/i;

function collectBakedPasswords(
  node: unknown,
  pathStack: (string | number)[],
  out: string[]
): void {
  if (Array.isArray(node)) {
    node.forEach((item, idx) =>
      collectBakedPasswords(item, [...pathStack, idx], out)
    );
    return;
  }
  if (!isObject(node)) return;
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (PASSWORD_KEY.test(key) && typeof value === "string") {
      const trimmed = value.trim();
      const isSecretRef = /^!secret\s+(\S+)/.exec(trimmed);
      if (trimmed === "") {
        // empty password (e.g. ota `password: ""`) is fine
      } else if (isSecretRef) {
        // Surviving !secret => wifi pair (only defined secrets) => fine.
        if (!ALLOWED_SECRET_NAMES.has(isSecretRef[1])) {
          out.push(
            `\`${[...pathStack, key].join(".")}\` references \`!secret ${isSecretRef[1]}\``
          );
        }
      } else {
        out.push(`\`${[...pathStack, key].join(".")}\` has a baked-in value`);
      }
    }
    collectBakedPasswords(value, [...pathStack, key], out);
  }
}

// Any non-wifi `!secret` that survived expansion (belt-and-suspenders: config
// would normally have failed first).
function collectStraySecrets(text: string): Set<string> {
  const stray = new Set<string>();
  const re = /!secret\s+'?([A-Za-z0-9_]+)'?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (!ALLOWED_SECRET_NAMES.has(m[1])) stray.add(m[1]);
  }
  return stray;
}

function collectManualIps(cfg: Record<string, unknown>): string[] {
  const found: string[] = [];
  for (const key of ["wifi", "ethernet"]) {
    const block = cfg[key];
    if (isObject(block) && block.manual_ip !== undefined && block.manual_ip !== null) {
      found.push(key);
    }
  }
  return found;
}

function runChecklist(
  cfg: Record<string, unknown>,
  expandedText: string,
  title: string | null,
  compile: CompileOutcome
): CheckResult[] {
  const checks: CheckResult[] = [];
  const hasWifi = isObject(cfg.wifi) || cfg.wifi === null;

  // 1. ESP32 or supported variant.
  const esp32 = cfg.esp32;
  if (isObject(esp32)) {
    const board = typeof esp32.board === "string" ? esp32.board : "?";
    const variant = typeof esp32.variant === "string" ? esp32.variant : "";
    checks.push({
      item: "ESP32 or supported variant",
      status: "OK",
      detail: variant ? `board: ${board}, variant: ${variant}` : `board: ${board}`,
    });
  } else if (isObject(cfg.esp8266)) {
    checks.push({
      item: "ESP32 or supported variant",
      status: "FAIL",
      detail: "config targets `esp8266:` — not a supported Made for ESPHome platform",
    });
  } else {
    checks.push({
      item: "ESP32 or supported variant",
      status: "MISSING",
      detail: "no `esp32:` block in the expanded config",
    });
  }

  // 2. Valid ESPHome config.
  checks.push({
    item: "Valid ESPHome configuration",
    status: isObject(cfg.esphome) ? "OK" : "MISSING",
    detail: isObject(cfg.esphome)
      ? "`esphome:` block present and the config expands/validates"
      : "no `esphome:` block",
  });

  // 3. Project name does not contain "ESPHome" (except a trailing "for ESPHome").
  const nameCandidates: { label: string; value: string }[] = [];
  if (title) nameCandidates.push({ label: "page title", value: title });
  const esphomeBlock = isObject(cfg.esphome) ? cfg.esphome : {};
  for (const key of ["name", "friendly_name"] as const) {
    const v = esphomeBlock[key];
    if (typeof v === "string") nameCandidates.push({ label: `esphome.${key}`, value: v });
  }
  const project = isObject(esphomeBlock.project) ? esphomeBlock.project : null;
  if (project && typeof project.name === "string") {
    nameCandidates.push({ label: "project.name", value: project.name });
  }
  const nameViolations = nameCandidates.filter((c) =>
    nameViolatesEsphomeRule(c.value)
  );
  checks.push({
    item: 'Project name free of "ESPHome"',
    status: nameViolations.length ? "FAIL" : "OK",
    detail: nameViolations.length
      ? nameViolations.map((c) => `${c.label}: "${c.value}"`).join("; ")
      : "no disallowed use of “ESPHome” in the project-facing names",
  });

  // 4. esp32_improv (when wifi present).
  if (hasWifi) {
    const present = cfg.esp32_improv !== undefined;
    checks.push({
      item: "esp32_improv (Wi-Fi provisioning)",
      status: present ? "OK" : "MISSING",
      detail: present
        ? "`esp32_improv:` present"
        : "device uses Wi-Fi but has no `esp32_improv:` block — users cannot provision Wi-Fi over BLE",
    });
  } else {
    checks.push({
      item: "esp32_improv (Wi-Fi provisioning)",
      status: "N/A",
      detail: "no `wifi:` block — Improv-over-BLE not applicable",
    });
  }

  // 5. improv_serial (needs USB port to be meaningful).
  const improvSerial = cfg.improv_serial !== undefined;
  checks.push({
    item: "improv_serial (USB provisioning)",
    status: improvSerial ? "OK" : "NEEDS-HUMAN-CHECK",
    detail: improvSerial
      ? "`improv_serial:` present"
      : "no `improv_serial:` block — required only if the device exposes a USB port; confirm the hardware",
  });

  // 6. dashboard_import with package_import_url.
  const di = cfg.dashboard_import;
  if (isObject(di) && typeof di.package_import_url === "string") {
    checks.push({
      item: "dashboard_import",
      status: "OK",
      detail: `package_import_url: ${di.package_import_url}`,
    });
  } else if (isObject(di)) {
    checks.push({
      item: "dashboard_import",
      status: "MISSING",
      detail: "`dashboard_import:` present but has no `package_import_url:`",
    });
  } else {
    checks.push({
      item: "dashboard_import",
      status: "MISSING",
      detail: "no `dashboard_import:` block — users cannot take control via the ESPHome Builder",
    });
  }

  // 7. ota list contains `- platform: esphome`.
  const ota = cfg.ota;
  const otaHasEsphome =
    Array.isArray(ota) && ota.some((e) => isObject(e) && e.platform === "esphome");
  checks.push({
    item: "ota: `- platform: esphome`",
    status: otaHasEsphome ? "OK" : "MISSING",
    detail: otaHasEsphome
      ? "OTA over the ESPHome protocol is enabled"
      : "no `- platform: esphome` entry under `ota:` — required so users can push OTA updates",
  });

  // 8. update list contains `- platform: http_request`.
  const update = cfg.update;
  const updateHasHttp =
    Array.isArray(update) &&
    update.some((e) => isObject(e) && e.platform === "http_request");
  checks.push({
    item: "update: `- platform: http_request`",
    status: updateHasHttp ? "OK" : "MISSING",
    detail: updateHasHttp
      ? "http_request update source is present"
      : "no `- platform: http_request` entry under `update:` — required so users receive firmware updates",
  });

  // 9. Serial flashing not disabled. ESPHome has no single canonical switch;
  // flag only the obvious `logger: baud_rate: 0` (UART logging off). Anything
  // subtler is left for the human at flash time.
  const logger = cfg.logger;
  const serialOff = isObject(logger) && logger.baud_rate === 0;
  checks.push({
    item: "Serial flashing not disabled",
    status: serialOff ? "NEEDS-HUMAN-CHECK" : "OK",
    detail: serialOff
      ? "`logger:` sets `baud_rate: 0` (serial logging off) — confirm serial flashing still works"
      : "no obvious serial-disabling configuration",
  });

  // 10. No baked-in passwords.
  const bakedPasswords: string[] = [];
  collectBakedPasswords(cfg, [], bakedPasswords);
  checks.push({
    item: "No passwords in the configuration",
    status: bakedPasswords.length ? "FAIL" : "OK",
    detail: bakedPasswords.length
      ? bakedPasswords.join("; ")
      : "no baked-in passwords (user-supplied Wi-Fi secrets are fine)",
  });

  // 11. No secret references beyond the Wi-Fi pair.
  const stray = collectStraySecrets(expandedText);
  checks.push({
    item: "No references to non-standard secrets",
    status: stray.size ? "FAIL" : "OK",
    detail: stray.size
      ? `references \`!secret\`: ${[...stray].map((s) => `\`${s}\``).join(", ")}`
      : "only the standard `wifi_ssid`/`wifi_password` pair is referenced",
  });

  // 12. No static IPs.
  const manualIps = collectManualIps(cfg);
  checks.push({
    item: "No static IP addresses",
    status: manualIps.length ? "FAIL" : "OK",
    detail: manualIps.length
      ? `\`manual_ip:\` set under ${manualIps.map((k) => `\`${k}\``).join(", ")}`
      : "no `manual_ip:` under `wifi:`/`ethernet:`",
  });

  // 13. Every component has an id (entities, buses, hubs, outputs, …).
  const missingIds = collectMissingIds(cfg);
  checks.push({
    item: "Every entity/component has an `id:`",
    status: missingIds.length ? "MISSING" : "OK",
    detail: missingIds.length
      ? `${missingIds.length} without an id: ` +
        missingIds.slice(0, 12).map(describeMissingId).join(", ") +
        (missingIds.length > 12 ? ", …" : "")
      : "all components define an `id:`",
  });

  // 14. Compiles without user changes.
  const compileStatus: CheckStatus =
    compile === "PASS"
      ? "OK"
      : compile === "FAIL"
        ? "FAIL"
        : compile === "INCONCLUSIVE"
          ? "NEEDS-HUMAN-CHECK"
          : "NEEDS-HUMAN-CHECK";
  const compileDetail =
    compile === "PASS"
      ? "`esphome compile` succeeded with only placeholder Wi-Fi secrets"
      : compile === "FAIL"
        ? "`esphome compile` failed — see the compile log above"
        : compile === "INCONCLUSIVE"
          ? "`esphome compile` did not finish within the time limit — verify manually"
          : "compile step was skipped — verify manually";
  checks.push({
    item: "Compiles without user changes",
    status: compileStatus,
    detail: compileDetail,
  });

  return checks;
}

// ---------------------------------------------------------------------------
// OTA update manifest + binary validation
//
// A live `update: - platform: http_request` entity that points at a dead
// manifest or a missing/mismatched .bin fails silently at runtime, defeating
// the "works out of the box" guarantee. Driven off the EXPANDED config so it
// works regardless of how packages/includes are layered. Pure shape checks
// (validateManifest / variantToChipFamily / resolveBinaryUrl) are unit-tested;
// the network fetches are exercised against live fixtures behind MFE_LIVE_TESTS.
// ---------------------------------------------------------------------------

interface ManifestBuildOta {
  path?: unknown;
  md5?: unknown;
}
interface ManifestBuild {
  chipFamily?: unknown;
  ota?: ManifestBuildOta;
}
interface Manifest {
  name?: unknown;
  version?: unknown;
  builds?: unknown;
}

// Map an ESPHome `esp32: variant:` (e.g. "ESP32", "ESP32C3", "ESP32S3") to the
// ESP Web Tools manifest `chipFamily` spelling ("ESP32", "ESP32-C3", …).
function variantToChipFamily(variant: string): string {
  const m = /^ESP32([A-Z]\d+)$/i.exec(variant.trim());
  if (m) return `ESP32-${m[1].toUpperCase()}`;
  return variant.trim().toUpperCase();
}

// The chip the compiled firmware actually targets, in manifest spelling.
function chipFamilyFromConfig(cfg: Record<string, unknown>): string | null {
  const esp32 = cfg.esp32;
  if (isObject(esp32)) {
    const variant =
      typeof esp32.variant === "string" && esp32.variant.trim() !== ""
        ? esp32.variant
        : "ESP32";
    return variantToChipFamily(variant);
  }
  if (isObject(cfg.esp8266)) return "ESP8266";
  return null;
}

// Normalise chipFamily strings so "ESP32-C3" and "ESP32C3" compare equal.
function normalizeChip(s: string): string {
  return s.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function resolveBinaryUrl(otaPath: string, manifestUrl: string): string | null {
  try {
    return new URL(otaPath, manifestUrl).toString();
  } catch {
    return null;
  }
}

interface ManifestValidation {
  problems: string[]; // MUST-FIX reasons about shape/fields/chipFamily
  matchBuild: ManifestBuild | null; // build matching the device chip (binary to check)
  chipFamilies: string[]; // every chipFamily the manifest advertises
}

// Pure validation of a parsed manifest against the device's chipFamily.
function validateManifest(
  manifest: unknown,
  chipFamily: string | null
): ManifestValidation {
  const problems: string[] = [];
  if (!isObject(manifest)) {
    return { problems: ["manifest is not a JSON object"], matchBuild: null, chipFamilies: [] };
  }
  const m = manifest as Manifest;
  if (typeof m.name !== "string" || m.name.trim() === "") {
    problems.push("missing `name`");
  }
  if (typeof m.version !== "string" || m.version.trim() === "") {
    problems.push("missing `version`");
  }
  if (!Array.isArray(m.builds) || m.builds.length === 0) {
    problems.push("`builds[]` is missing or empty");
    return { problems, matchBuild: null, chipFamilies: [] };
  }

  const chipFamilies: string[] = [];
  let matchBuild: ManifestBuild | null = null;
  m.builds.forEach((raw, idx) => {
    if (!isObject(raw)) {
      problems.push(`build #${idx + 1} is not an object`);
      return;
    }
    const b = raw as ManifestBuild;
    const cf = typeof b.chipFamily === "string" ? b.chipFamily : null;
    if (!cf) {
      problems.push(`build #${idx + 1} has no \`chipFamily\``);
    } else {
      chipFamilies.push(cf);
    }
    const ota = isObject(b.ota) ? (b.ota as ManifestBuildOta) : null;
    if (!ota || typeof ota.path !== "string" || ota.path.trim() === "") {
      problems.push(
        `build ${cf ? `\`${cf}\`` : `#${idx + 1}`} has no \`ota.path\``
      );
    }
    if (
      cf &&
      chipFamily &&
      normalizeChip(cf) === normalizeChip(chipFamily) &&
      ota &&
      typeof ota.path === "string"
    ) {
      matchBuild = b;
    }
  });

  if (chipFamily && chipFamilies.length > 0 && !matchBuild) {
    // Only report a mismatch if the required fields were otherwise present —
    // a build we matched but which lacked ota.path was already reported above.
    const hasMatchingChip = chipFamilies.some(
      (cf) => normalizeChip(cf) === normalizeChip(chipFamily)
    );
    if (!hasMatchingChip) {
      problems.push(
        `no build for this device's chip \`${chipFamily}\` ` +
          `(manifest has: ${chipFamilies.map((c) => `\`${c}\``).join(", ")}) — ` +
          "the update will never offer itself to the device"
      );
    }
  }

  return { problems, matchBuild, chipFamilies };
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init: RequestInit = {}
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

// Read only the first byte of a response body, then cancel the stream so a
// server that ignored a Range request (returning the full body) doesn't get
// buffered in full. Returns null for an empty body.
async function readFirstByte(res: Response): Promise<number | null> {
  if (!res.body) {
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length === 0 ? null : buf[0];
  }
  const reader = res.body.getReader();
  try {
    const { value, done } = await reader.read();
    if (done || !value || value.length === 0) return null;
    return value[0];
  } finally {
    await reader.cancel().catch(() => {});
  }
}

// Collect the source URLs of every http_request update entry.
function updateSources(cfg: Record<string, unknown>): string[] {
  const update = cfg.update;
  if (!Array.isArray(update)) return [];
  const sources: string[] = [];
  for (const entry of update) {
    if (!isObject(entry)) continue;
    if (entry.platform !== "http_request") continue;
    if (typeof entry.source === "string" && entry.source.trim() !== "") {
      sources.push(entry.source.trim());
    }
  }
  return sources;
}

// Validate one manifest end-to-end (fetch → parse → shape/chip → binary
// liveness/integrity), returning checklist rows. Network problems become
// NEEDS-HUMAN-CHECK (inconclusive), real defects become FAIL (must-fix).
async function checkOneManifest(
  source: string,
  chipFamily: string | null
): Promise<CheckResult[]> {
  const label = manifestLabel(source);
  const manifestTimeout = Number(process.env.MANIFEST_TIMEOUT_MS ?? 30000);
  const binaryTimeout = Number(process.env.BINARY_TIMEOUT_MS ?? 120000);

  let res: Response;
  try {
    res = await fetchWithTimeout(source, manifestTimeout);
  } catch (err) {
    return [
      inconclusive(`OTA manifest (${label})`, `could not fetch: ${(err as Error).message}`),
    ];
  }
  if (!res.ok) {
    return [fail(`OTA manifest (${label})`, `manifest returned HTTP ${res.status} (dead link)`)];
  }
  let json: unknown;
  try {
    json = JSON.parse(await res.text());
  } catch {
    return [fail(`OTA manifest (${label})`, "manifest is not valid JSON")];
  }

  const { problems, matchBuild, chipFamilies } = validateManifest(json, chipFamily);
  const rows: CheckResult[] = [];
  if (problems.length > 0) {
    rows.push(fail(`OTA manifest (${label})`, problems.join("; ")));
  } else {
    rows.push(
      ok(
        `OTA manifest (${label})`,
        `valid manifest, builds: ${chipFamilies.map((c) => `\`${c}\``).join(", ")}`
      )
    );
  }

  // Only check the binary for the build matching this device's chip.
  const build = matchBuild as ManifestBuild | null;
  if (!build) return rows;
  const ota = build.ota as ManifestBuildOta;
  const otaPath = typeof ota.path === "string" ? ota.path : "";
  const binUrl = resolveBinaryUrl(otaPath, source);
  const chipLabel = typeof build.chipFamily === "string" ? build.chipFamily : "?";
  if (!binUrl) {
    rows.push(fail(`OTA binary (${chipLabel})`, `could not resolve \`ota.path\` (\`${otaPath}\`)`));
    return rows;
  }
  const md5 = typeof ota.md5 === "string" && ota.md5.trim() !== "" ? ota.md5.trim().toLowerCase() : null;

  try {
    if (md5) {
      // md5 present -> full download validates liveness, magic byte and md5.
      const r = await fetchWithTimeout(binUrl, binaryTimeout);
      if (!r.ok) {
        rows.push(fail(`OTA binary (${chipLabel})`, `binary returned HTTP ${r.status} (unreachable)`));
        return rows;
      }
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length === 0) {
        rows.push(fail(`OTA binary (${chipLabel})`, "binary body is empty"));
        return rows;
      }
      const problemsBin: string[] = [];
      if (buf[0] !== 0xe9) {
        problemsBin.push(
          `first byte is 0x${buf[0].toString(16)} not 0xE9 — not an ESP firmware image ` +
            "(likely an HTML error page or the wrong asset)"
        );
      }
      const actual = createHash("md5").update(buf).digest("hex");
      if (actual !== md5) {
        problemsBin.push(`md5 mismatch (manifest \`${md5}\`, actual \`${actual}\`)`);
      }
      if (problemsBin.length > 0) {
        rows.push(fail(`OTA binary (${chipLabel})`, problemsBin.join("; ")));
      } else {
        rows.push(
          ok(
            `OTA binary (${chipLabel})`,
            `reachable, ${(buf.length / 1024 / 1024).toFixed(2)} MB, md5 verified, 0xE9 magic ok`
          )
        );
      }
    } else {
      // No md5 -> cheap range GET for liveness + magic byte only.
      const r = await fetchWithTimeout(binUrl, binaryTimeout, {
        headers: { Range: "bytes=0-0" },
      });
      if (r.status !== 200 && r.status !== 206) {
        rows.push(fail(`OTA binary (${chipLabel})`, `binary returned HTTP ${r.status} (unreachable)`));
        return rows;
      }
      // Read only the first chunk and cancel — a server that ignores the Range
      // header returns 200 with the whole body, and buffering that would defeat
      // the point of the cheap liveness check.
      const first = await readFirstByte(r);
      if (first === null) {
        rows.push(fail(`OTA binary (${chipLabel})`, "binary body is empty"));
      } else if (first !== 0xe9) {
        rows.push(
          fail(
            `OTA binary (${chipLabel})`,
            `first byte is 0x${first.toString(16)} not 0xE9 — not an ESP firmware image`
          )
        );
      } else {
        rows.push(
          ok(
            `OTA binary (${chipLabel})`,
            "reachable, 0xE9 magic ok (no md5 in manifest to verify)"
          )
        );
      }
    }
  } catch (err) {
    rows.push(
      inconclusive(`OTA binary (${chipLabel})`, `could not fetch: ${(err as Error).message}`)
    );
  }
  return rows;
}

function manifestLabel(source: string): string {
  try {
    const segs = new URL(source).pathname.split("/").filter(Boolean);
    return segs.slice(-2).join("/") || source;
  } catch {
    return source;
  }
}

const ok = (item: string, detail: string): CheckResult => ({ item, status: "OK", detail });
const fail = (item: string, detail: string): CheckResult => ({ item, status: "FAIL", detail });
const inconclusive = (item: string, detail: string): CheckResult => ({
  item,
  status: "NEEDS-HUMAN-CHECK",
  detail,
});

// Validate every http_request update manifest referenced by the config.
async function checkUpdateManifests(
  cfg: Record<string, unknown>,
  chipFamily: string | null
): Promise<CheckResult[]> {
  const sources = updateSources(cfg);
  const rows: CheckResult[] = [];
  for (const source of sources) {
    rows.push(...(await checkOneManifest(source, chipFamily)));
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Per-page review
// ---------------------------------------------------------------------------

async function reviewPage(
  pageAbs: string,
  workRoot: string,
  esphomeBin: string,
  doCompile: boolean
): Promise<PageResult> {
  const rel = path.relative(process.cwd(), pageAbs);
  const content = fs.readFileSync(pageAbs, "utf8");
  const title = pageTitle(content);
  const result: PageResult = {
    page: rel,
    url: null,
    fenceMissing: false,
    fatalError: null,
    configOk: null,
    configInconclusive: false,
    configError: null,
    compile: "SKIPPED",
    compileLog: null,
    checks: [],
  };

  // 1. First url= fence pointing at a GitHub yaml file.
  const fences = findYamlFences(content);
  const urlFence = fences.find(
    (f) => f.urlAttr !== null && parseGitHubYamlUrl(f.urlAttr) !== null
  );
  if (!urlFence || !urlFence.urlAttr) {
    result.fenceMissing = true;
    return result;
  }
  result.url = urlFence.urlAttr;
  const ghRef = parseGitHubYamlUrl(urlFence.urlAttr)!;

  // 2. Download the whole repo at the ref.
  const pageWork = fs.mkdtempSync(path.join(workRoot, "page-"));
  let repoRoot: string;
  try {
    repoRoot = await downloadRepo(ghRef, pageWork);
  } catch (err) {
    result.fatalError = (err as Error).message;
    return result;
  }
  const configFile = path.join(repoRoot, ghRef.filePath);
  if (!fs.existsSync(configFile)) {
    result.fatalError =
      `\`${ghRef.filePath}\` was not found in ${ghRef.owner}/${ghRef.repo}@${ghRef.ref} — ` +
      "the `url=` fence points at a path that does not exist";
    return result;
  }
  const configDir = path.dirname(configFile);

  // 3. Placeholder secrets next to the config.
  const secretsBody = Object.entries(PLACEHOLDER_SECRETS)
    .map(([k, v]) => `${k}: "${v}"`)
    .join("\n");
  fs.writeFileSync(path.join(configDir, "secrets.yaml"), secretsBody + "\n");

  // 4. Expand + validate.
  const configTimeout = Number(process.env.CONFIG_TIMEOUT_MS ?? 180000);
  const cfgRun = runEsphome(
    esphomeBin,
    "config",
    path.basename(configFile),
    configDir,
    configTimeout
  );
  if (!cfgRun.ok) {
    if (cfgRun.timedOut) {
      result.configInconclusive = true;
      result.configError =
        "`esphome config` timed out while expanding the configuration";
      return result;
    }
    const classified = classifyConfigError(cfgRun);
    result.configError = classified.message;
    if (classified.network) {
      // A network/toolchain blip is inconclusive, not a config defect — don't
      // block the PR over it (same policy as a compile timeout).
      result.configInconclusive = true;
    } else {
      result.configOk = false;
    }
    return result;
  }
  result.configOk = true;

  const expandedText = stripAnsi(cfgRun.stdout);
  let cfg: unknown;
  try {
    cfg = yaml.load(expandedText, { schema: ESPHOME_SCHEMA });
  } catch (err) {
    result.configOk = false;
    result.configError = `expanded config did not parse: ${(err as Error).message}`;
    return result;
  }
  if (!isObject(cfg)) {
    result.configOk = false;
    result.configError = "expanded config was not a mapping";
    return result;
  }

  // 5. Compile.
  if (doCompile) {
    const compileTimeout = Number(process.env.COMPILE_TIMEOUT_MS ?? 1500000);
    const compRun = runEsphome(
      esphomeBin,
      "compile",
      path.basename(configFile),
      configDir,
      compileTimeout
    );
    if (compRun.ok) {
      result.compile = "PASS";
    } else if (compRun.timedOut) {
      result.compile = "INCONCLUSIVE";
      result.compileLog = tail(compRun.stdout + "\n" + compRun.stderr, 20);
    } else {
      result.compile = "FAIL";
      result.compileLog = tail(compRun.stdout + "\n" + compRun.stderr, 40);
    }
  }

  // 6. Structural checklist.
  result.checks = runChecklist(cfg, expandedText, title, result.compile);

  // 7. OTA update manifest + binary liveness (unless disabled). Additive
  // network checks over the http_request update source(s).
  if (process.env.MFE_OTA_MANIFEST !== "0") {
    const otaRows = await checkUpdateManifests(cfg, chipFamilyFromConfig(cfg));
    result.checks.push(...otaRows);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

// Neutralise @mentions in fork-controlled text so the review can't ping third
// parties (matches validate-yaml-configs.ts).
function neutralizeMentions(text: string): string {
  return text.replace(/@(?=[A-Za-z0-9_-])/g, "@" + String.fromCharCode(0x200b));
}

const STATUS_ICON: Record<CheckStatus, string> = {
  OK: "✅",
  MISSING: "❌",
  FAIL: "❌",
  "NEEDS-HUMAN-CHECK": "⚠️",
  "N/A": "➖",
};

function renderPage(r: PageResult): string {
  const lines: string[] = [];
  lines.push(`### \`${r.page}\``);
  lines.push("");

  if (r.fenceMissing) {
    lines.push(
      "This Made for ESPHome page has no ```` ```yaml url=… ```` fence pointing at " +
        "a `.yaml` file in the manufacturer's GitHub repo, so the upstream config " +
        "could not be located or compiled. Add a fence such as " +
        "```` ```yaml url=https://github.com/<owner>/<repo>/blob/<ref>/<path>.yaml ```` " +
        "(or the `raw.githubusercontent.com` equivalent)."
    );
    lines.push("");
    return lines.join("\n");
  }

  lines.push(`**Upstream config:** ${r.url}`);
  lines.push("");

  if (r.fatalError) {
    lines.push(`**Configuration & compile**`);
    lines.push("");
    lines.push(`- ❌ Could not review the upstream config: ${r.fatalError}`);
    lines.push("");
    return lines.join("\n");
  }

  // Config / compile section.
  lines.push(`**Configuration & compile**`);
  lines.push("");
  if (r.configInconclusive) {
    lines.push(`- ⚠️ \`esphome config\` — ${r.configError} (inconclusive; not blocking)`);
    lines.push("");
    return lines.join("\n");
  }
  if (r.configOk === false) {
    lines.push(`- ❌ \`esphome config\` — ${r.configError}`);
    lines.push("");
    return lines.join("\n");
  }
  lines.push("- ✅ `esphome config` — configuration expands and validates");
  if (r.compile === "PASS") {
    lines.push("- ✅ `esphome compile` — builds with only placeholder Wi-Fi secrets");
  } else if (r.compile === "FAIL") {
    lines.push("- ❌ `esphome compile` — failed to build (see log below)");
  } else if (r.compile === "INCONCLUSIVE") {
    lines.push(
      "- ⚠️ `esphome compile` — did not finish within the time limit (inconclusive)"
    );
  } else {
    lines.push("- ➖ `esphome compile` — skipped");
  }
  lines.push("");
  if (r.compileLog) {
    lines.push("<details><summary>compile log tail</summary>");
    lines.push("");
    lines.push("```");
    lines.push(r.compileLog);
    lines.push("```");
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  // Checklist table.
  lines.push("**Checklist**");
  lines.push("");
  lines.push("| Check | Status | Detail |");
  lines.push("| ----- | ------ | ------ |");
  for (const c of r.checks) {
    const status = `${STATUS_ICON[c.status]} ${c.status}`;
    // Escape backslashes before pipes (so an input `\|` doesn't collapse), and
    // fold newlines to spaces, so fork-derived detail can't break the table row.
    const detail = c.detail
      .replace(/\\/g, "\\\\")
      .replace(/\|/g, "\\|")
      .replace(/\r?\n/g, " ");
    lines.push(`| ${c.item} | ${status} | ${detail} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function buildReport(pages: PageResult[]): string {
  const blocking = pages.filter(pageBlocks);
  const lines: string[] = [];
  if (blocking.length === 0) {
    lines.push("## ✅ Made for ESPHome review");
    lines.push("");
    lines.push(
      "All automated Made for ESPHome checks pass. Each page below was compiled " +
        "from its linked upstream config with only placeholder Wi-Fi secrets, " +
        `then checked against the [Made for ESPHome checklist](${CHECKLIST_URL}). ` +
        "A maintainer will take a final look before approval. Items marked ⚠️ " +
        "still need a human to confirm (e.g. whether the hardware has a USB port)."
    );
  } else {
    lines.push("## ❌ Made for ESPHome review");
    lines.push("");
    lines.push(
      `The automated Made for ESPHome checks found blocking issues on ` +
        `**${blocking.length} page${blocking.length === 1 ? "" : "s"}**. ` +
        "Each page below was compiled from its linked upstream config with only " +
        "placeholder Wi-Fi secrets, then checked against the " +
        `[Made for ESPHome checklist](${CHECKLIST_URL}). ` +
        "Address the items marked ❌ and push an update — this review refreshes " +
        "automatically and is dismissed once the checks pass. Items marked ⚠️ " +
        "need a human to confirm (e.g. whether the hardware has a USB port)."
    );
  }
  lines.push("");
  // Only the per-page content derives from fork-controlled input (URLs, slugs,
  // details), so neutralize @mentions there; the trusted intro/footer are left
  // intact so our own `@esphome[bot] review` hint stays literal.
  for (const r of pages) {
    lines.push(neutralizeMentions(renderPage(r)));
  }
  lines.push("---");
  lines.push(
    "This is an automated structural review; a maintainer will take a final " +
      "look before approval. Pushing an update re-runs it automatically; you " +
      "can also comment `@esphome[bot] review` to re-run (e.g. after fixing the " +
      `upstream config). See the [Made for ESPHome checklist](${CHECKLIST_URL}).`
  );
  return lines.join("\n") + "\n";
}

// One-device-per-PR early-fail report. Emitted (and the compile skipped) when a
// PR adds or modifies more than one Made for ESPHome device page.
function buildMultiDeviceReport(pages: string[]): string {
  const lines: string[] = [];
  lines.push("## ❌ Made for ESPHome review");
  lines.push("");
  lines.push(
    `This pull request adds or modifies **${pages.length}** Made for ESPHome ` +
      "device pages:"
  );
  lines.push("");
  // Page paths are fork-controlled (a device dir could contain an `@`), so
  // neutralize those bullets; the rest of the report is trusted static text.
  for (const p of pages) lines.push(neutralizeMentions(`- \`${p}\``));
  lines.push("");
  lines.push(
    "Only **one device per pull request** is allowed so each can be reviewed " +
      "and compiled on its own. Please split the additional device(s) into " +
      "separate pull requests — this review is dismissed automatically once " +
      "the PR contains a single device."
  );
  lines.push("");
  lines.push("---");
  lines.push(
    "This is an automated structural review; a maintainer will take a final " +
      `look before approval. See the [Made for ESPHome checklist](${CHECKLIST_URL}).`
  );
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

function writeGithubOutput(entries: Record<string, string>): void {
  const target = process.env.GITHUB_OUTPUT;
  const text = Object.entries(entries)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  if (target) {
    fs.appendFileSync(target, text + "\n");
  } else {
    console.log(text);
  }
}

// Explicit review verdict, written to MFE_STATUS so the feedback workflow can
// tell a genuine pass from a crash or an inconclusive run and never dismiss a
// blocking review on anything but a real pass.
type ReviewStatus = "changes" | "pass" | "inconclusive" | "no-mfe";
function writeStatus(status: ReviewStatus): void {
  const target = process.env.MFE_STATUS;
  if (target) fs.writeFileSync(target, status + "\n", "utf8");
  console.log(`status: ${status}`);
}

function pageInconclusive(r: PageResult): boolean {
  return r.configInconclusive || r.compile === "INCONCLUSIVE";
}

function resolveDevicesRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return process.env.DEVICES_ROOT
    ? path.resolve(process.env.DEVICES_ROOT)
    : path.resolve(__dirname, "..", "src", "docs", "devices");
}

async function main(): Promise<void> {
  const devicesRoot = resolveDevicesRoot();
  const detectOnly = process.argv.includes("--detect");
  const pages = resolveScopePages(devicesRoot);

  if (detectOnly) {
    writeGithubOutput({
      run: pages.length > 0 ? "true" : "false",
      count: String(pages.length),
      // `multi` lets the workflow skip the ESPHome toolchain install entirely
      // and just post the one-device-per-PR review.
      multi: pages.length > 1 ? "true" : "false",
    });
    return;
  }

  if (pages.length === 0) {
    console.log("No changed made-for-esphome pages — nothing to review.");
    writeStatus("no-mfe");
    return;
  }

  const reportPath = process.env.MFE_REVIEW_REPORT;

  // One device per pull request: if more than one Made for ESPHome page is
  // added/modified, fail early with a request-changes review and skip the
  // expensive per-page compile entirely — each device needs its own PR.
  if (pages.length > 1) {
    const relPages = pages.map((p) => path.relative(process.cwd(), p)).sort();
    const report = buildMultiDeviceReport(relPages);
    if (reportPath) {
      fs.writeFileSync(reportPath, report, "utf8");
      console.log(
        `\nEarly fail: ${pages.length} made-for-esphome pages in one PR — ` +
          `wrote one-device-per-PR report to ${reportPath}.`
      );
    } else {
      console.log("\n" + report);
    }
    writeStatus("changes");
    process.exitCode = 1;
    return;
  }

  const esphomeBin = process.env.ESPHOME_BIN || "esphome";
  const doCompile = process.env.MFE_COMPILE !== "0";
  const workRoot = process.env.MFE_WORK_DIR
    ? (fs.mkdirSync(process.env.MFE_WORK_DIR, { recursive: true }),
      process.env.MFE_WORK_DIR)
    : fs.mkdtempSync(path.join(os.tmpdir(), "mfe-review-"));

  console.log(
    `Reviewing ${pages.length} made-for-esphome page(s) with ${esphomeBin} ` +
      `(compile ${doCompile ? "on" : "off"}).`
  );

  const results: PageResult[] = [];
  for (const page of pages) {
    console.log(`\n=== ${path.relative(process.cwd(), page)} ===`);
    const r = await reviewPage(page, workRoot, esphomeBin, doCompile);
    results.push(r);
    // Console summary.
    if (r.fenceMissing) console.log("  missing url= fence");
    else if (r.fatalError) console.log(`  fatal: ${r.fatalError}`);
    else {
      console.log(`  config: ${r.configOk ? "ok" : "FAIL"}  compile: ${r.compile}`);
      for (const c of r.checks) {
        if (c.status !== "OK" && c.status !== "N/A") {
          console.log(`  ${c.status}: ${c.item} — ${c.detail}`);
        }
      }
    }
  }

  const blocking = results.filter(pageBlocks);
  if (blocking.length > 0) {
    const report = buildReport(results);
    if (reportPath) {
      fs.writeFileSync(reportPath, report, "utf8");
      console.log(`\nWrote report for ${blocking.length} blocking page(s) to ${reportPath}.`);
    } else {
      console.log("\n" + report);
    }
    writeStatus("changes");
    // Exit non-zero so the CI job surfaces the failure in its own right,
    // independent of the review-posting workflow.
    process.exitCode = 1;
  } else if (results.some(pageInconclusive)) {
    // No blocking findings, but a config/compile could not run to completion
    // (network/toolchain/timeout). Not a genuine pass — the feedback workflow
    // must leave any existing blocking review in place rather than dismiss it.
    console.log("\nNo blocking findings, but the run was inconclusive.");
    writeStatus("inconclusive");
  } else {
    // All checks pass: still emit the (all-green) report so the feedback
    // workflow can post it as a non-blocking acknowledgement comment.
    const report = buildReport(results);
    if (reportPath) {
      fs.writeFileSync(reportPath, report, "utf8");
      console.log("\nAll made-for-esphome checks pass — wrote green report.");
    } else {
      console.log("\n" + report);
    }
    writeStatus("pass");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export {
  parseGitHubYamlUrl,
  nameViolatesEsphomeRule,
  collectMissingIds,
  collectBakedPasswords,
  collectManualIps,
  collectStraySecrets,
  runChecklist,
  pageBlocks,
  buildReport,
  buildMultiDeviceReport,
  stripAnsi,
  findYamlFences,
  isMadeForEsphome,
  classifyConfigError,
  variantToChipFamily,
  chipFamilyFromConfig,
  resolveBinaryUrl,
  validateManifest,
  updateSources,
  checkOneManifest,
  checkUpdateManifests,
};
export type { PageResult, CheckResult, CheckStatus, CompileOutcome };
