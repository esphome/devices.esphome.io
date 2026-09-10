/**
 * Wrap long lines in markdown files to comply with line length limits.
 *
 * Wraps lines that exceed a specified length (default 120 characters) while
 * preserving markdown formatting, lists, links, and code blocks.
 *
 * Links are never broken - if a link would be split, the entire link is moved
 * to a new line.
 *
 * Usage:
 *   tsx scripts/wrap-markdown-lines.ts <file1.md> [file2.md ...]
 *   tsx scripts/wrap-markdown-lines.ts --max-length 100 <file.md>
 *   tsx scripts/wrap-markdown-lines.ts --dry-run <file.md>
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

interface MarkdownLink {
  start: number;
  end: number;
  text: string;
}

/** Precompute, in one pass, whether each line sits inside a fenced code block. */
function computeInCodeBlock(lines: string[]): boolean[] {
  const inBlock: boolean[] = new Array(lines.length);
  let fenceCount = 0;
  for (let i = 0; i < lines.length; i++) {
    inBlock[i] = fenceCount % 2 === 1;
    if (lines[i].trim().startsWith("```")) {
      fenceCount++;
    }
  }
  return inBlock;
}

function isTableLine(line: string): boolean {
  const stripped = line.trim();
  const pipeCount = (stripped.match(/\|/g) ?? []).length;
  return stripped.includes("|") && (pipeCount > 1 || stripped.startsWith("|"));
}

function isHeading(line: string): boolean {
  return line.trim().startsWith("#");
}

const LIST_MARKER_RE = /^(\s*(?:[-*+]|\d+\.)\s+)/;

/** Get continuation indentation (spaces) for a list item, or null. */
function getListIndent(line: string): string | null {
  const match = line.match(LIST_MARKER_RE);
  if (match) {
    return " ".repeat(match[1].length);
  }
  return null;
}

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Find all `[text](url)` style markdown links and their positions. */
function findMarkdownLinks(text: string): MarkdownLink[] {
  const links: MarkdownLink[] = [];
  for (const match of text.matchAll(LINK_RE)) {
    const start = match.index ?? 0;
    links.push({
      start,
      end: start + match[0].length,
      text: match[0],
    });
  }
  return links;
}

/**
 * Find the best point to wrap text, preferring spaces. Never breaks inside a
 * markdown link - if a break would split a link, wrap before the link instead.
 * Returns the index to break at, or -1 if no good break point was found.
 */
