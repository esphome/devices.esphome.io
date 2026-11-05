#!/usr/bin/env tsx
/**
 * Unit tests for the github-script handlers used by the "Merge conflicts" and
 * "Request Copilot review" workflows:
 *   .github/scripts/merge-conflicts.cjs
 *   .github/scripts/request-copilot-review.cjs
 *
 * Exercised with a recording GitHub client mock - no network. Run with
 * `npm test`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const conflicts = require("../.github/scripts/merge-conflicts.cjs");
const copilot = require("../.github/scripts/request-copilot-review.cjs");
const { classify, LABEL } = conflicts as {
  classify: (pull: { mergeable: boolean | null; mergeable_state?: string }) => string;
  LABEL: string;
};

type Pull = {
  number: number;
  mergeable: boolean | null;
  mergeable_state?: string;
  labels: { name: string }[];
  base: { ref: string };
};

function makeCore() {
  const out = { info: [] as string[], warning: [] as string[], failed: [] as string[] };
  return {
    out,
    core: {
      info: (m: string) => out.info.push(m),
      warning: (m: string) => out.warning.push(m),
      setFailed: (m: string) => out.failed.push(m),
    },
  };
}

// `reads` maps a PR number to the successive `pulls.get` results.
function makeGithub(reads: Record<number, Pull[]>, open: Pull[] = []) {
  const calls: { method: string; args: Record<string, unknown> }[] = [];
  const github = {
    paginate: async (_fn: unknown, args: Record<string, unknown>) => {
      calls.push({ method: "pulls.list", args });
      return open;
    },
    rest: {
      pulls: {
        list: () => undefined,
        get: async ({ pull_number }: { pull_number: number }) => {
          const queue = reads[pull_number];
          return { data: queue.length > 1 ? queue.shift()! : queue[0] };
        },
      },
      issues: {
        addLabels: async (args: Record<string, unknown>) => {
          calls.push({ method: "addLabels", args });
        },
        removeLabel: async (args: Record<string, unknown>) => {
          calls.push({ method: "removeLabel", args });
        },
      },
    },
  };
  return { github, calls };
}

const pr = (number: number, over: Partial<Pull> = {}): Pull => ({
  number,
  mergeable: true,
  mergeable_state: "clean",
  labels: [],
  base: { ref: "main" },
  ...over,
});
const prContext = (number: number) => ({
  eventName: "pull_request_target",
  repo: { owner: "esphome", repo: "devices.esphome.io" },
  payload: { pull_request: { number } },
});
const noSleep = async () => {};

test("classify maps mergeability to a state", () => {
  assert.equal(classify({ mergeable: true, mergeable_state: "clean" }), "clean");
  assert.equal(classify({ mergeable: true, mergeable_state: "blocked" }), "clean");
  assert.equal(classify({ mergeable: false, mergeable_state: "dirty" }), "conflict");
  assert.equal(classify({ mergeable: null }), "unknown");
  assert.equal(classify({ mergeable: false, mergeable_state: "unknown" }), "unknown");
});

test("a conflicting PR gets the label and a failed check", async () => {
  const { github, calls } = makeGithub({ 7: [pr(7, { mergeable: false, mergeable_state: "dirty" })] });
  const { core, out } = makeCore();
  await conflicts({ github, context: prContext(7), core, sleep: noSleep });
  assert.deepEqual(
    calls.filter((c) => c.method === "addLabels").map((c) => c.args.labels),
    [[LABEL]],
  );
  assert.equal(out.failed.length, 1);
  assert.match(out.failed[0], /merge conflicts with main/);
});

test("a clean PR loses a stale label and passes", async () => {
  const { github, calls } = makeGithub({ 7: [pr(7, { labels: [{ name: LABEL }] })] });
  const { core, out } = makeCore();
  await conflicts({ github, context: prContext(7), core, sleep: noSleep });
  assert.deepEqual(calls.map((c) => c.method), ["removeLabel"]);
  assert.deepEqual(out.failed, []);
});

test("a pending mergeability is retried until it settles", async () => {
  const { github, calls } = makeGithub({
    7: [pr(7, { mergeable: null }), pr(7, { mergeable: false, mergeable_state: "dirty" })],
  });
  const { core, out } = makeCore();
  let slept = 0;
  await conflicts({ github, context: prContext(7), core, sleep: async () => void slept++ });
  assert.equal(slept, 1);
  assert.deepEqual(calls.map((c) => c.method), ["addLabels"]);
  assert.equal(out.failed.length, 1);
});

test("a mergeability that never settles changes nothing", async () => {
  const { github, calls } = makeGithub({ 7: [pr(7, { mergeable: null, labels: [{ name: LABEL }] })] });
  const { core, out } = makeCore();
  await conflicts({ github, context: prContext(7), core, sleep: noSleep });
  assert.deepEqual(calls, []);
  assert.deepEqual(out.failed, []);
  assert.equal(out.warning.length, 1);
});

test("a push to main relabels every open PR without failing", async () => {
  const open = [pr(1), pr(2, { labels: [{ name: LABEL }] }), pr(3)];
  const { github, calls } = makeGithub(
    {
      1: [pr(1, { mergeable: false, mergeable_state: "dirty" })],
      2: [pr(2, { labels: [{ name: LABEL }] })],
      3: [pr(3)],
    },
    open,
  );
  const { core, out } = makeCore();
  const context = { eventName: "push", ref: "refs/heads/main", repo: prContext(0).repo, payload: {} };
  await conflicts({ github, context, core, sleep: noSleep });
  assert.equal(calls[0].args.base, "main");
  assert.deepEqual(
    calls.slice(1).map((c) => [c.method, c.args.issue_number]),
    [
      ["addLabels", 1],
      ["removeLabel", 2],
    ],
  );
  assert.deepEqual(out.failed, []);
});

function makeReviewGithub(fail = false) {
  const calls: Record<string, unknown>[] = [];
  return {
    calls,
    github: {
      rest: {
        pulls: {
          requestReviewers: async (args: Record<string, unknown>) => {
            if (fail) throw new Error("Reviews may only be requested from collaborators");
            calls.push(args);
          },
        },
      },
    },
  };
}
const readyContext = (type = "User") => ({
  repo: { owner: "esphome", repo: "devices.esphome.io" },
  payload: { pull_request: { number: 9, user: { type } } },
});

test("marking a PR ready requests a Copilot review", async () => {
  const { github, calls } = makeReviewGithub();
  const { core } = makeCore();
  await copilot({ github, context: readyContext(), core });
  assert.deepEqual(calls, [
    { owner: "esphome", repo: "devices.esphome.io", pull_number: 9, reviewers: [copilot.COPILOT_REVIEWER] },
  ]);
});

test("bot PRs are skipped", async () => {
  const { github, calls } = makeReviewGithub();
  const { core } = makeCore();
  await copilot({ github, context: readyContext("Bot"), core });
  assert.deepEqual(calls, []);
});

test("a failed request warns instead of failing", async () => {
  const { github } = makeReviewGithub(true);
  const { core, out } = makeCore();
  await copilot({ github, context: readyContext(), core });
  assert.equal(out.failed.length, 0);
  assert.match(out.warning[0], /Could not request a Copilot review on #9/);
});
