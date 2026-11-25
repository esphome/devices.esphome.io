#!/usr/bin/env tsx
/**
 * Unit tests for .github/scripts/maintainer-approval.cjs, the date-published
 * approval gate. Run with `npm test`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { maintainerApproves } = require("../.github/scripts/maintainer-approval.cjs");

const review = (login: string, state: string, at: string, sha = "head", assoc = "MEMBER") => ({
  user: { login },
  state,
  submitted_at: `2026-11-05T${at}:00Z`,
  commit_id: sha,
  author_association: assoc,
});

const cases: [string, unknown[], boolean][] = [
  ["a maintainer approves the head", [review("m", "APPROVED", "10:00")], true],
  ["the approval is of an older commit", [review("m", "APPROVED", "10:00", "old")], false],
  ["a non-maintainer approves", [review("x", "APPROVED", "10:00", "head", "CONTRIBUTOR")], false],
  [
    "the same maintainer later requests changes",
    [review("m", "APPROVED", "10:00"), review("m", "CHANGES_REQUESTED", "10:05")],
    false,
  ],
  [
    "a later comment-only review doesn't supersede the approval",
    [review("m", "APPROVED", "10:00"), review("m", "COMMENTED", "10:05")],
    true,
  ],
  [
    "the approval is dismissed",
    [review("m", "APPROVED", "10:00"), review("m", "DISMISSED", "10:05")],
    false,
  ],
  [
    "one maintainer still approves after another requests changes",
    [review("a", "APPROVED", "10:00"), review("b", "CHANGES_REQUESTED", "10:05")],
    true,
  ],
];

for (const [name, reviews, expected] of cases) {
  test(`${expected ? "passes" : "blocks"} when ${name}`, () => {
    assert.equal(maintainerApproves(reviews, "head"), expected);
  });
}
