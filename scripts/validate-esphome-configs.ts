#!/usr/bin/env tsx
/**
 * Validate changed device pages with `esphome config` and the ESPHome Device
 * Builder's importer. The rules are in AGENTS.md, "ESPHome and Device Builder
 * checks".
 *
 *   npm run validate-esphome                  # folders changed since merge-base(origin/main, HEAD)
 *   npm run validate-esphome -- <base> [head] # explicit refs
 *   npm run validate-esphome -- <Device-Dir>  # one or more device folders
 *   npm run validate-esphome -- --all         # every device folder
 *   --annotations                             # also emit GitHub Actions annotations
 *
 * A page whose configs could pull in outside code (see external-code-scan.ts)
 * gets a notice and is not run through either check.
 *
 * Environment: ESPHOME_BIN (default "esphome"); DEVICE_BUILDER_CMD (the
 * importer command), or DEVICE_BUILDER_DIR and DEVICE_BUILDER_PYTHON, for the
 * import check (skipped when unset); CONFIG_TIMEOUT_MS; JOBS; BASE_SHA /
 * HEAD_SHA (CI diff range).
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { changedPaths } from "./changed-paths.ts";
import { scanExternalCode } from "./external-code-scan.ts";
import { NETWORK_FAILURE_RE, stripAnsi } from "./review-made-for-esphome.ts";
import { ESPHOME_YAML_SCHEMA, findYamlFences, type Issue } from "./validate-yaml-configs.ts";

const execFileAsync = promisify(execFile);

export type Check = "esphome" | "import" | "scan";

export interface Finding extends Issue {
  check: Check;
  level: "error" | "warning" | "notice";
}

export interface Target {
  file: string; // yaml file in the device folder
  mergeOnto: string | null; // base file for an add-on fragment
  parsed: unknown;
}

export interface Page {
  dir: string; // absolute device folder
  rel: string; // repo-relative index.md
  files: string[]; // every file= target, including ones that failed to load
  targets: Target[];
  findings: Finding[];
}

const NETWORK_COMPONENTS = ["wifi", "ethernet", "openthread"];
// Download failures: CI runs ESPHome without network access.
const DOWNLOAD_FAILURE_RE =
  /Max retries exceeded|NameResolutionError|Failed to resolve|Could not download|Unable to download|ConnectionError/i;
const SECRETS_FILES = new Set(["secrets.yaml", "secrets.yml"]);

type Mapping = Record<string, unknown>;

const isMapping = (v: unknown): v is Mapping =>
  v !== null && typeof v === "object" && !Array.isArray(v);

function parseYaml(text: string): unknown {
  try {
    return yaml.load(text, { schema: ESPHOME_YAML_SCHEMA });
  } catch {
    return undefined; // validate-yaml reports parse errors
  }
}

/** A file with its own `esphome: name:` validates alone; anything else is an add-on fragment. */
export function isStandalone(parsed: unknown): boolean {
  return isMapping(parsed) && isMapping(parsed.esphome) && "name" in parsed.esphome;
}

