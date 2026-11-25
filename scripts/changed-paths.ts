/**
 * Changed paths between two commits, shared by the validators that scope
 * their checks to what a pull request touches.
 */
import { execFileSync } from "node:child_process";

export interface ChangedPath {
  status: string; // git status letter: A, C, D, M, R or T
  path: string; // new path for renames and copies
  oldPath?: string; // source path for renames and copies
}

/** Parse `git diff --name-status -z` output. */
export function parseNameStatus(out: string): ChangedPath[] {
  const tokens = out.split("\0");
  const changes: ChangedPath[] = [];
  let i = 0;
  while (i < tokens.length) {
    const status = tokens[i];
    if (!status) {
      i++;
      continue;
    }
    const code = status[0];
    if (code === "R" || code === "C") {
      changes.push({ status: code, oldPath: tokens[i + 1], path: tokens[i + 2] });
      i += 3;
    } else {
      changes.push({ status: code, path: tokens[i + 1] });
      i += 2;
    }
  }
  return changes;
}

/** Paths changed between *base* and *head* under *pathspec*, as git reports them. */
export function changedPaths(base: string, head: string, pathspec: string): ChangedPath[] {
  const out = execFileSync(
    "git",
    ["diff", "--name-status", "-z", `${base}..${head}`, "--", pathspec],
    { encoding: "utf8" }
  );
  return parseNameStatus(out);
}
