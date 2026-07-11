/**
 * Check external links in added or modified markdown files.
 *
 * Used by the `link_check` job in `.github/workflows/ci.yaml` and the weekly
 * `weekly-link-check.yml` workflow. Runnable locally via the `check-links`
 * npm script (defined in package.json):
 *
 *   npm run check-links                  # diff merge-base(origin/main, HEAD)..HEAD
 *   npm run check-links -- <base> [head] # explicit refs
 *   npm run check-links -- --all         # every tracked .md/.mdx under src/
 *   BASE_SHA=... HEAD_SHA=... npm run check-links   # CI diff mode
 *
 * Output modes (used by automated CI jobs):
 *   --annotations  Additionally emit `::error file=...` GitHub Actions
 *                  workflow commands so each broken link surfaces as an
 *                  inline PR annotation. Used by the PR `link_check` job.
 *   --json         Stdout is a single JSON object listing every failure
 *                  with status / error / locations. All progress output
 *                  goes to stderr. Used by the weekly job.
 *
 * Default (no flag) is human-readable: streaming `FAIL` blocks plus a
 * one-line summary on stderr.
 *
 * Exits 0 if every external URL returns a good HTTP status (2xx/3xx, plus
 * 403/429 which are common transient or anti-bot responses), 1 otherwise.
 *
 * Reserved/private/loopback hostnames (RFC 2606, RFC 1918, mDNS .local,
 * link-local, loopback, 0.0.0.0) are skipped - they are unreachable from
 * CI and treated as explicit example/placeholder URLs. Links to GitHub's
 * `octocat` mascot account (github.com/octocat/...) are skipped for the
 * same reason - they are conventional placeholders, not real resources.
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

interface Location {
  file: string;
  line: number;
}

interface CheckResult {
  url: string;
  status: number;
  err?: string;
  ok: boolean;
}

interface ProbeResult {
  status?: number;
  err?: string;
}

const URL_RE = /https?:\/\/[^\s<>"`'()\[\]]+/g;
const TRAIL = /[.,;:!?\]>]+$/;
const SKIP = new RegExp(
  "^https?://(" +
    "[^/]+\\.(example|test|invalid|local|localhost)([:/]|$)" +
    "|(www\\.)?example\\.(com|net|org)([:/]|$)" +
    "|localhost([:/]|$)" +
    "|127\\.|10\\.|192\\.168\\." +
    "|172\\.(1[6-9]|2[0-9]|3[01])\\." +
    "|169\\.254\\.|0\\.0\\.0\\.0" +
    "|github\\.com/octocat(/|$)" +
    ")",
  "i",
);

const UA = "Mozilla/5.0 (compatible; esphome-devices link checker)";
const TIMEOUT_MS = 20_000;
const RETRIES = 2;
const RETRY_DELAY_MS = 2_000;
const CONCURRENCY = 8;
const ANNOTATIONS = process.argv.includes("--annotations");
const JSON_MODE = process.argv.includes("--json");

const accept = (s: number): boolean =>
  (s >= 200 && s < 400) || s === 403 || s === 429;

// Progress / human-readable output. Goes to stderr in JSON mode so stdout
// stays pure JSON; otherwise stdout for normal pipe-friendly behaviour.
const info = (msg: string): void =>
  JSON_MODE ? console.error(msg) : console.log(msg);

// Escape data for GitHub Actions workflow commands. URLs commonly contain
// `%` (e.g. `%20`) which would otherwise be interpreted as the start of a
// control sequence and corrupt the annotation.
// https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions
const escData = (s: string): string =>
  String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escProp = (s: string): string =>
  escData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trimEnd();
}

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
  const out = git("ls-files", "--", "src/");
  return out.split("\n").filter((f) => /\.(md|mdx)$/.test(f));
}

function changedMarkdownFiles(): string[] {
  const [base, head] = resolveRange();
  info(`Diffing ${base}..${head}`);
  // Include Added, Copied, Modified, Renamed - for renames/copies
  // `--name-only` reports the destination path, which is the file we
  // want to scan.
  const out = git(
    "diff", "--name-only", "--diff-filter=ACMR", base, head, "--", "src/",
  );
  return out.split("\n").filter((f) => /\.(md|mdx)$/.test(f));
}

function selectFiles(): string[] {
  if (process.argv.includes("--all")) {
    info("Scanning all tracked markdown under src/");
    return allMarkdownFiles();
  }
  return changedMarkdownFiles();
}

function extractUrls(files: string[]): Map<string, Location[]> {
  const locations = new Map<string, Location[]>();
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((lineText, i) => {
      for (const m of lineText.matchAll(URL_RE)) {
        const url = m[0].replace(TRAIL, "");
        if (SKIP.test(url)) continue;
        const arr = locations.get(url) ?? [];
        arr.push({ file, line: i + 1 });
        locations.set(url, arr);
      }
    });
  }
  return locations;
}

async function request(url: string, method: "HEAD" | "GET"): Promise<number> {
  const res = await fetch(url, {
    method,
    redirect: "follow",
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return res.status;
}

// Try HEAD first to save bandwidth; fall back to GET when the server
// doesn't accept HEAD (returns a non-success status or rejects the
// connection). Many servers/CDNs return 405/501/5xx or close the
// connection on HEAD even when GET works fine.
async function probe(url: string): Promise<ProbeResult> {
  try {
    const status = await request(url, "HEAD");
    if (accept(status)) return { status };
    const getStatus = await request(url, "GET");
    return { status: getStatus };
  } catch (e) {
    try {
      const status = await request(url, "GET");
      return { status };
    } catch (e2) {
      return { err: (e2 as Error).message || String(e2) };
    }
  }
}

async function check(url: string): Promise<CheckResult> {
  let status = 0;
  let err = "";
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const r = await probe(url);
    if (r.status !== undefined) {
      status = r.status;
      if (accept(status)) return { url, status, ok: true };
    } else if (r.err) {
      err = r.err;
    }
    if (attempt < RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  return { url, status, err, ok: accept(status) };
}

function reportFailure(r: CheckResult, locs: Location[]): void {
  // In JSON mode all output is deferred to a final emit; suppress the
  // streaming form so stdout stays pure JSON.
  if (JSON_MODE) return;

  const reason = r.status || r.err || "no response";
  console.log(`FAIL ${reason} ${r.url}`);
  for (const { file, line } of locs) {
    console.log(`     at ${file}:${line}`);
  }
  if (ANNOTATIONS) {
    const data = escData(`${reason} ${r.url}`);
    for (const { file, line } of locs) {
      console.log(
        `::error file=${escProp(file)},line=${line},title=Broken link::${data}`,
      );
    }
  }
}

function emitJson(
  checked: number,
  results: CheckResult[],
  locations: Map<string, Location[]>,
): void {
  const failures = results
    .filter((r) => !r.ok)
    .map((r) => ({
      url: r.url,
      status: r.status > 0 ? r.status : null,
      error: r.err || null,
      locations: locations.get(r.url) ?? [],
    }));
  process.stdout.write(
    JSON.stringify({ checked, failed: failures.length, failures }, null, 2) +
      "\n",
  );
}

async function main(): Promise<number> {
  const files = selectFiles();
  if (files.length === 0) {
    info("No markdown files to check.");
    if (JSON_MODE) emitJson(0, [], new Map());
    return 0;
  }
  info(
    `Files (${files.length}):\n  ${files.slice(0, 10).join("\n  ")}` +
      (files.length > 10 ? `\n  ...and ${files.length - 10} more` : ""),
  );

  const locations = extractUrls(files);
  if (locations.size === 0) {
    info("No external URLs to check.");
    if (JSON_MODE) emitJson(0, [], locations);
    return 0;
  }
  info(`Checking ${locations.size} unique URL(s)...`);

  // Use pop() so workers drain the queue in O(1); shift() would make the
  // worker loop O(n²) on the weekly --all run.
  const queue = [...locations.keys()];
  const results: CheckResult[] = [];
  async function worker(): Promise<void> {
    while (queue.length) {
      const url = queue.pop()!;
      const r = await check(url);
      results.push(r);
      if (!r.ok) reportFailure(r, locations.get(r.url) ?? []);
    }
  }
  await Promise.all(
    Array(Math.min(CONCURRENCY, queue.length)).fill(0).map(() => worker()),
  );

  if (JSON_MODE) emitJson(locations.size, results, locations);

  const fails = results.filter((r) => !r.ok);
  if (fails.length) {
    const msg = `${fails.length} URL(s) returned bad HTTP status`;
    if (ANNOTATIONS) console.log(`::error::${escData(msg)}`);
    else if (!JSON_MODE) console.error(msg);
    return 1;
  }
  if (!JSON_MODE) console.log("All URLs returned a good HTTP status.");
  return 0;
}

process.exit(await main());
