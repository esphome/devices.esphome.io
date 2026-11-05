#!/usr/bin/env tsx
/**
 * Prove the example configs on changed device pages work with real ESPHome
 * and with the ESPHome Device Builder's devices.esphome.io importer.
 *
 * Used by the `esphome_validate` job in `.github/workflows/ci.yaml`.
 * Runnable locally via the `validate-esphome` npm script:
 *
 *   npm run validate-esphome                  # devices changed since merge-base(origin/main, HEAD)
 *   npm run validate-esphome -- <base> [head] # explicit refs
 *   npm run validate-esphome -- --all         # every device page (one-off survey)
 *   npm run validate-esphome -- <Device-Dir>  # one or more device folders by name
 *   BASE_SHA=... HEAD_SHA=... npm run validate-esphome   # CI diff mode
 *
 *   --annotations     Also emit `::error` / `::notice` GitHub Actions commands.
 *   --skip-esphome    Run only the static Device Builder import checks.
 *   --include-inline  With --all: also check legacy pages that still carry
 *                     their config inline (importer view of the catalog).
 *   --detect          Only print how many device folders are in scope and
 *                     write `run=<bool>` to $GITHUB_OUTPUT (CI gating).
 *
 * A device folder is in scope when the diff adds, modifies, renames or copies
 * any file inside it, so legacy pages never block unrelated PRs.
 *
 * Check 1, ESPHome: every yaml a page references with `file=` must pass
 * `esphome config`. `config.yaml` and any other file with its own
 * `esphome: name:` are validated on their own. A file without one is an
 * add-on fragment (a template sensor, a voice assistant block) that the page
 * tells the user to add to `config.yaml`, so it is validated merged onto
 * `config.yaml` through ESPHome's own `packages:` merge, together with the
 * `api:`, `ota:` and Wi-Fi a user's own config adds; it is skipped when
 * `config.yaml` itself fails. Each run happens in a temporary copy of the
 * device folder, with no `secrets.yaml`.
 *
 * Check 2, Device Builder import: mirrors the acceptance rules of
 * `script/sync_esphome_devices.py` (`_iter_devices`, `_first_config_yaml`,
 * `_make_record`) in esphome/device-builder, so a page the importer would
 * skip or import from the wrong fence fails here with the reason:
 *   - the importer reads the first `yaml` fence that parses as a mapping, so
 *     that fence must be the `config.yaml` one (an `inline` snippet above it
 *     would be imported instead);
 *   - frontmatter `title` is set;
 *   - the page embeds at least one local image (`![alt](file.jpg "title")`);
 *   - the SoC family resolves (frontmatter `board:` or a top-level block) to
 *     one the importer supports and `config.yaml` has that block;
 *   - the board id is concrete: `board:` (or, on esp32, a `variant:`), not a
 *     placeholder;
 *   - at least one hardware component the importer can lift: a platform-list
 *     item that is not `template` / `copy`, has no `lambda`, and sets a field
 *     beyond `platform` / `id` / `name`; or a top-level `ethernet:` block.
 * The last rule is an approximation: the importer also requires the platform
 * to be in its component catalog, which is generated from ESPHome's schema,
 * so check 1 covers an unknown platform. A family the page allows but the
 * importer does not handle yet (ln882x) is reported as a notice, not an error.
 *
 * SECURITY: `esphome config` runs contributor-controlled yaml, and
 * `external_components` / `packages` are fetched and imported at validation
 * time. CI runs this only in the secret-free `pull_request` context with
 * `contents: read`, never `compile` / `run`, and with no secrets file.
 *
 * Environment:
 *   BASE_SHA / HEAD_SHA  diff range (CI); the merge-base of the two is used
 *   ESPHOME_BIN          esphome executable (default: "esphome")
 *   CONFIG_TIMEOUT_MS    per-file `esphome config` timeout (default 180000)
 *   JOBS                 parallel `esphome config` runs (default: CPU count, max 8)
 *   DEVICES_ROOT         override src/docs/devices (tests)
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFile, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

// ---------------------------------------------------------------------------
// Importer mirror: constants from script/sync_esphome_devices.py and
// script/_board_import.py in esphome/device-builder.
// ---------------------------------------------------------------------------

export const IMPORTER_SOC_FAMILIES = ["esp32", "esp8266", "bk72xx", "rp2040", "rtl87xx"];

// Families devices.esphome.io accepts in frontmatter that the importer skips.
export const IMPORTER_UNSUPPORTED_FAMILIES = ["ln882x"];

export const ESP32_VARIANT_DEFAULT_BOARD: Record<string, string> = {
  esp32: "esp32dev",
  esp32s2: "esp32-s2-saola-1",
  esp32s3: "esp32-s3-devkitc-1",
  esp32c2: "esp32-c2-devkitm-1",
  esp32c3: "esp32-c3-devkitm-1",
  esp32c5: "esp32-c5-devkitc-1",
  esp32c6: "esp32-c6-devkitc-1",
  esp32c61: "esp32-c61-devkitc1",
  esp32h2: "esp32-h2-devkitm-1",
  esp32p4: "esp32-p4-evboard",
};

export const PLATFORM_LIST_DOMAINS = new Set([
  "alarm_control_panel", "binary_sensor", "button", "camera", "climate", "cover",
  "datetime", "display", "event", "fan", "light", "lock", "media_player",
  "microphone", "number", "output", "select", "sensor", "speaker", "switch",
  "text", "text_sensor", "touchscreen", "update", "valve",
]);

const SKIPPED_PLATFORMS = new Set(["template", "copy"]);
const LAMBDA_BEHAVIOUR_KEYS = ["lambda", "write_lambda"];
const SKIPPED_FIELDS = new Set(["platform", "id", "name"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg"]);

const PLACEHOLDER_PATTERNS = [
  /\bfill\s*in\b/i,
  /\breplace\s*me\b/i,
  /<\s*replaceme\s*>/i,
  /<[A-Z_][A-Z0-9_]*>/,
  /\byour[\s_-]+(key|address|token|id)\b/i,
];

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
const YAML_FENCE_RE = /```ya?ml([^\n]*)\n([\s\S]*?)\n?```/g;
const FENCE_FILE_RE = /\bfile=(\S+)/;
const IMAGE_REF_RE = /!\[[^\]]*\]\(([^)\s]+?)(?:\s+"[^"]*")?\)/g;

// ESPHome-only tags parse to their argument and a duplicate key keeps the last
// value, like the importer's tolerant PyYAML loader.
const ESPHOME_TAGS = [
  "!secret", "!lambda", "!include", "!include_dir_list", "!include_dir_named",
  "!include_dir_merge_list", "!include_dir_merge_named", "!env", "!env_var",
  "!extend", "!remove", "!force",
];
const YAML_SCHEMA = yaml.DEFAULT_SCHEMA.extend(
  ESPHOME_TAGS.flatMap((tag) =>
    (["scalar", "sequence", "mapping"] as const).map(
      (kind) => new yaml.Type(tag, { kind, construct: (data) => data ?? null })
    )
  )
);

export function loadYaml(text: string): unknown {
  try {
    return yaml.load(text, { schema: YAML_SCHEMA, json: true });
  } catch {
    return undefined;
  }
}

type Mapping = Record<string, unknown>;

export function isMapping(value: unknown): value is Mapping {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isPlaceholder(value: unknown): boolean {
  return typeof value === "string" && PLACEHOLDER_PATTERNS.some((p) => p.test(value));
}

// ---------------------------------------------------------------------------
// Page model
// ---------------------------------------------------------------------------

export interface Fence {
  info: string;
  body: string;
  file: string | null; // `file=` target, `./` stripped
  line: number;
}

export function splitFrontmatter(md: string): { frontmatter: Mapping | null; body: string } {
  const m = FRONTMATTER_RE.exec(md);
  if (!m) return { frontmatter: null, body: md };
  const parsed = loadYaml(m[1]);
  if (!isMapping(parsed)) return { frontmatter: null, body: m[2] };
  const lowered: Mapping = {};
  for (const [k, v] of Object.entries(parsed)) lowered[String(k).toLowerCase()] = v;
  return { frontmatter: lowered, body: m[2] };
}

export function findFences(md: string): Fence[] {
  const fences: Fence[] = [];
  for (const m of md.matchAll(YAML_FENCE_RE)) {
    const info = m[1];
    const fileMatch = FENCE_FILE_RE.exec(info);
    fences.push({
      info,
      body: m[2],
      file: fileMatch ? fileMatch[1].replace(/^\.\//, "") : null,
      line: md.slice(0, m.index).split("\n").length,
    });
  }
  return fences;
}

function readFenceYaml(fence: Fence, deviceDir: string): string | null {
  if (fence.file === null) return fence.body;
  if (/[/\\]|\.\./.test(fence.file)) return null;
  try {
    return fs.readFileSync(path.join(deviceDir, fence.file), "utf8");
  } catch {
    return null;
  }
}

/**
 * The fence the importer reads as the page's config, and its parsed tree.
 *
 * Like the importer, a top-level `ethernet:` from a later fence is folded in
 * when the first one has none.
 */
