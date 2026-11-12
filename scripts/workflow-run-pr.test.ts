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
const pr = (number: number, sha: string, repo: string, base = "main", ref = "add-device") => ({
  number,
  head: { sha, ref, repo: { full_name: repo } },
  base: { ref: base },
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
  const context = {
    repo: { owner: "esphome", repo: "devices" },
    payload: { workflow_run: run, repository: { default_branch: "main" } },
  };
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

test("prefers the default-branch PR when one head is open against several bases", async () => {
  const { r } = await call([pr(5, "abc", "fork/devices", "next"), pr(6, "abc", "fork/devices")]);
  assert.equal((r as { number: number }).number, 6);
});

test("resolves to null when several PRs match and none targets the default branch", async () => {
  const { r } = await call([pr(5, "abc", "fork/devices", "a"), pr(6, "abc", "fork/devices", "b")]);
  assert.equal(r, null);
});

const REVIEW_RUN = {
  ...RUN,
  event: "pull_request_review",
  head_repository: { full_name: "esphome/devices", owner: { login: "esphome" } },
};

test("a review run resolves a fork PR without a head filter", async () => {
  const { r, seen } = await call([pr(5, "abc", "fork/devices")], REVIEW_RUN);
  assert.equal((r as { number: number }).number, 5);
  assert.equal("head" in seen[0], false);
});

for (const [name, pulls] of [
  ["a different head commit", [pr(5, "newer", "fork/devices")]],
  ["a different branch name", [pr(5, "abc", "fork/devices", "main", "other-branch")]],
  ["a PR with no head repository", [{ ...pr(5, "abc", "fork/devices"), head: { sha: "abc", ref: "add-device", repo: null } }]],
] as const) {
  test(`a review run resolves to null for ${name}`, async () => {
    assert.equal((await call([...pulls], REVIEW_RUN)).r, null);
  });
}

test("a review run prefers the default-branch PR when several match", async () => {
  const { r } = await call(
    [pr(5, "abc", "fork/devices", "next"), pr(6, "abc", "fork/devices")],
    REVIEW_RUN,
  );
  assert.equal((r as { number: number }).number, 6);
});

test("a non-review run keeps the head filter", async () => {
  const { seen } = await call([], { ...RUN, event: "pull_request" });
  assert.equal(seen[0].head, "fork:add-device");
});
