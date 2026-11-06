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

type Recorded = "now" | "stale" | "none";

// `recorded` controls the timeline read back after the request: a fresh
// Copilot review_requested event, an old one, or nothing.
function makeGithub(opts: { fail?: boolean; recorded?: Recorded } = {}) {
  const calls: Record<string, unknown>[] = [];
  const recorded = opts.recorded ?? "now";
  const createdAt = recorded === "stale" ? "2020-01-01T00:00:00Z" : new Date().toISOString();
  const listEventsForTimeline = () => {};
  return {
    calls,
    github: {
      paginate: async (fn: unknown) => {
        assert.equal(fn, listEventsForTimeline);
        if (recorded === "none") return [{ event: "labeled" }];
        return [
          { event: "review_requested", requested_reviewer: { login: "esphbot" }, created_at: createdAt },
          { event: "review_requested", requested_reviewer: { login: "Copilot" }, created_at: createdAt },
        ];
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
  const { github } = makeGithub({ recorded: "none" });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.match(warnings[0], /recorded none/);
});

test("only a Copilot request from this run counts as recorded", async () => {
  const { github } = makeGithub({ recorded: "stale" });
  const { core, warnings } = makeCore();
  await copilot({ github, context: prContext(), core });
  assert.match(warnings[0], /recorded none/);
});

test("the exported helper takes a PR number", async () => {
  const { github, calls } = makeGithub();
  const { core } = makeCore();
  await copilot.requestCopilotReview({ github, core, ...REPO, prNumber: 12 });
  assert.equal(calls[0].pull_number, 12);
});
