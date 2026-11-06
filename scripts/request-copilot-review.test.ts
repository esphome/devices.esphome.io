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

function makeGithub(fail = false) {
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

function makeCore() {
  const warnings: string[] = [];
  return { warnings, core: { info: () => {}, warning: (m: string) => void warnings.push(m) } };
}

const readyContext = (type = "User") => ({
  repo: REPO,
  payload: { pull_request: { number: 9, user: { type } } },
});

test("marking a PR ready requests a Copilot review", async () => {
  const { github, calls } = makeGithub();
  const { core } = makeCore();
  await copilot({ github, context: readyContext(), core });
  assert.deepEqual(calls, [{ ...REPO, pull_number: 9, reviewers: ["copilot-pull-request-reviewer[bot]"] }]);
});

test("bot PRs are skipped", async () => {
  const { github, calls } = makeGithub();
  const { core } = makeCore();
  await copilot({ github, context: readyContext("Bot"), core });
  assert.deepEqual(calls, []);
});

test("a failed request warns instead of failing", async () => {
  const { github } = makeGithub(true);
  const { core, warnings } = makeCore();
  await copilot({ github, context: readyContext(), core });
  assert.match(warnings[0], /Could not request a Copilot review on #9/);
});
