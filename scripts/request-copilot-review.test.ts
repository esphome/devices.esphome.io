#!/usr/bin/env tsx
/**
 * Unit tests for .github/scripts/request-copilot-review.cjs, the "Request
 * Copilot review" workflow handler, against a recording GitHub client mock.
 * Run with `npm test`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const copilot = require("../.github/scripts/request-copilot-review.cjs");

const REPO = { owner: "esphome", repo: "devices.esphome.io" };

const OLD = "2020-01-01T00:00:00Z";
const LATER = "2020-01-01T00:05:00Z";
// The account the workflow's token belongs to.
const REQUESTER = "esphome-review-bot";
// "ours" is a request filed by REQUESTER; anything else stands for the ruleset
// or a maintainer.
const copilotRequest = (id: number, by: "ours" | "other", createdAt = LATER) => ({
  id,
  event: "review_requested",
  actor: { login: by === "ours" ? REQUESTER : "someone", type: "User" },
  requested_reviewer: { login: "Copilot" },
  created_at: createdAt,
});
const copilotReview = (id: number, submittedAt: string) => ({
  id,
  event: "reviewed",
  user: { login: "Copilot" },
  submitted_at: submittedAt,
});

// `before` and `after` are the timeline reads around the request;
// `timelineError` makes that read throw.
function makeGithub(
  opts: {
    fail?: boolean;
    before?: unknown[];
    after?: unknown[];
    timelineError?: "before" | "after";
  } = {}
) {
  const calls: Record<string, unknown>[] = [];
  const reads = [
    { name: "before", events: opts.before ?? [] },
    { name: "after", events: opts.after ?? [copilotRequest(1, "ours")] },
  ];
  const listEventsForTimeline = () => {};
  return {
    calls,
    github: {
      paginate: async (fn: unknown) => {
        assert.equal(fn, listEventsForTimeline);
        const read = reads.shift();
        assert.ok(read, "the timeline is read at most twice");
        if (opts.timelineError === read.name) throw new Error("secondary rate limit");
        return read.events;
      },
      rest: {
        users: { getAuthenticated: async () => ({ data: { login: REQUESTER } }) },
        issues: { listEventsForTimeline },
        pulls: {
          requestReviewers: async (args: Record<string, unknown>) => {
            if (opts.fail) throw new Error("Reviews may only be requested from collaborators");
            calls.push(args);
          },
        },
      },
    },
  };
}

function makeCore() {
  const warnings: string[] = [];
  const infos: string[] = [];
  return {
    warnings,
    infos,
    core: { info: (m: string) => void infos.push(m), warning: (m: string) => void warnings.push(m) },
  };
}

const prContext = (type = "User") => ({
  repo: REPO,
  payload: { pull_request: { number: 9, user: { type } } },
});

test("a PR event requests a Copilot review", async () => {
  const { github, calls } = makeGithub();
  const { core, infos, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.deepEqual(calls, [{ ...REPO, pull_number: 9, reviewers: ["copilot-pull-request-reviewer[bot]"] }]);
  assert.deepEqual(warnings, []);
  assert.match(infos[0], /Requested a Copilot review on #9/);
});

test("bot PRs are skipped", async () => {
  const { github, calls } = makeGithub();
  const { core } = makeCore();
  await copilot({ github, context: prContext("Bot"), core });
  assert.deepEqual(calls, []);
});

test("a failed request warns instead of failing", async () => {
  const { github } = makeGithub({ fail: true });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.match(warnings[0], /Could not request a Copilot review on #9/);
});

test("an accepted request GitHub never recorded warns", async () => {
  const { github } = makeGithub({ after: [{ id: 1, event: "labeled" }] });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.match(warnings[0], /recorded none/);
});

test("a request filed by another account does not confirm ours", async () => {
  const after = [copilotRequest(1, "other"), copilotReview(2, LATER)];
  const { github } = makeGithub({ after });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.match(warnings[0], /recorded none/);
});

test("an earlier request by the same account does not confirm this one", async () => {
  const earlier = [copilotRequest(1, "ours", OLD), copilotReview(2, LATER)];
  const { github } = makeGithub({ before: earlier, after: earlier });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.match(warnings[0], /recorded none/);
});

test("a Copilot review still pending is logged, not warned", async () => {
  const earlier = [copilotReview(1, OLD), copilotRequest(2, "other")];
  const { github } = makeGithub({ before: earlier, after: earlier });
  const { core, infos, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.deepEqual(warnings, []);
  assert.match(infos[0], /requested by someone is still pending on #9/);
});

test("a Copilot request that was removed is not pending", async () => {
  const earlier = [
    copilotRequest(1, "other"),
    { id: 2, event: "review_request_removed", requested_reviewer: { login: "Copilot" }, created_at: LATER },
  ];
  const { github } = makeGithub({ before: earlier, after: earlier });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.match(warnings[0], /recorded none/);
});

test("a completed review under the bot account login ends the pending request", async () => {
  const earlier = [
    copilotRequest(1, "other", OLD),
    { id: 2, event: "reviewed", user: { login: "copilot-pull-request-reviewer[bot]" }, submitted_at: LATER },
  ];
  const { github } = makeGithub({ before: earlier, after: earlier });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.match(warnings[0], /recorded none/);
});

test("a failed timeline read after the request warns instead of failing", async () => {
  const { github, calls } = makeGithub({ timelineError: "after" });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.equal(calls.length, 1);
  assert.match(warnings[0], /could not confirm it: secondary rate limit/);
});

test("a failed baseline read still requests the review, unconfirmed", async () => {
  const { github, calls } = makeGithub({ timelineError: "before" });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.equal(calls.length, 1);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /goes unconfirmed: secondary rate limit/);
});

test("the exported helper takes a PR number", async () => {
  const { github, calls } = makeGithub();
  const { core } = makeCore();
  await copilot.requestCopilotReview({ github, core, ...REPO, prNumber: 12 });
  assert.equal(calls[0].pull_number, 12);
});

test("the list helper requests a review on each marked-ready PR", async () => {
  const calls: unknown[] = [];
  const github = {
    paginate: async () => [],
    rest: {
      issues: { listEventsForTimeline: () => {} },
      pulls: { requestReviewers: async (args: { pull_number: number }) => void calls.push(args.pull_number) },
    },
  };
  const { core } = makeCore();
  await copilot.requestCopilotReviews({ github, core, ...REPO, prNumbers: "8,10" });
  assert.deepEqual(calls, [8, 10]);
});
