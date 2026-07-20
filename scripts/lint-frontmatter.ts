/**
 * Lint the YAML frontmatter of markdown files with yamllint.
 *
 * Used by the `frontmatter_lint` job in `.github/workflows/ci.yaml`. Runnable
 * locally via the `lint-frontmatter` npm script (defined in package.json):
 *
 *   npm run lint-frontmatter                  # diff merge-base(origin/main, HEAD)..HEAD
 *   npm run lint-frontmatter -- <base> [head] # explicit refs
 *   npm run lint-frontmatter -- --all         # every tracked .md/.mdx under src/
 *   BASE_SHA=... HEAD_SHA=... npm run lint-frontmatter   # CI diff mode
 *
 *   --annotations  Additionally emit `::error`/`::warning` GitHub Actions
 *                  workflow commands so each problem surfaces as an inline PR
 *                  annotation.
 *
 * markdownlint treats the `---` frontmatter block as opaque and the existing
 * `yaml_lint` job only scans standalone .yaml/.yml files, so malformed
 * frontmatter (trailing whitespace, extra spaces after a colon, bad
 * indentation, duplicate keys, non-canonical booleans) slips through both.
 * This extracts the frontmatter from each markdown file and runs it through
 * yamllint using the repo's `.yamllintrc`, so a single rule set governs both
 * standalone yaml and embedded frontmatter. Like `check-links` it is scoped to
 * the files changed in the current PR, so pre-existing issues on untouched
 * pages never block unrelated changes.
 *
 * Requires the `yamllint` binary on PATH (`pipx install yamllint`).
 *
 * Exits 1 if any error-level problem is found, mirroring yamllint's default
 * non-strict behaviour: warnings are reported but do not fail the build.
 * Exits 2 if yamllint is missing or cannot be invoked (e.g. a broken config).
 */

import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ANNOTATIONS = process.argv.includes("--annotations");
const CONFIG = ".yamllintrc";

// The frontmatter content starts on file line 2 (the line after the opening
// `---`). yamllint, fed only the inner content, numbers it from 1, so the
// original file line is the reported line plus this offset.
const LINE_OFFSET = 1;

interface Problem {
  file: string;
  line: number;
  col: number;
  level: string; // "error" | "warning"
  message: string;
}

// yamllint parsable line: `<path>:<line>:<col>: [<level>] <message>`
const PARSABLE_RE = /^(.*):(\d+):(\d+):\s*\[(\w+)\]\s*(.*)$/;

// Escape data for GitHub Actions workflow commands.
// https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions
const escData = (s: string): string =>
  String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escProp = (s: string): string =>
  escData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trimEnd();
}

const isMarkdown = (f: string): boolean => /\.(md|mdx)$/.test(f);

function resolveRange(): [string, string] {
  const { BASE_SHA, HEAD_SHA } = process.env;
  if (BASE_SHA) return [BASE_SHA, HEAD_SHA || "HEAD"];

  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (args.length >= 1) return [args[0], args[1] || "HEAD"];

  // Default: changes since branching off origin/main, like a PR diff.
  let base: string;
  try {
    base = git("merge-base", "origin/main", "HEAD");
  } catch {
    base = "origin/main";
  }
  return [base, "HEAD"];
}

function allMarkdownFiles(): string[] {
  return git("ls-files", "--", "src/").split("\n").filter(isMarkdown);
}

function changedMarkdownFiles(): string[] {
  const [base, head] = resolveRange();
  console.error(`Diffing ${base}..${head}`);
  const out = git(
    "diff", "--name-only", "--diff-filter=ACMR", base, head, "--", "src/",
  );
  return out.split("\n").filter(isMarkdown);
}

function selectFiles(): string[] {
  if (process.argv.includes("--all")) {
    console.error("Scanning all tracked markdown under src/");
    return allMarkdownFiles();
  }
  return changedMarkdownFiles();
}

interface Frontmatter {
  text?: string; // inner frontmatter, no `---` fences (present when well-formed)
  unterminated?: boolean; // opening `---` with no closing fence
}

// Returns the inner frontmatter (without the `---` fences), or null when the
// file has no frontmatter at all. Frontmatter must open on the very first
// line. An opening `---` with no closing fence is reported as `unterminated`
// rather than silently skipped, so a malformed header still fails the file.
function extractFrontmatter(file: string): Frontmatter | null {
  const lines = readFileSync(file, "utf8").split("\n");
  if (lines[0] !== "---") return null;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") return { text: lines.slice(1, i).join("\n") + "\n" };
  }
  return { unterminated: true };
}

