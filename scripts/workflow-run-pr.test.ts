#!/usr/bin/env tsx
/**
 * Unit tests for .github/scripts/workflow-run-pr.cjs, which resolves the pull
 * request a workflow_run belongs to from the run itself. Run with `npm test`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { findRunPullRequest } = require("../.github/scripts/workflow-run-pr.cjs");

const RUN = {
  head_sha: "abc",
  head_branch: "add-device",
  head_repository: { full_name: "fork/devices", owner: { login: "fork" } },
};
const pr = (number: number, sha: string, repo: string) => ({
  number,
  head: { sha, repo: { full_name: repo } },
});

function call(pulls: unknown[], run: unknown = RUN) {
  const seen: Record<string, unknown>[] = [];
  const github = {
    paginate: async (_fn: unknown, args: Record<string, unknown>) => {
      seen.push(args);
      return pulls;
    },
    rest: { pulls: { list: () => undefined } },
  };
  const context = { repo: { owner: "esphome", repo: "devices" }, payload: { workflow_run: run } };
  return findRunPullRequest({ github, context }).then((r: unknown) => ({ r, seen }));
}

test("looks the PR up by the run's owner:branch", async () => {
  const { r, seen } = await call([pr(5, "abc", "fork/devices")]);
  assert.equal((r as { number: number }).number, 5);
  assert.equal(seen[0].head, "fork:add-device");
  assert.equal(seen[0].state, "open");
});

for (const [name, pulls] of [
  ["a PR whose head moved past the run's commit", [pr(5, "newer", "fork/devices")]],
  ["a same-named branch on another fork", [pr(5, "abc", "other/devices")]],
  ["no open PR", []],
] as const) {
  test(`resolves to null for ${name}`, async () => {
    assert.equal((await call([...pulls])).r, null);
  });
}

test("resolves to null when the run carries no head repository", async () => {
  assert.equal((await call([pr(5, "abc", "fork/devices")], { ...RUN, head_repository: null })).r, null);
});