/** The page's `file=` targets, each parsed once, or null when it has none. */
export function loadPage(deviceDir: string, repoRoot: string): Page | null {
  const indexPath = path.join(deviceDir, "index.md");
  let md: string;
  try {
    md = fs.readFileSync(indexPath, "utf8");
  } catch {
    return null;
  }
  const files = [
    ...new Set(
      findYamlFences(md)
        .map((f) => f.fileAttr?.replace(/^\.\//, ""))
        .filter((f): f is string => !!f && !/[/\\]|\.\./.test(f))
    ),
  ];
  if (files.length === 0) return null;
  const rel = path.relative(repoRoot, indexPath);
  const page: Page = { dir: deviceDir, rel, files, targets: [], findings: [] };
  const parsed = new Map<string, unknown>();
  for (const file of files) {
    try {
      parsed.set(file, parseYaml(fs.readFileSync(path.join(deviceDir, file), "utf8")));
    } catch {
      // a missing file is validate-yaml's finding
    }
  }
  for (const [file, tree] of parsed) {
    if (file === "config.yaml") {
      page.targets.unshift({ file, mergeOnto: null, parsed: tree });
    } else if (isStandalone(tree)) {
      page.targets.push({ file, mergeOnto: null, parsed: tree });
    } else if (parsed.has("config.yaml")) {
      page.targets.push({ file, mergeOnto: "config.yaml", parsed: tree });
    } else {
      page.findings.push({
        check: "esphome",
        level: "error",
        file: path.join(path.dirname(rel), file),
        message: "this file has no `esphome: name:` and the page has no `config.yaml` to merge it onto",
      });
    }
  }
  return page;
}

/** The `api:`, `ota:` and, when neither file has a network, Wi-Fi a user's config adds. */
export function userScaffold(base: unknown, fragment: unknown): string {
  const hasNetwork = (t: unknown): boolean =>
    isMapping(t) && NETWORK_COMPONENTS.some((c) => c in t);
  const lines = ["api:", "ota:", "  - platform: esphome"];
  if (!hasNetwork(base) && !hasNetwork(fragment)) lines.push("wifi:", "  ap: {}");
  return lines.join("\n") + "\n";
}

/** The `Failed config` block of `esphome config` output, else its error lines. */
export function trimEsphomeError(stdout: string, stderr: string, workDir: string): string {
  const clean = (s: string): string[] =>
    stripAnsi(s).split(workDir + path.sep).join("").split("\n");
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

/** Line of the first `[source <file>:<line>]` marker for *file* in ESPHome's output. */
export function sourceLine(output: string, file: string): number | undefined {
  for (const m of output.matchAll(/\[source ([^\]]+):(\d+)\]/g)) {
    if (m[1] === file) return Number(m[2]);
  }
  return undefined;
}

/** Device folder names with a path changed directly or below them. */
export function deviceDirsOf(paths: string[]): string[] {
  const dirs = new Set<string>();
  for (const p of paths) {
    const m = /^src\/docs\/devices\/([^/]+)\/.+/.exec(p);
    if (m) dirs.add(m[1]);
  }
  return [...dirs].sort();
}

// ---------------------------------------------------------------------------
// Running ESPHome
// ---------------------------------------------------------------------------

class FatalError extends Error {}

function limiter(jobs: number): <T>(fn: () => Promise<T>) => Promise<T> {
  let active = 0;
  const queue: (() => void)[] = [];
  return async (fn) => {
    if (active >= jobs) await new Promise<void>((resolve) => queue.push(resolve));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}

export interface Runner {
  bin: string;
  timeoutMs: number;
  limit: <T>(fn: () => Promise<T>) => Promise<T>;
}

async function esphomeConfig(
  runner: Runner,
  cwd: string,
  entry: string
): Promise<{ ok: true } | { ok: false; stdout: string; stderr: string; timedOut: boolean }> {
  try {
    await runner.limit(() =>
      execFileAsync(runner.bin, ["config", entry], {
        cwd,
        timeout: runner.timeoutMs,
        maxBuffer: 64 * 1024 * 1024,
        env: { ...process.env, NO_COLOR: "1" },
      })
    );
    return { ok: true };
  } catch (err) {
    // `code` is the errno string for a spawn failure, else the exit status.
    const e = err as { code?: string | number; signal?: string; stdout?: string; stderr?: string };
    if (e.code === "ENOENT") {
      throw new FatalError(`esphome not found (${runner.bin}); install it with \`pip install esphome\``);
    }
    if (e.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
      return { ok: false, stdout: "", stderr: "`esphome config` printed more than 64 MiB of output", timedOut: false };
    }
    if (typeof e.code === "string") {
      throw new FatalError(`esphome could not be run (${runner.bin}, ${e.code}): ${String(err)}`);
    }
    // 124 is the sandbox's own `timeout`; a signal with no exit status is Node's limit.
    const timedOut = e.code === 124 || (e.code == null && !!e.signal);
    return { ok: false, stdout: e.stdout ?? "", stderr: e.stderr ?? "", timedOut };
  }
}

async function checkTarget(page: Page, work: string, target: Target, runner: Runner): Promise<boolean> {
  let entry = target.file;
  if (target.mergeOnto !== null) {
    const base = page.targets.find((t) => t.file === target.mergeOnto)?.parsed;
    entry = `__merged-${target.file}`;
    fs.writeFileSync(path.join(work, `__user-${target.file}`), userScaffold(base, target.parsed));
    fs.writeFileSync(
      path.join(work, entry),
      "packages:\n" +
        `  base: !include ${target.mergeOnto}\n` +
        `  user: !include __user-${target.file}\n` +
        `  example: !include ${target.file}\n`
    );
  }
  const result = await esphomeConfig(runner, work, entry);
  if (result.ok) return true;
  const file = path.join(path.dirname(page.rel), target.file);
  const how =
    target.mergeOnto === null
      ? "`esphome config` fails"
      : `\`esphome config\` fails with this file merged onto \`${target.mergeOnto}\` ` +
        "(plus `api:`, `ota:` and Wi-Fi, as a user's config would have)";
  if (result.timedOut) {
    page.findings.push({
      check: "esphome",
      level: "warning",
      file,
      message: "`esphome config` hit the CI time limit; inconclusive",
    });
    return false;
  }
  const blob = `${result.stderr}\n${result.stdout}`;
  const error = trimEsphomeError(result.stdout, result.stderr, work);
  // A "Failed config" block is ESPHome's verdict; only it decides whether this
  // was a download failure, so a logged fetch attempt can't hide a schema error.
  const evidence = /Failed config/.test(blob) ? error : blob;
  const network = NETWORK_FAILURE_RE.test(evidence) || DOWNLOAD_FAILURE_RE.test(evidence);
  page.findings.push({
    check: "esphome",
    level: network ? "warning" : "error",
    file,
    line: sourceLine(error, target.file),
    message: network
      ? `needs to download a remote file (font, image, model, package), and CI runs ESPHome ` +
        `without network access; not validated:\n${error}`
      : `${how}:\n${error}`,
  });
  return false;
}

/** Validate every target of *page* in one work copy: standalone files first, then fragments. */
export async function checkEsphome(page: Page, runner: Runner): Promise<void> {
  if (page.targets.length === 0) return;
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "esphome-config-")));
  const work = path.join(tmp, path.basename(page.dir));
  try {
    fs.cpSync(page.dir, work, {
      recursive: true,
      filter: (src) => !SECRETS_FILES.has(path.basename(src)),
    });
    const [first, ...rest] = page.targets;
    // The first target fetches the page's packages and components once; the
    // rest reuse them from the shared work copy.
    const firstOk = await checkTarget(page, work, first, runner);
    const failedBases = new Set(firstOk ? [] : [first.file]);
    const standalone = rest.filter((t) => t.mergeOnto === null);
    const results = await Promise.all(standalone.map((t) => checkTarget(page, work, t, runner)));
    standalone.forEach((t, i) => {
      if (!results[i]) failedBases.add(t.file);
    });
    const fragments = rest.filter((t) => t.mergeOnto !== null);
    for (const t of fragments.filter((f) => failedBases.has(f.mergeOnto as string))) {
      page.findings.push({
        check: "esphome",
        level: "notice",
        file: path.join(path.dirname(page.rel), t.file),
        message: `not validated: \`${t.mergeOnto}\` did not validate, so this file wasn't merged onto it`,
      });
    }
    const runnable = fragments.filter((t) => !failedBases.has(t.mergeOnto as string));
    await Promise.all(runnable.map((t) => checkTarget(page, work, t, runner)));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Device Builder import
// ---------------------------------------------------------------------------

interface ImportRow {
  device: string;
  imported: boolean;
  reason: string | null;
}

export async function checkImport(pages: Page[], repoRoot: string): Promise<boolean> {
  if (pages.length === 0) return false;
  const dbDir = process.env.DEVICE_BUILDER_DIR;
  const cmd = process.env.DEVICE_BUILDER_CMD;
  if (!cmd && !dbDir) {
    console.error(
      "Device Builder import check skipped: set DEVICE_BUILDER_DIR to an esphome/device-builder " +
        "checkout and DEVICE_BUILDER_PYTHON to a Python with it installed"
    );
    return false;
  }
  const [bin, ...prefix] = cmd
    ? [cmd]
    : [
        process.env.DEVICE_BUILDER_PYTHON || "python3",
        path.join(dbDir as string, "script", "sync_esphome_devices.py"),
      ];
  const args = [
    ...prefix,
    "--repo",
    repoRoot,
    "--check",
    "--json",
    ...pages.flatMap((p) => ["--device", path.basename(p.dir)]),
  ];
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync(bin, args, { maxBuffer: 64 * 1024 * 1024 }));
  } catch (err) {
    const e = err as { code?: number | string; stdout?: string; stderr?: string };
    if (e.code !== 1 || !e.stdout) {
      throw new FatalError(`Device Builder importer failed:\n${e.stderr ?? String(err)}`);
    }
    stdout = e.stdout;
  }
  const rows: unknown = JSON.parse(stdout);
  if (!Array.isArray(rows)) {
    throw new FatalError(`Device Builder importer returned no result list:\n${stdout}`);
  }
  const byDevice = new Map(pages.map((p) => [path.basename(p.dir), p]));
  const answered = new Set<string>();
  for (const row of rows as ImportRow[]) {
    answered.add(row.device);
    const page = byDevice.get(row.device);
    if (!page || row.imported) continue;
    page.findings.push({
      check: "import",
      level: "error",
      file: page.rel,
      message: `the ESPHome Device Builder would not import this page: ${row.reason ?? "no reason given"}`,
    });
  }
  for (const [device, page] of byDevice) {
    if (answered.has(device)) continue;
    page.findings.push({
      check: "import",
      level: "error",
      file: page.rel,
      message: "the ESPHome Device Builder importer returned no result for this page",
    });
  }
  return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trimEnd();
}