function ensureYamllint(): void {
  const probe = spawnSync("yamllint", ["--version"], { encoding: "utf8" });
  if (probe.error) {
    console.error(
      "yamllint not found on PATH. Install it with `pipx install yamllint` " +
        "(or `pip install yamllint`).",
    );
    process.exit(2);
  }
}

// Write every file's frontmatter to a temp file, run yamllint once over the
// batch, then map each reported temp path back to its source markdown file.
// A single invocation keeps this fast even across many files.
function lint(files: string[]): Problem[] {
  const dir = mkdtempSync(join(tmpdir(), "fmlint-"));
  const byTemp = new Map<string, string>();
  const problems: Problem[] = [];
  try {
    for (const file of files) {
      const fm = extractFrontmatter(file);
      if (fm === null) continue;
      if (fm.unterminated) {
        problems.push({
          file,
          line: 1,
          col: 1,
          level: "error",
          message: "unterminated frontmatter: opening `---` has no closing `---`",
        });
        continue;
      }
      const temp = join(dir, `${byTemp.size}.yaml`);
      writeFileSync(temp, fm.text!);
      byTemp.set(temp, file);
    }

    if (byTemp.size === 0) return problems;

    const res = spawnSync(
      "yamllint",
      ["-c", CONFIG, "-f", "parsable", ...byTemp.keys()],
      { encoding: "utf8" },
    );
    if (res.error) {
      console.error(`Failed to run yamllint: ${res.error.message}`);
      process.exit(2);
    }
    // yamllint exits 0 (no problems) or 1 (problems found) in normal
    // operation, writing diagnostics to stdout. Any other status, or anything
    // on stderr (e.g. an unreadable file or a broken `.yamllintrc`, which
    // surfaces as an exit-1 Python traceback) means the run is untrustworthy —
    // fail loudly rather than reporting zero problems.
    if (res.status !== 0 && res.status !== 1) {
      console.error(`yamllint exited with status ${res.status}.`);
      if (res.stderr) console.error(res.stderr.trimEnd());
      process.exit(2);
    }
    if (res.stderr && res.stderr.trim()) {
      console.error("yamllint reported an error on stderr:");
      console.error(res.stderr.trimEnd());
      process.exit(2);
    }

    for (const rawLine of res.stdout.split("\n")) {
      const m = PARSABLE_RE.exec(rawLine);
      if (!m) continue;
      const file = byTemp.get(m[1]);
      if (!file) continue;
      problems.push({
        file,
        line: Number(m[2]) + LINE_OFFSET,
        col: Number(m[3]),
        level: m[4],
        message: m[5],
      });
    }
    return problems;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function report(problems: Problem[]): void {
  const byFile = new Map<string, Problem[]>();
  for (const p of problems) {
    const arr = byFile.get(p.file) ?? [];
    arr.push(p);
    byFile.set(p.file, arr);
  }

  for (const [file, probs] of byFile) {
    console.log(file);
    for (const p of probs) {
      console.log(`  ${p.line}:${p.col}  ${p.level.padEnd(7)}  ${p.message}`);
    }
  }

  if (ANNOTATIONS) {
    for (const p of problems) {
      const cmd = p.level === "error" ? "error" : "warning";
      console.log(
        `::${cmd} file=${escProp(p.file)},line=${p.line},col=${p.col}` +
          `,title=Frontmatter YAML::${escData(p.message)}`,
      );
    }
  }
}

function main(): number {
  ensureYamllint();

  const files = selectFiles();
  if (files.length === 0) {
    console.log("No markdown files to check.");
    return 0;
  }

  const problems = lint(files);
  if (problems.length === 0) {
    console.log(`Frontmatter OK in ${files.length} markdown file(s).`);
    return 0;
  }

  report(problems);

  const errors = problems.filter((p) => p.level === "error").length;
  const warnings = problems.length - errors;
  const summary =
    `${problems.length} frontmatter problem(s): ` +
    `${errors} error(s), ${warnings} warning(s)`;
  if (errors > 0) {
    if (ANNOTATIONS) console.log(`::error::${escData(summary)}`);
    else console.error(summary);
    return 1;
  }
  console.log(summary);
  return 0;
}

process.exit(main());
