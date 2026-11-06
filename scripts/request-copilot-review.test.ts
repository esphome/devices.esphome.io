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
const copilotRequest = (actorType: string, createdAt: string) => ({
  event: "review_requested",
  actor: { login: actorType === "Bot" ? "esphome[bot]" : "someone", type: actorType },
  requested_reviewer: { login: "Copilot" },
  created_at: createdAt,
});
const copilotReview = (submittedAt: string) => ({
  event: "reviewed",
  user: { login: "Copilot" },
  submitted_at: submittedAt,
});

// `events` is the timeline read back after the request; a function lets a
// test build it at call time. `timelineError` makes that read throw.
function makeGithub(
  opts: { fail?: boolean; events?: () => unknown[]; timelineError?: boolean } = {}
) {
  const calls: Record<string, unknown>[] = [];
  const events = opts.events ?? (() => [copilotRequest("Bot", new Date().toISOString())]);
  const listEventsForTimeline = () => {};
  return {
    calls,
    github: {
      paginate: async (fn: unknown) => {
        assert.equal(fn, listEventsForTimeline);
        if (opts.timelineError) throw new Error("secondary rate limit");
        return events();
      },
      rest: {
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
  const { github } = makeGithub({ events: () => [{ event: "labeled" }] });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.match(warnings[0], /recorded none/);
});

test("a fresh ruleset request filed under a user does not confirm ours", async () => {
  const now = new Date().toISOString();
  const { github } = makeGithub({ events: () => [copilotRequest("User", now), copilotReview(now)] });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.match(warnings[0], /recorded none/);
});

test("an older bot request that was reviewed does not confirm this one", async () => {
  const { github } = makeGithub({ events: () => [copilotRequest("Bot", OLD), copilotReview(LATER)] });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.match(warnings[0], /recorded none/);
});

test("a Copilot review still pending is logged, not warned", async () => {
  const { github } = makeGithub({ events: () => [copilotReview(OLD), copilotRequest("User", LATER)] });
  const { core, infos, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.deepEqual(warnings, []);
  assert.match(infos[0], /requested by someone is still pending on #9/);
});

test("a failed timeline read warns instead of failing", async () => {
  const { github, calls } = makeGithub({ timelineError: true });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.equal(calls.length, 1);
  assert.match(warnings[0], /could not confirm it: secondary rate limit/);
});

test("the exported helper takes a PR number", async () => {
  const { github, calls } = makeGithub();
  const { core } = makeCore();
  await copilot.requestCopilotReview({ github, core, ...REPO, prNumber: 12 });
  assert.equal(calls[0].pull_number, 12);
});