export function importerPrimaryFence(
  fences: Fence[],
  deviceDir: string
): { fence: Fence; config: Mapping } | null {
  let primary: { fence: Fence; config: Mapping } | null = null;
  let ethernet: unknown = undefined;
  for (const fence of fences) {
    const text = readFenceYaml(fence, deviceDir);
    if (text === null) continue;
    const parsed = loadYaml(text);
    if (!isMapping(parsed)) continue;
    primary ??= { fence, config: parsed };
    if (ethernet === undefined && isMapping(parsed.ethernet)) ethernet = parsed.ethernet;
    if (ethernet !== undefined) break;
  }
  if (primary !== null && ethernet !== undefined && !("ethernet" in primary.config)) {
    primary = { fence: primary.fence, config: { ...primary.config, ethernet } };
  }
  return primary;
}

export function localImages(body: string, deviceDir: string): string[] {
  const seen: string[] = [];
  for (const m of body.matchAll(IMAGE_REF_RE)) {
    const ref = m[1].trim().replace(/^\.\//, "");
    if (!ref || /^(https?:|data:)/.test(ref)) continue;
    if (!IMAGE_EXTENSIONS.has(path.extname(ref).toLowerCase())) continue;
    if (/[/\\]|\.\./.test(ref)) continue;
    if (!fs.existsSync(path.join(deviceDir, ref))) continue;
    if (!seen.includes(ref)) seen.push(ref);
  }
  return seen;
}

/** Resolve `${var}` / `$var` from the config's own `substitutions:` block. */
export function resolveSubstitutions(config: Mapping): Mapping {
  const subs = config.substitutions;
  if (!isMapping(subs)) return config;
  const sub = (value: unknown): unknown => {
    if (typeof value === "string") {
      return value.replace(/\$\{(\w+)\}|\$(\w+)/g, (whole, a, b) => {
        const v = subs[a ?? b];
        return v === undefined || v === null || isMapping(v) || Array.isArray(v)
          ? whole
          : String(v);
      });
    }
    if (Array.isArray(value)) return value.map(sub);
    if (isMapping(value)) {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sub(v)]));
    }
    return value;
  };
  const { substitutions: _, ...rest } = config;
  return sub(rest) as Mapping;
}