function isCommit(ref: string): boolean {
  try {
    git("rev-parse", "--verify", "--quiet", `${ref}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

function selectDirs(flags: Set<string>, positional: string[], devicesRoot: string): string[] {
  if (flags.has("--all")) {
    return fs
      .readdirSync(devicesRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  }
  const named = positional.filter((p) => fs.existsSync(path.join(devicesRoot, p)));
  if (named.length > 0 || positional.some((p) => !isCommit(p))) {
    const unknown = positional.filter((p) => !named.includes(p));
    if (unknown.length > 0) throw new FatalError(`unknown device folder or git ref: ${unknown.join(", ")}`);
    return named;
  }
  const { BASE_SHA, HEAD_SHA } = process.env;
  const [base, head] = BASE_SHA
    ? [BASE_SHA, HEAD_SHA || "HEAD"]
    : [positional[0] ?? "origin/main", positional[1] ?? "HEAD"];
  const mergeBase = git("merge-base", base, head);
  console.error(`Diffing ${mergeBase}..${head}`);
  return deviceDirsOf(changedPaths(mergeBase, head, "src/docs/devices").map((c) => c.path));
}

const escData = (s: string): string =>
  String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escProp = (s: string): string => escData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");
const TITLES: Record<Check, string> = {
  esphome: "ESPHome config",
  import: "Device Builder import",
  scan: "Not validated",
};

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const positional = argv.filter((a) => !a.startsWith("--"));
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const devicesRoot = path.join(repoRoot, "src", "docs", "devices");

  const pages = selectDirs(flags, positional, devicesRoot)
    .map((d) => loadPage(path.join(devicesRoot, d), repoRoot))
    .filter((p): p is Page => p !== null);
  if (pages.length === 0) {
    console.log("No device pages with file= configs to check.");
    return 0;
  }

  const runner: Runner = {
    bin: process.env.ESPHOME_BIN || "esphome",
    timeoutMs: Number(process.env.CONFIG_TIMEOUT_MS || 180000),
    limit: limiter(Number(process.env.JOBS || Math.min(8, os.cpus().length))),
  };
  const runnable: Page[] = [];
  for (const page of pages) {
    const { external, broken } = scanExternalCode(page.dir, page.files);
    for (const reason of broken) {
      page.findings.push({ check: "scan", level: "error", file: page.rel, message: reason });
    }
    if (broken.length > 0) continue;
    if (external.length === 0) {
      runnable.push(page);
      continue;
    }
    page.findings.push({
      check: "scan",
      level: "notice",
      file: page.rel,
      message:
        "not validated with ESPHome or the Device Builder: this page's config could pull in code " +
        `from outside the device folder, which CI does not run (${external.join("; ")})`,
    });
  }
  await Promise.all([
    checkImport(runnable, repoRoot),
    ...runnable.map((p) => checkEsphome(p, runner)),
  ]);

  const findings = pages.flatMap((p) => p.findings);
  const errors = findings.filter((f) => f.level === "error");
  for (const page of pages) {
    const name = path.basename(page.dir);
    const failed = page.findings.some((f) => f.level === "error");
    console.log(`${failed ? "FAIL" : "ok  "} ${name}`);
    for (const f of page.findings) {
      const loc = f.line !== undefined ? `${f.file}:${f.line}` : f.file;
      console.log(`  ${f.level} [${TITLES[f.check]}] ${loc}\n    ${f.message.replace(/\n/g, "\n    ")}`);
    }
  }
  if (flags.has("--annotations")) {
    for (const f of findings) {
      const line = f.line !== undefined ? `,line=${f.line}` : "";
      console.log(
        `::${f.level} file=${escProp(f.file)}${line},title=${escProp(TITLES[f.check])}::${escData(f.message)}`
      );
    }
  }
  const failedPages = pages.filter((p) => p.findings.some((f) => f.level === "error")).length;
  console.log(`\n${pages.length - failedPages}/${pages.length} device page(s) passed`);
  return failedPages > 0 ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(err instanceof FatalError ? err.message : err);
      process.exit(2);
    }
  );
}
