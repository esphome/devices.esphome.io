#!/usr/bin/env tsx
/**
 * Unit tests for .github/scripts/merge-conflicts.cjs, the "Merge conflicts"
 * workflow handler, against a recording GitHub client mock. Run with
 * `npm test`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const conflicts = require("../.github/scripts/merge-conflicts.cjs");
const { LABEL, RETRY_DELAYS_MS, WRITE_PACING_MS } = conflicts as {
  LABEL: string;
  RETRY_DELAYS_MS: number[];
  WRITE_PACING_MS: number;
};

const REPO = { owner: "esphome", repo: "devices.esphome.io" };

type Mergeable = "MERGEABLE" | "CONFLICTING" | "UNKNOWN";
type Pr = ReturnType<typeof pr>;

// A GraphQL PullRequest node. `check` is the conclusion of an existing
// "Merge conflicts" run on `checkOid` (the head by default).
function pr(
  number: number,
  mergeable: Mergeable,
  opts: {
    labels?: string[];
    check?: "SUCCESS" | "FAILURE";
    checkOid?: string;
    state?: string;
    base?: string;
    head?: string;
  } = {},
) {
  const head = opts.head ?? `sha${number}`;
  return {
    number,
    state: opts.state ?? "OPEN",
    headRefOid: head,
    baseRefName: opts.base ?? "main",
    mergeable,
    labels: { nodes: (opts.labels ?? []).map((name) => ({ name })) },
    commits: {
      nodes: [
        {
          commit: {
            oid: opts.checkOid ?? head,
            checkSuites: {
              nodes: opts.check
                ? [{ checkRuns: { nodes: [{ databaseId: 100 + number, conclusion: opts.check }] } }]
                : [],
            },
          },
        },
      ],
    },
  };
}

// `reads` maps a PR number to its successive reads (the last one repeats);
// `pages` lists the PR numbers on each page of the open-PR listing.
// `readyAuthors` maps a PR number to its author type, making the promotion
// find a green, bot-drafted PR it marks ready; other PRs read as closed.
function makeGithub(
  reads: Record<number, Pr[]>,
  pages: number[][] = [],
  readyAuthors: Record<number, string> = {},
) {
  const queries: { query: string; vars: Record<string, unknown> }[] = [];
  const writes: unknown[][] = [];
  const next = (n: number) => (reads[n].length > 1 ? reads[n].shift()! : reads[n][0]);
  const listForRef = () => {};
  const listEvents = () => {};
  const github = {
    paginate: async (fn: unknown) =>
      fn === listForRef
        ? [{ name: "CI", app: { slug: "github-actions" }, status: "completed", conclusion: "success" }]
        : [{ event: "convert_to_draft", actor: { type: "Bot" } }],
    graphql: async (query: string, vars: Record<string, unknown>) => {
      if (query.includes("markPullRequestReadyForReview")) return {};
      queries.push({ query, vars });
      if (query.includes("pullRequests(")) {
        const index = vars.cursor === null ? 0 : Number(vars.cursor);
        return {
          repository: {
            pullRequests: {
              nodes: pages[index].map(next),
              pageInfo: { hasNextPage: index + 1 < pages.length, endCursor: String(index + 1) },
            },
          },
        };
      }
      const repository: Record<string, Pr> = {};
      for (const [, n] of query.matchAll(/pr(\d+): pullRequest/g)) repository[`pr${n}`] = next(Number(n));
      return { repository };
    },
    rest: {
      pulls: {
        get: async (a: { pull_number: number }) => {
          writes.push(["promote", a.pull_number]);
          const type = readyAuthors[a.pull_number];
          if (!type) return { data: { state: "closed" } };
          return {
            data: {
              state: "open",
              draft: true,
              node_id: `PR_${a.pull_number}`,
              head: { sha: `sha${a.pull_number}` },
              labels: [{ name: "made-for-esphome" }, { name: "made-for-esphome-pending" }],
              user: { type },
            },
          };
        },
      },
      issues: {
        listEvents,
        addLabels: async (a: { issue_number: number; labels: string[] }) =>
          void writes.push(["addLabels", a.issue_number, a.labels]),
        removeLabel: async (a: { issue_number: number; name: string }) =>
          void writes.push(["removeLabel", a.issue_number, a.name]),
      },
      checks: {
        listForRef,
        create: async (a: { head_sha: string; name: string; conclusion: string }) =>
          void writes.push(["checks.create", a.head_sha, a.name, a.conclusion]),
        update: async (a: { check_run_id: number; name: string; conclusion: string }) =>
          void writes.push(["checks.update", a.check_run_id, a.name, a.conclusion]),
      },
    },
  };
  return { github, queries, writes };
}

function makeCore() {
  const warnings: string[] = [];
  const outputs: Record<string, string> = {};
  return {
    warnings,
    outputs,
    core: {
      info: () => {},
      warning: (m: string) => void warnings.push(m),
      setOutput: (name: string, value: string) => void (outputs[name] = value),
    },
  };
}

const repository = { default_branch: "main" };
const prContext = (number: number, action = "synchronize") => ({
  eventName: "pull_request_target",
  repo: REPO,
  payload: { action, pull_request: { number }, repository },
});
const pushContext = { eventName: "push", ref: "refs/heads/main", repo: REPO, payload: { repository } };

function recordSleeps() {
  const slept: number[] = [];
  return { slept, sleep: async (ms: number) => void slept.push(ms) };
}

const prEventCases: { name: string; read: Pr; writes: unknown[][] }[] = [
  {
    name: "a new conflict gets the label and a failing head check",
    read: pr(7, "CONFLICTING"),
    writes: [
      ["addLabels", 7, [LABEL]],
      ["checks.create", "sha7", "Merge conflicts", "failure"],
    ],
  },
  {
    name: "a resolved conflict loses the label and gets a passing head check",
    read: pr(7, "MERGEABLE", { labels: [LABEL] }),
    writes: [
      ["removeLabel", 7, LABEL],
      ["checks.create", "sha7", "Merge conflicts", "success"],
    ],
  },
  {
    name: "a conflict already labelled and failed is left alone",
    read: pr(7, "CONFLICTING", { labels: [LABEL], check: "FAILURE" }),
    writes: [],
  },
  {
    name: "a clean PR already passing is left alone",
    read: pr(7, "MERGEABLE", { check: "SUCCESS" }),
    writes: [],
  },
  {
    name: "a stale failing check is updated in place",
    read: pr(7, "MERGEABLE", { check: "FAILURE" }),
    writes: [["checks.update", 107, "Merge conflicts", "success"]],
  },
  {
    name: "a check on an older commit is not reused",
    read: pr(7, "CONFLICTING", { labels: [LABEL], check: "FAILURE", checkOid: "old" }),
    writes: [["checks.create", "sha7", "Merge conflicts", "failure"]],
  },
];

for (const { name, read, writes: expected } of prEventCases) {
  test(`PR event: ${name}`, async () => {
    const { github, writes } = makeGithub({ 7: [read] });
    const { core } = makeCore();
    await conflicts({ github, context: prContext(7), core, sleep: async () => {} });
    assert.deepEqual(writes, expected);
  });
}

test("a pending mergeability is re-read until it settles", async () => {
  const { github, writes, queries } = makeGithub({ 7: [pr(7, "UNKNOWN"), pr(7, "CONFLICTING")] });
  const { core } = makeCore();
  const { slept, sleep } = recordSleeps();
  await conflicts({ github, context: prContext(7), core, sleep });
  assert.deepEqual(slept, [RETRY_DELAYS_MS[0], WRITE_PACING_MS]);
  // The initial read, the retry, and the re-read just before writing.
  assert.equal(queries.length, 3);
  assert.deepEqual(writes.map((w) => w[0]), ["addLabels", "checks.create"]);
});

test("a mergeability that never settles changes nothing", async () => {
  const { github, writes } = makeGithub({ 7: [pr(7, "UNKNOWN", { labels: [LABEL] })] });
  const { core, warnings } = makeCore();
  const { slept, sleep } = recordSleeps();
  await conflicts({ github, context: prContext(7), core, sleep });
  assert.deepEqual(slept, RETRY_DELAYS_MS);
  assert.deepEqual(writes, []);
  assert.match(warnings[0], /#7: mergeability still unknown/);
});

test("a label already removed elsewhere (404) is not an error", async () => {
  const { github, writes } = makeGithub({ 7: [pr(7, "MERGEABLE", { labels: [LABEL] })] });
  github.rest.issues.removeLabel = async () => {
    throw Object.assign(new Error("Label does not exist"), { status: 404 });
  };
  const { core } = makeCore();
  await conflicts({ github, context: prContext(7), core, sleep: async () => {} });
  assert.deepEqual(writes, [["checks.create", "sha7", "Merge conflicts", "success"]]);
});

test("a push sweep writes only what changed, pacing each write", async () => {
  const { github, writes, queries } = makeGithub(
    {
      1: [pr(1, "CONFLICTING")],
      2: [pr(2, "MERGEABLE", { labels: [LABEL], check: "FAILURE" })],
      3: [pr(3, "MERGEABLE", { check: "SUCCESS" })],
    },
    [[1, 2, 3]],
  );
  const { core } = makeCore();
  const { slept, sleep } = recordSleeps();
  await conflicts({ github, context: pushContext, core, sleep });
  assert.equal(queries[0].vars.base, "main");
  assert.deepEqual(writes, [
    ["addLabels", 1, [LABEL]],
    ["checks.create", "sha1", "Merge conflicts", "failure"],
    ["removeLabel", 2, LABEL],
    ["checks.update", 102, "Merge conflicts", "success"],
  ]);
  // Every write after the first is paced.
  assert.deepEqual(slept, [WRITE_PACING_MS, WRITE_PACING_MS, WRITE_PACING_MS]);
});

test("a push sweep follows every page of open PRs", async () => {
  const { github, queries } = makeGithub(
    { 1: [pr(1, "MERGEABLE", { check: "SUCCESS" })], 2: [pr(2, "MERGEABLE", { check: "SUCCESS" })] },
    [[1], [2]],
  );
  const { core } = makeCore();
  await conflicts({ github, context: pushContext, core, sleep: async () => {} });
  assert.deepEqual(queries.map((q) => q.vars.cursor), [null, "1"]);
});

test("a push sweep re-reads only the unknown PRs", async () => {
  const { github, queries } = makeGithub(
    {
      1: [pr(1, "MERGEABLE", { check: "SUCCESS" })],
      2: [pr(2, "UNKNOWN"), pr(2, "MERGEABLE", { check: "SUCCESS" })],
    },
    [[1, 2]],
  );
  const { core } = makeCore();
  await conflicts({ github, context: pushContext, core, sleep: async () => {} });
  assert.equal(queries.length, 2);
  assert.match(queries[1].query, /pr2: pullRequest\(number: 2\)/);
  assert.doesNotMatch(queries[1].query, /pr1:/);
});

test("a push sweep syncs labels from the fresh read, not the listing", async () => {
  // The listing is stale: another run changed both labels while the sweep waited.
  const { github, writes } = makeGithub(
    {
      4: [pr(4, "UNKNOWN"), pr(4, "MERGEABLE", { labels: [LABEL], check: "SUCCESS" })],
      5: [pr(5, "UNKNOWN", { labels: [LABEL] }), pr(5, "CONFLICTING", { check: "FAILURE" })],
    },
    [[4, 5]],
  );
  const { core } = makeCore();
  await conflicts({ github, context: pushContext, core, sleep: async () => {} });
  assert.deepEqual(writes, [
    ["removeLabel", 4, LABEL],
    ["addLabels", 5, [LABEL]],
  ]);
});

test("a PR closed while the sweep waited is skipped", async () => {
  const { github, writes, queries } = makeGithub(
    { 6: [pr(6, "UNKNOWN"), pr(6, "CONFLICTING", { state: "MERGED" })] },
    [[6]],
  );
  const { core, warnings } = makeCore();
  await conflicts({ github, context: pushContext, core, sleep: async () => {} });
  assert.equal(queries.length, 2);
  assert.deepEqual(writes, []);
  assert.deepEqual(warnings, []);
});

test("a changed check re-runs the promotion on made-for-esphome PRs only", async () => {
  const { github, writes } = makeGithub(
    {
      8: [pr(8, "CONFLICTING", { labels: [LABEL, "made-for-esphome"], check: "SUCCESS" })],
      9: [pr(9, "CONFLICTING", { labels: [LABEL], check: "SUCCESS" })],
      10: [pr(10, "CONFLICTING", { labels: [LABEL, "made-for-esphome"], check: "FAILURE" })],
    },
    [[8, 9, 10]],
  );
  const { core } = makeCore();
  await conflicts({ github, context: pushContext, core, sleep: async () => {} });
  assert.deepEqual(writes, [
    ["checks.update", 108, "Merge conflicts", "failure"],
    ["promote", 8],
    ["checks.update", 109, "Merge conflicts", "failure"],
  ]);
});

test("a write is decided on a re-read, so another run's sync isn't undone", async () => {
  // Between the read and the write another run labelled and failed the PR.
  const { github, writes } = makeGithub({
    7: [pr(7, "CONFLICTING"), pr(7, "CONFLICTING", { labels: [LABEL], check: "FAILURE" })],
  });
  const { core } = makeCore();
  await conflicts({ github, context: prContext(7), core, sleep: async () => {} });
  assert.deepEqual(writes, []);
});

test("a PR whose head moved during the sync is left to the next run", async () => {
  const { github, writes } = makeGithub({
    7: [pr(7, "CONFLICTING"), pr(7, "CONFLICTING", { head: "newsha" })],
  });
  const { core } = makeCore();
  await conflicts({ github, context: prContext(7), core, sleep: async () => {} });
  assert.deepEqual(writes, []);
});

test("a PR into another base gets the label but no head check", async () => {
  const { github, writes } = makeGithub({ 7: [pr(7, "CONFLICTING", { base: "dev" })] });
  const { core } = makeCore();
  await conflicts({ github, context: prContext(7), core, sleep: async () => {} });
  assert.deepEqual(writes, [["addLabels", 7, [LABEL]]]);
});

test("a clean new head leaves the promotion to CI; conflicts and base changes re-run it", async () => {
  for (const [action, mergeable, promoted] of [
    ["synchronize", "MERGEABLE", false],
    ["synchronize", "CONFLICTING", true],
    ["reopened", "CONFLICTING", true],
    ["edited", "MERGEABLE", true],
  ] as const) {
    const check = mergeable === "CONFLICTING" ? "SUCCESS" : "FAILURE";
    const read = () => pr(8, mergeable, { labels: ["made-for-esphome"], check });
    const { github, writes } = makeGithub({ 8: [read()] });
    const { core } = makeCore();
    await conflicts({ github, context: prContext(8, action), core, sleep: async () => {} });
    assert.equal(writes.some((w) => w[0] === "promote"), promoted, `${action} ${mergeable}`);
  }
});

test("PRs a sweep marks ready are handed to the Copilot review step, bots aside", async () => {
  const read = (n: number) => [pr(n, "CONFLICTING", { labels: [LABEL, "made-for-esphome"], check: "SUCCESS" })];
  const { github } = makeGithub({ 8: read(8), 9: read(9), 10: read(10) }, [[8, 9, 10]], {
    8: "User",
    9: "Bot",
    10: "User",
  });
  const { core, outputs } = makeCore();
  await conflicts({ github, context: pushContext, core, sleep: async () => {} });
  assert.deepEqual(outputs, { "marked-ready": "8,10" });
});

test("a sweep that marks nothing ready sets no output", async () => {
  const { github } = makeGithub({
    8: [pr(8, "CONFLICTING", { labels: [LABEL, "made-for-esphome"], check: "SUCCESS" })],
  }, [[8]]);
  const { core, outputs } = makeCore();
  await conflicts({ github, context: pushContext, core, sleep: async () => {} });
  assert.deepEqual(outputs, {});
});