function findWrapPoint(text: string, maxLen: number): number {
  if (text.length <= maxLen) {
    return -1;
  }

  const links = findMarkdownLinks(text);

  for (let i = maxLen; i > 0; i--) {
    if (text[i] === " ") {
      for (const { start, end } of links) {
        if (start < i && i < end) {
          // Breaking here would split a link; wrap before the link starts.
          for (let j = start - 1; j >= 0; j--) {
            if (text[j] === " ") {
              return j;
            }
          }
          // No space before the link, can't wrap nicely.
          return -1;
        }
      }

      // Don't break inside inline code (odd number of backticks before i).
      const backtickCount = (text.slice(0, i).match(/`/g) ?? []).length;
      if (backtickCount % 2 === 1) {
        continue;
      }

      return i;
    }
  }

  return -1;
}

const MAX_ITERATIONS = 1000;

/** Wrap a single line to maxLength, preserving markdown structure. */
function wrapLine(line: string, maxLength = 120): string[] {
  if (line.replace(/\s+$/, "").length <= maxLength) {
    return [line];
  }

  const listIndent = getListIndent(line);
  const text = line.replace(/\n$/, "");
  const wrappedLines: string[] = [];

  if (listIndent !== null) {
    let current = text;
    let iteration = 0;
    let appendedRemainder = true;
    while (current.length > maxLength && iteration < MAX_ITERATIONS) {
      iteration++;
      const prevLen = current.length;
      const wrapPoint = findWrapPoint(current, maxLength);
      if (wrapPoint <= 0) {
        wrappedLines.push(current);
        appendedRemainder = false;
        break;
      }

      wrappedLines.push(current.slice(0, wrapPoint));
      const remainder = current.slice(wrapPoint).replace(/^\s+/, "");
      current = remainder ? listIndent + remainder : "";

      if (current.length >= prevLen) {
        if (current) {
          wrappedLines.push(current);
        }
        appendedRemainder = false;
        break;
      }
    }
    if (appendedRemainder && current) {
      wrappedLines.push(current);
    }
  } else {
    let current = text;
    let iteration = 0;
    let appendedRemainder = true;
    while (current.length > maxLength && iteration < MAX_ITERATIONS) {
      iteration++;
      const prevLen = current.length;
      const wrapPoint = findWrapPoint(current, maxLength);
      if (wrapPoint <= 0) {
        wrappedLines.push(current);
        appendedRemainder = false;
        break;
      }

      wrappedLines.push(current.slice(0, wrapPoint));
      const remainder = current.slice(wrapPoint).replace(/^\s+/, "");
      current = remainder ? remainder : "";

      if (current && current.length >= prevLen) {
        wrappedLines.push(current);
        appendedRemainder = false;
        break;
      }
    }
    if (appendedRemainder && current) {
      wrappedLines.push(current);
    }
  }

  return wrappedLines.map((l) => l + "\n");
}

/** Split file content into lines, keeping trailing newlines (like readlines). */
function splitKeepingNewlines(content: string): string[] {
  const lines = content.match(/[^\n]*\n|[^\n]+$/g);
  return lines ?? [];
}

/** Process a markdown file to wrap long lines. Returns count of lines wrapped. */
async function processMarkdownFile(
  filepath: string,
  maxLength = 120,
  dryRun = false
): Promise<number> {
  const content = await readFile(filepath, "utf-8");
  const lines = splitKeepingNewlines(content);
  const inCodeBlock = computeInCodeBlock(lines);

  const newLines: string[] = [];
  let linesWrapped = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (inCodeBlock[i]) {
      newLines.push(line);
      continue;
    }
    if (isTableLine(line)) {
      newLines.push(line);
      continue;
    }
    if (isHeading(line)) {
      newLines.push(line);
      continue;
    }

    if (line.replace(/\s+$/, "").length > maxLength) {
      const wrapped = wrapLine(line, maxLength);
      newLines.push(...wrapped);
      if (wrapped.length > 1) {
        linesWrapped++;
      }
    } else {
      newLines.push(line);
    }
  }

  if (!dryRun && linesWrapped > 0) {
    await writeFile(filepath, newLines.join(""), "utf-8");
  }

  return linesWrapped;
}

/** Max files processed concurrently, to avoid exhausting file descriptors. */
const MAX_CONCURRENCY = 8;

/**
 * Map over items with bounded concurrency. Results are written by index, so the
 * returned array preserves input order regardless of completion order.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const files: string[] = [];
  let maxLength = 120;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--max-length") {
      const value = argv[++i];
      maxLength = parseInt(value, 10);
      if (Number.isNaN(maxLength)) {
        console.error(`Invalid --max-length value: ${value}`);
        process.exit(2);
      }
    } else if (arg.startsWith("--max-length=")) {
      maxLength = parseInt(arg.slice("--max-length=".length), 10);
      if (Number.isNaN(maxLength)) {
        console.error(`Invalid --max-length value: ${arg}`);
        process.exit(2);
      }
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      process.exit(2);
    } else {
      files.push(arg);
    }
  }

  if (files.length === 0) {
    console.error(
      "Usage: tsx scripts/wrap-markdown-lines.ts [--max-length N] [--dry-run] <file.md> [file2.md ...]"
    );
    process.exit(2);
  }

  const results = await mapWithConcurrency(
    files,
    MAX_CONCURRENCY,
    async (filepath) => {
      if (!existsSync(filepath)) {
        return { filepath, found: false, wrapped: 0 };
      }
      const wrapped = await processMarkdownFile(filepath, maxLength, dryRun);
      return { filepath, found: true, wrapped };
    }
  );

  let totalWrapped = 0;
  for (const { filepath, found, wrapped } of results) {
    if (!found) {
      console.error(`Warning: ${filepath} not found, skipping`);
      continue;
    }
    if (wrapped > 0) {
      const action = dryRun ? "Would wrap" : "Wrapped";
      console.log(`${action} ${wrapped} line(s) in ${filepath}`);
    }
    totalWrapped += wrapped;
  }

  if (totalWrapped > 0) {
    const action = dryRun ? "would be" : "were";
    console.log(`\nTotal: ${totalWrapped} line(s) ${action} wrapped`);
  } else {
    console.log("No lines needed wrapping");
  }
}

await main();