// ---------------------------------------------------------------------------
// Check 2: Device Builder import rules
// ---------------------------------------------------------------------------

export interface Finding {
  level: "error" | "notice";
  file: string;
  line?: number;
  message: string;
}

const IMPORTER = "Device Builder import";

export function resolveSoc(
  frontmatter: Mapping,
  config: Mapping
): { family: string | null; block: Mapping | null; unsupported: string | null } {
  const candidates: string[] = [];
  let unsupported: string | null = null;
  const fmBoard = frontmatter.board;
  if (typeof fmBoard === "string") {
    for (const raw of fmBoard.split(",")) {
      const token = raw.trim().toLowerCase();
      if (IMPORTER_SOC_FAMILIES.includes(token)) candidates.push(token);
      else if (IMPORTER_UNSUPPORTED_FAMILIES.includes(token)) unsupported = token;
    }
  }
  for (const family of IMPORTER_SOC_FAMILIES) {
    if (!candidates.includes(family) && family in config) candidates.push(family);
  }
  for (const family of candidates) {
    const block = config[family];
    if (isMapping(block)) return { family, block, unsupported };
  }
  if (unsupported === null) {
    unsupported = IMPORTER_UNSUPPORTED_FAMILIES.find((f) => f in config) ?? null;
  }
  return { family: candidates[0] ?? null, block: null, unsupported };
}

