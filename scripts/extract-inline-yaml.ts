#!/usr/bin/env tsx
/**
 * Extract inline yaml/yml fenced code blocks from markdown into sibling
 * .yaml files and rewrite each block to `\`\`\`yaml file=<name>.yaml` with
 * an empty body. The build-time remark-yaml-include plugin re-inlines the
 * contents on render.
 *
 * Idempotent: a fence already in `file=…` form with empty content is left
 * untouched, so running this script multiple times produces no diff.
 *
 * Usage:
 *   extract-inline-yaml.ts <path>        Process one markdown file or directory.
 *   extract-inline-yaml.ts --all         Process every markdown file under
 *                                        src/docs/ (bulk migration).
 *   extract-inline-yaml.ts --check       Read-only check: exit non-zero if any
 *                                        markdown still has inline yaml.
 *
 * Flags:
 *   --dry-run Report what would change, write nothing.
 *   --root    Override the docs root used by --all / --check (default src/docs).
 *
 * One of <path>, --all, or --check is required so a stray invocation can't
 * silently bulk-rewrite the whole tree.
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

interface Fence {
  startLine: number; // index of opening fence line in source
  endLine: number; // index of closing fence line in source
  fenceChar: string; // backtick or tilde
  fenceLen: number; // number of fence chars on opening line
  indent: string; // any leading whitespace on opening fence
  lang: string; // raw language token (yaml/yml/...)
  meta: string; // remainder of info string after the lang
  body: string[]; // content lines between fences (verbatim, no trailing \n)
}

interface MetaAttrs {
  fileAttr?: { value: string; quoted: boolean };
  urlAttr?: { value: string; quoted: boolean };
  title?: { value: string; quoted: boolean };
  inline?: boolean;
  raw: string;
}

const FENCE_OPEN = /^(\s*)(`{3,}|~{3,})\s*([A-Za-z0-9_+\-]+)?\s*(.*)$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;

function parseMeta(meta: string): MetaAttrs {
  const out: MetaAttrs = { raw: meta };
  // Match  key="value", key='value', or key=value (unquoted form excludes
  // stray quote chars so e.g. `url=foo"` does not silently capture the `"`).
  const re = /(\w[\w-]*)=(?:"([^"]*)"|'([^']*)'|([^\s"']+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(meta)) !== null) {
    const key = m[1];
    const dq = m[2] !== undefined;
    const sq = m[3] !== undefined;
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    const quoted = dq || sq;
    if (key === "file") out.fileAttr = { value, quoted };
    else if (key === "url") out.urlAttr = { value, quoted };
    else if (key === "title") out.title = { value, quoted };
  }
  // Bare `inline` marker (no `=value`) opts the snippet out of extraction.
  out.inline = /(^|\s)inline(?=\s|$)/.test(meta);
  return out;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function sanitizeFilename(s: string): string {
  // Allow only safe filename characters; never let a value escape the dir.
  const base = path.basename(s.replace(/\\/g, "/"));
  return base.replace(/[^A-Za-z0-9._+\-]/g, "-");
}

function findFences(lines: string[]): Fence[] {
  const fences: Fence[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(FENCE_OPEN);
    if (m && m[2]) {
      const indent = m[1] ?? "";
      const fenceMarker = m[2];
      const fenceChar = fenceMarker[0];
      const fenceLen = fenceMarker.length;
      const lang = (m[3] ?? "").trim();
      const meta = (m[4] ?? "").trim();
      const startLine = i;
      // Find the matching close fence (same char, length >= open length,
      // optional leading whitespace, nothing else on the line).
      const closeRe = new RegExp(
        `^\\s*${fenceChar === "`" ? "`" : "~"}{${fenceLen},}\\s*$`
      );
      let j = i + 1;
      let endLine = -1;
      while (j < lines.length) {
        if (closeRe.test(lines[j])) {
          endLine = j;
          break;
        }
        j++;
      }
      if (endLine === -1) {
        // Unterminated fence — treat the rest of the file as not a fence so
        // we don't drop content. Skip past this opener.
        i++;
        continue;
      }
      const body = lines.slice(startLine + 1, endLine);
      fences.push({
        startLine,
        endLine,
        fenceChar,
        fenceLen,
        indent,
        lang,
        meta,
        body,
      });
      i = endLine + 1;
    } else {
      i++;
    }
  }
  return fences;
}

function findHeadings(lines: string[], fences: Fence[]): { line: number; level: number; text: string }[] {
  const inFence = new Array(lines.length).fill(false);
  for (const f of fences) {
    for (let k = f.startLine; k <= f.endLine; k++) inFence[k] = true;
  }
  const out: { line: number; level: number; text: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (inFence[i]) continue;
    const m = lines[i].match(HEADING);
    if (m) out.push({ line: i, level: m[1].length, text: m[2] });
  }
  return out;
}

function chooseFilename(opts: {
  fence: Fence;
  meta: MetaAttrs;
  headings: { line: number; level: number; text: string }[];
  takenInDir: Set<string>;
  takenByThisRun: Map<string, string>; // fenceKey -> filename
  fenceKey: string;
  perHeadingCount: Map<string, number>;
  isFirstFence: boolean;
}): string {
  const { fence, meta, headings, takenInDir, takenByThisRun, fenceKey, perHeadingCount, isFirstFence } = opts;

  // 1. Honour an explicit `title="something.yaml"` if the user wrote one.
  if (meta.title?.value) {
    const t = meta.title.value;
    let name = sanitizeFilename(t);
    if (!/\.(ya?ml)$/i.test(name)) name += ".yaml";
    return name;
  }

  // 2. The very first yaml fence on a page is always config.yaml. This is
  //    the canonical hardware-only example; the validator enforces the
  //    naming and content rules.
  if (isFirstFence) return "config.yaml";

  // 3. Slugify the most recent heading at-or-above this fence.
  let baseSlug = "inline";
  for (let i = headings.length - 1; i >= 0; i--) {
    if (headings[i].line < fence.startLine) {
      const slug = slugify(headings[i].text);
      if (slug) baseSlug = slug;
      break;
    }
  }

  // 4. If multiple yaml fences fall under the same heading, suffix -N (1-indexed
  //    only when we're past the first occurrence).
  const headingKey = baseSlug;
  const idx = perHeadingCount.get(headingKey) ?? 0;
  perHeadingCount.set(headingKey, idx + 1);
  const candidate = idx === 0 ? `${baseSlug}.yaml` : `${baseSlug}-${idx + 1}.yaml`;

  // 5. Avoid colliding with unrelated files in the directory or earlier picks
  //    in this run. If a name is taken by a different fence, bump the suffix.
  if (takenByThisRun.get(fenceKey) === candidate) return candidate;
  let final = candidate;
  let bump = idx + 1;
  while (takenInDir.has(final.toLowerCase()) || [...takenByThisRun.values()].includes(final)) {
    bump++;
    final = `${baseSlug}-${bump}.yaml`;
  }
  return final;
}

function buildOpenFence(fence: Fence, attrs: { fileName: string; titleQuoted: boolean; preserveTitle?: { value: string; quoted: boolean } }): string {
  const fenceMarker = fence.fenceChar.repeat(fence.fenceLen);
  const parts: string[] = [`${fence.indent}${fenceMarker}yaml`];
  // Emit unquoted — typical filenames don't contain whitespace or quotes,
  // so quotes are noise. The parser still accepts quoted forms if anyone
  // hand-writes them.
  parts.push(`file=${attrs.fileName}`);
  if (attrs.preserveTitle) {
    const v = attrs.preserveTitle.value;
    parts.push(attrs.preserveTitle.quoted ? `title="${v}"` : `title=${v}`);
  }
  return parts.join(" ");
}

interface ProcessResult {
  changed: boolean;
  inlineRemaining: number; // how many fences still have inline content (should be 0 after a run)
  yamlsWritten: { absPath: string; created: boolean; updated: boolean }[];
  newSource: string;
}

function processFile(absPath: string, opts: { dryRun: boolean }): ProcessResult {
  const original = fs.readFileSync(absPath, "utf8");
  // Preserve newline at EOF and avoid mangling line endings.
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const trailingNewline = original.endsWith(eol);
  const lines = original.split(/\r?\n/);
  if (trailingNewline) lines.pop(); // split leaves a trailing empty string

  const fences = findFences(lines);
  const headings = findHeadings(lines, fences);
  const dir = path.dirname(absPath);

  // Snapshot of files in dir for collision-avoidance (case-insensitive set).
  const dirEntries = fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);
  const takenInDir = new Set(dirEntries.map((n) => n.toLowerCase()));

  const replacements: { fence: Fence; openLine: string; closeLine: string }[] = [];
  const yamlsWritten: ProcessResult["yamlsWritten"] = [];

  const perHeadingCount = new Map<string, number>();
  const takenByThisRun = new Map<string, string>();
  let inlineRemaining = 0;
  let yamlFenceIndex = 0;

  for (const fence of fences) {
    const lang = fence.lang.toLowerCase();
    if (lang !== "yaml" && lang !== "yml") continue;

    const meta = parseMeta(fence.meta);

    // `inline` opts a small snippet out of extraction. Leave it verbatim and
    // don't let it consume the "first fence is config.yaml" slot.
    if (meta.inline && !meta.fileAttr && !meta.urlAttr) continue;

    const isFirstFence = yamlFenceIndex === 0;
    yamlFenceIndex++;

    // Already migrated: file= or url= attribute present AND empty body. Leave alone.
    if ((meta.fileAttr || meta.urlAttr) && fence.body.every((l) => l.trim() === "")) {
      if (meta.fileAttr) {
        // Track its filename so we don't reuse it for a sibling fence below.
        takenByThisRun.set(`${fence.startLine}`, sanitizeFilename(meta.fileAttr.value));
      }
      continue;
    }

    // Ambiguous: file= attribute present alongside inline content. Treat the
    // inline content as authoritative (sync to disk), keep the same filename.
    let fileName: string;
    if (meta.fileAttr) {
      fileName = sanitizeFilename(meta.fileAttr.value);
    } else {
      fileName = chooseFilename({
        fence,
        meta,
        headings,
        takenInDir,
        takenByThisRun,
        fenceKey: `${fence.startLine}`,
        perHeadingCount,
        isFirstFence,
      });
    }
    takenByThisRun.set(`${fence.startLine}`, fileName);
    takenInDir.add(fileName.toLowerCase());

    const yamlAbs = path.join(dir, fileName);
    const newContent = fence.body.join(eol) + eol; // ensure trailing newline
    let created = false;
    let updated = false;
    if (fs.existsSync(yamlAbs)) {
      const existing = fs.readFileSync(yamlAbs, "utf8");
      if (existing !== newContent) {
        if (!opts.dryRun) fs.writeFileSync(yamlAbs, newContent);
        updated = true;
      }
    } else {
      if (!opts.dryRun) fs.writeFileSync(yamlAbs, newContent);
      created = true;
    }
    yamlsWritten.push({ absPath: yamlAbs, created, updated });
    inlineRemaining++;

    const openLine = buildOpenFence(fence, {
      fileName,
      titleQuoted: meta.title?.quoted ?? true,
      preserveTitle: meta.title,
    });
    const closeLine = `${fence.indent}${fence.fenceChar.repeat(fence.fenceLen)}`;
    replacements.push({ fence, openLine, closeLine });
  }

  if (replacements.length === 0) {
    return {
      changed: false,
      inlineRemaining: 0,
      yamlsWritten,
      newSource: original,
    };
  }

  // Apply replacements bottom-up so earlier line indices stay valid.
  replacements.sort((a, b) => b.fence.startLine - a.fence.startLine);
  const newLines = lines.slice();
  for (const r of replacements) {
    newLines.splice(
      r.fence.startLine,
      r.fence.endLine - r.fence.startLine + 1,
      r.openLine,
      r.closeLine
    );
  }
  const joined = newLines.join(eol) + (trailingNewline ? eol : "");
  return {
    changed: joined !== original,
    inlineRemaining,
    yamlsWritten,
    newSource: joined,
  };
}

function walk(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      walk(p, out);
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) out.push(p);
    }
  }
}

function usage(): never {
  console.error(
    [
      "Usage:",
      "  extract-inline-yaml.ts <path>        Process one markdown file or directory.",
      "  extract-inline-yaml.ts --all         Process every markdown under src/docs/.",
      "  extract-inline-yaml.ts --check       Read-only check (exits non-zero if",
      "                                       any markdown still has inline yaml).",
      "Flags: --dry-run, --root=<path>",
    ].join("\n")
  );
  process.exit(2);
}

function main(): void {
  const argv = process.argv.slice(2);
  const flagSet = new Set(argv.filter((a) => a.startsWith("--")));
  const positional = argv.filter((a) => !a.startsWith("--"));
  const dryRun = flagSet.has("--dry-run");
  const checkOnly = flagSet.has("--check");
  const all = flagSet.has("--all");

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  let root = path.resolve(__dirname, "..", "src", "docs");
  for (const a of argv) {
    if (a.startsWith("--root=")) root = path.resolve(a.slice("--root=".length));
  }

  // Require an explicit target so a stray invocation can't bulk-rewrite the
  // whole tree.
  if (positional.length === 0 && !all && !checkOnly) usage();
  if (positional.length > 1) usage();

  if (!fs.existsSync(root)) {
    console.error(`Docs root not found: ${root}`);
    process.exit(1);
  }

  const files: string[] = [];
  if (positional.length === 1) {
    const target = path.resolve(positional[0]);
    if (!fs.existsSync(target)) {
      console.error(`Path not found: ${target}`);
      process.exit(1);
    }
    const stat = fs.statSync(target);
    if (stat.isDirectory()) walk(target, files);
    else if (
      stat.isFile() &&
      (target.endsWith(".md") || target.endsWith(".mdx"))
    ) {
      files.push(target);
    } else {
      console.error(`Not a markdown file or directory: ${target}`);
      process.exit(1);
    }
  } else {
    walk(root, files);
  }
  files.sort();

  let touched = 0;
  let yamlsCreated = 0;
  let yamlsUpdated = 0;
  let totalExtractions = 0;
  const wouldChange: string[] = [];

  for (const f of files) {
    const res = processFile(f, { dryRun: dryRun || checkOnly });
    totalExtractions += res.inlineRemaining;
    yamlsCreated += res.yamlsWritten.filter((y) => y.created).length;
    yamlsUpdated += res.yamlsWritten.filter((y) => y.updated).length;

    if (res.changed) {
      touched++;
      wouldChange.push(path.relative(process.cwd(), f));
      if (!dryRun && !checkOnly) {
        fs.writeFileSync(f, res.newSource);
      }
    }
  }

  if (checkOnly) {
    if (wouldChange.length > 0) {
      console.error(
        `Inline yaml still present in ${wouldChange.length} file(s):`
      );
      for (const f of wouldChange.slice(0, 20)) console.error(`  ${f}`);
      if (wouldChange.length > 20) console.error(`  …and ${wouldChange.length - 20} more`);
      console.error("Run: npx tsx scripts/extract-inline-yaml.ts");
      process.exit(1);
    }
    console.log("All yaml fences are externalised.");
    return;
  }

  console.log(
    `Scanned ${files.length} file(s); ${
      dryRun ? "would update" : "updated"
    } ${touched}; extracted ${totalExtractions} fence(s); yaml files ${
      dryRun ? "would be created" : "created"
    }: ${yamlsCreated}, updated: ${yamlsUpdated}.`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