export function resolveBoard(family: string, block: Mapping): string | null {
  const rawBoard = block.board;
  const board = typeof rawBoard === "string" && !isPlaceholder(rawBoard) ? rawBoard : null;
  if (board) return board;
  if (family === "esp32" && typeof block.variant === "string") {
    const variant = block.variant.trim().replace(/[-_]/g, "").toLowerCase();
    return ESP32_VARIANT_DEFAULT_BOARD[variant] ?? null;
  }
  return null;
}

export function liftableComponents(config: Mapping): string[] {
  const lifted: string[] = [];
  if (isMapping(config.ethernet)) lifted.push("ethernet");
  for (const domain of Object.keys(config).sort()) {
    if (!PLATFORM_LIST_DOMAINS.has(domain)) continue;
    const items = config[domain];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!isMapping(item)) continue;
      const platform = item.platform;
      if (typeof platform !== "string" || !platform || SKIPPED_PLATFORMS.has(platform)) continue;
      if (LAMBDA_BEHAVIOUR_KEYS.some((k) => k in item)) continue;
      const fields = Object.keys(item).filter((k) => !SKIPPED_FIELDS.has(k));
      if (fields.length === 0) continue;
      if (fields.some((k) => isPlaceholder(item[k]))) continue;
      lifted.push(`${domain}.${platform}`);
    }
  }
  return lifted;
}

export interface Page {
  dir: string; // absolute device folder
  rel: string; // repo-relative index.md
  frontmatter: Mapping | null;
  body: string;
  fences: Fence[];
}

export function loadPage(deviceDir: string, root: string): Page | null {
  const indexPath = path.join(deviceDir, "index.md");
  let md: string;
  try {
    md = fs.readFileSync(indexPath, "utf8");
  } catch {
    return null;
  }
  const { frontmatter, body } = splitFrontmatter(md);
  return {
    dir: deviceDir,
    rel: path.relative(root, indexPath),
    frontmatter,
    body,
    fences: findFences(md),
  };
}

export function checkImport(page: Page): Finding[] {
  const findings: Finding[] = [];
  const err = (message: string, line?: number): void => {
    findings.push({ level: "error", file: page.rel, line, message: `${IMPORTER}: ${message}` });
  };
  const fm = page.frontmatter;
  if (fm === null) {
    err("the page has no parseable frontmatter, so the importer skips it");
    return findings;
  }
  if (typeof fm.title !== "string" || !fm.title.trim()) {
    err("frontmatter `title` is missing, so the importer skips the page");
  }

  const primary = importerPrimaryFence(page.fences, page.dir);
  if (primary === null) {
    err("no yaml fence parses as a config, so the importer skips the page");
    return findings;
  }
  const hasFileFences = page.fences.some((f) => f.file !== null);
  if (hasFileFences && primary.fence.file?.toLowerCase() !== "config.yaml") {
    const what = primary.fence.file === null ? "an inline yaml fence" : `\`${primary.fence.file}\``;
    err(
      `the importer reads the first yaml fence that parses as a mapping, which is ${what} ` +
        "here, not `config.yaml`; move that snippet below the `config.yaml` fence",
      primary.fence.line
    );
  }

  if (localImages(page.body, page.dir).length === 0) {
    const inSubfolder = [...page.body.matchAll(IMAGE_REF_RE)].some((m) =>
      /^(?!https?:)[^/\\]+[/\\]/.test(m[1].replace(/^\.\//, ""))
    );
    err(
      'the page embeds no local image (`![Alt](photo.jpg "Title")` with a jpg, jpeg, png, ' +
        "webp or svg file next to `index.md`), so the importer skips it" +
        (inSubfolder ? "; images in a subfolder are not picked up" : "")
    );
  }

  const config = resolveSubstitutions(primary.config);
  const soc = resolveSoc(fm, config);
  if (soc.block === null) {
    if (soc.unsupported !== null) {
      findings.push({
        level: "notice",
        file: page.rel,
        message:
          `${IMPORTER}: the importer does not handle \`${soc.unsupported}\` devices yet, ` +
          "so this page is not imported; nothing to fix on the page",
      });
      return findings;
    }
    const family = soc.family ?? IMPORTER_SOC_FAMILIES.join("`, `");
    const hint =
      "packages" in config
        ? "; a config that pulls its hardware in through `packages:` cannot be imported"
        : "";
    err(`the config has no \`${family}:\` block, so the importer cannot tell the SoC${hint}`);
    return findings;
  }
  const family = soc.family as string;
  if (resolveBoard(family, soc.block) === null) {
    err(
      family === "esp32"
        ? "`esp32:` sets neither a concrete `board:` nor a `variant:`, so the importer has no board id"
        : `\`${family}:\` has no concrete \`board:\`, so the importer has no board id`
    );
  }

  if (liftableComponents(config).length === 0) {
    err(
      "no hardware component the importer can lift: add the device's sensors, switches, lights " +
        "or outputs to `config.yaml` as platform entries with their pins"
    );
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Check 1: esphome config
// ---------------------------------------------------------------------------

export interface ConfigTarget {
  file: string; // yaml file name inside the device folder
  mergeOnto: string | null; // base file for a fragment
}

/** A file with its own `esphome: name:` validates alone; anything else is a fragment. */
export function isStandalone(parsed: unknown): boolean {
  return isMapping(parsed) && isMapping(parsed.esphome) && "name" in parsed.esphome;
}

export function configTargets(page: Page): { targets: ConfigTarget[]; findings: Finding[] } {
  const targets: ConfigTarget[] = [];
  const findings: Finding[] = [];
  const files: string[] = [];
  for (const f of page.fences) {
    if (f.file !== null && !files.includes(f.file) && !/[/\\]|\.\./.test(f.file)) {
      files.push(f.file);
    }
  }
  const hasConfig = files.includes("config.yaml");
  for (const file of files) {
    let parsed: unknown;
    try {
      parsed = loadYaml(fs.readFileSync(path.join(page.dir, file), "utf8"));
    } catch {
      continue; // a missing file is validate-yaml's finding
    }
    if (file === "config.yaml") {
      targets.unshift({ file, mergeOnto: null });
    } else if (isStandalone(parsed)) {
      targets.push({ file, mergeOnto: null });
    } else if (hasConfig) {
      targets.push({ file, mergeOnto: "config.yaml" });
    } else {
      findings.push({
        level: "error",
        file: path.join(path.dirname(page.rel), file),
        message:
          "ESPHome: this file has no `esphome: name:` and the page has no `config.yaml` to merge it onto",
      });
    }
  }
  return { targets, findings };
}

const ANSI_RE = /\x1b\[[0-9;]*m/g;

/** The `Failed config` block of `esphome config` output, else its ERROR lines. */
export function trimEsphomeError(stdout: string, stderr: string, workDir: string): string {
  const clean = (s: string): string[] =>
    s.replace(ANSI_RE, "").split(workDir + path.sep).join("").split("\n");
  const out = clean(stdout);
  const failed = out.findIndex((l) => /^Failed config/.test(l));
  let picked =
    failed >= 0
      ? out.slice(failed)
      : [...out, ...clean(stderr)].filter((l) => /\b(ERROR|Error)\b/.test(l));
  if (picked.length === 0) picked = clean(stderr).slice(-10);
  picked = picked.filter((l) => l.trim() !== "");
  const capped = picked.slice(0, 30);
  if (picked.length > capped.length) capped.push("...");
  return capped.join("\n");
}

// What a user's own config adds around the hardware before a page's add-on
// fragment can work: the API, OTA, and a network when `config.yaml` has none.
const NETWORK_COMPONENTS = ["wifi", "ethernet", "openthread"];

export function userScaffold(base: unknown): string {
  const lines = ["api:", "ota:", "  - platform: esphome"];
  if (!isMapping(base) || !NETWORK_COMPONENTS.some((c) => c in base)) {
    lines.push("wifi:", "  ap: {}");
  }
  return lines.join("\n") + "\n";
}

function runEsphomeConfig(
  page: Page,
  target: ConfigTarget,
  bin: string,
  timeoutMs: number
): Promise<string | null> {
  const work = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "esphome-config-")));
  const copy = path.join(work, path.basename(page.dir));
  fs.cpSync(page.dir, copy, { recursive: true });
  let entry = target.file;
  if (target.mergeOnto !== null) {
    entry = `__merged-${target.file}`;
    const base = loadYaml(fs.readFileSync(path.join(copy, target.mergeOnto), "utf8"));
    fs.writeFileSync(path.join(copy, "__user-scaffold.yaml"), userScaffold(base));
    fs.writeFileSync(
      path.join(copy, entry),
      "packages:\n" +
        `  base: !include ${target.mergeOnto}\n` +
        "  user: !include __user-scaffold.yaml\n" +
        `  example: !include ${target.file}\n`
    );
  }
  return new Promise((resolve) => {
    execFile(
      bin,
      ["config", entry],
      { cwd: copy, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, NO_COLOR: "1" } },
      (error, stdout, stderr) => {
        fs.rmSync(work, { recursive: true, force: true });
        if (!error) return resolve(null);
        if (error.killed) return resolve(`\`esphome config\` did not finish within ${timeoutMs} ms`);
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          console.error(`esphome not found (${bin}); install it with \`pip install esphome\``);
          process.exit(2);
        }
        resolve(trimEsphomeError(stdout, stderr, copy));
      }
    );
  });
}

async function checkEsphome(page: Page, bin: string, timeoutMs: number): Promise<Finding[]> {
  const { targets, findings } = configTargets(page);
  const failedBases = new Set<string>();
  for (const target of targets) {
    if (target.mergeOnto !== null && failedBases.has(target.mergeOnto)) continue;
    const error = await runEsphomeConfig(page, target, bin, timeoutMs);
    if (error === null) continue;
    if (target.mergeOnto === null) failedBases.add(target.file);
    const how =
      target.mergeOnto === null
        ? "`esphome config` fails"
        : `\`esphome config\` fails with this file merged onto \`${target.mergeOnto}\` ` +
          "(plus `api:`, `ota:` and Wi-Fi, as a user's config would have)";
    findings.push({
      level: "error",
      file: path.join(path.dirname(page.rel), target.file),
      message: `ESPHome: ${how}:\n${error}`,
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Scope
// ---------------------------------------------------------------------------

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trimEnd();
}

function resolveRange(positional: string[]): [string, string] {
  const { BASE_SHA, HEAD_SHA } = process.env;
  let base: string;
  let head: string;
  if (BASE_SHA) [base, head] = [BASE_SHA, HEAD_SHA || "HEAD"];
  else if (positional.length >= 1) [base, head] = [positional[0], positional[1] || "HEAD"];
  else [base, head] = ["origin/main", "HEAD"];
  try {
    base = git("merge-base", base, head);
  } catch {
    // keep the plain base when there is no common ancestor
  }
  return [base, head];
}

/** Device folder names touched by the diff (added, copied, modified or renamed files). */
export function changedDeviceDirs(diffNames: string): string[] {
  const dirs = new Set<string>();
  for (const name of diffNames.split("\n")) {
    const m = /^src\/docs\/devices\/([^/]+)\/[^/]+$/.exec(name.trim());
    if (m) dirs.add(m[1]);
  }
  return [...dirs].sort();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const escData = (s: string): string =>
  String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escProp = (s: string): string => escData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");

async function mapPool<T, R>(items: T[], jobs: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(jobs, items.length) }, worker));
  return results;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const positional = argv.filter((a) => !a.startsWith("--"));
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const devicesRoot = process.env.DEVICES_ROOT
    ? path.resolve(process.env.DEVICES_ROOT)
    : path.join(repoRoot, "src", "docs", "devices");

  let dirs: string[];
  const namedDirs = positional.filter((p) => fs.existsSync(path.join(devicesRoot, p, "index.md")));
  if (flags.has("--all")) {
    dirs = fs
      .readdirSync(devicesRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } else if (namedDirs.length > 0 && namedDirs.length === positional.length) {
    dirs = namedDirs;
  } else {
    const [base, head] = resolveRange(positional);
    console.error(`Diffing ${base}..${head}`);
    dirs = changedDeviceDirs(
      git("diff", "--name-only", "--diff-filter=ACMR", base, head, "--", "src/docs/devices")
    );
  }

  const pages: Page[] = [];
  const skipped: string[] = [];
  for (const dir of dirs) {
    const page = loadPage(path.join(devicesRoot, dir), repoRoot);
    if (page === null) continue;
    const migrated = page.fences.some((f) => f.file !== null);
    if (!migrated && !(flags.has("--include-inline") && page.fences.length > 0)) {
      skipped.push(dir);
      continue;
    }
    pages.push(page);
  }

  if (flags.has("--detect")) {
    console.log(`${pages.length} device folder(s) in scope`);
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `run=${pages.length > 0}\n`);
    }
    return 0;
  }
  if (pages.length === 0) {
    console.log("No device pages with example configs to check.");
    return 0;
  }

  const bin = process.env.ESPHOME_BIN || "esphome";
  const timeoutMs = Number(process.env.CONFIG_TIMEOUT_MS || 180000);
  const jobs = Number(process.env.JOBS || Math.min(8, os.cpus().length));
  const results = await mapPool(pages, jobs, async (page) => {
    const findings = checkImport(page);
    if (!flags.has("--skip-esphome")) findings.push(...(await checkEsphome(page, bin, timeoutMs)));
    const failed = findings.some((f) => f.level === "error");
    console.error(`${failed ? "FAIL" : "ok  "} ${path.basename(page.dir)}`);
    return { page, findings };
  });

  const all = results.flatMap((r) => r.findings);
  const failedPages = results.filter((r) => r.findings.some((f) => f.level === "error"));
  for (const { page, findings } of results) {
    if (findings.length === 0) continue;
    console.log(`\n${path.relative(repoRoot, page.dir)}`);
    for (const f of findings) {
      const loc = f.line !== undefined ? `${f.file}:${f.line}` : f.file;
      console.log(`  ${f.level.padEnd(6)} ${loc}\n    ${f.message.replace(/\n/g, "\n    ")}`);
    }
  }
  if (flags.has("--annotations")) {
    for (const f of all) {
      const line = f.line !== undefined ? `,line=${f.line}` : "";
      const title = f.message.startsWith("ESPHome") ? "ESPHome config" : IMPORTER;
      console.log(`::${f.level} file=${escProp(f.file)}${line},title=${escProp(title)}::${escData(f.message)}`);
    }
  }
  const summary =
    `${pages.length - failedPages.length}/${pages.length} device page(s) passed` +
    (skipped.length > 0 ? `; ${skipped.length} without file= configs skipped` : "");
  console.log(`\n${summary}`);
  return failedPages.length > 0 ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code));
}
