#!/usr/bin/env tsx
/**
 * Unit tests for the extracted github-script handlers used by the Made for
 * ESPHome review workflows:
 *   .github/scripts/mfe-review-feedback.cjs  (supersede-and-repost / dismiss)
 *   .github/scripts/mfe-review-command.cjs   (`@esphome[bot] review` command)
 *
 * They are exercised with a recording GitHub client mock — no network. Run
 * with `npm test`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const feedbackScript = require("../.github/scripts/mfe-review-feedback.cjs");
const commandScript = require("../.github/scripts/mfe-review-command.cjs");

type Call = { method: string; args: unknown };

// A GitHub client mock that records every rest call. `reviews` seeds
// paginate(listReviews); `runs` seeds listWorkflowRuns; `head` seeds pulls.get.
function makeGithub(opts: {
  reviews?: unknown[];
  runs?: unknown[];
  headSha?: string;
  reactionError?: boolean;
  permission?: string; // effective repo permission of the commenter
  permissionError?: boolean; // getCollaboratorPermissionLevel throws
} = {}) {
  const calls: Call[] = [];
  const record =
    (method: string) =>
    async (args: unknown) => {
      calls.push({ method, args });
      return { data: {} };
    };
  const github = {
    paginate: async () => opts.reviews ?? [],
    rest: {
      repos: {
        getCollaboratorPermissionLevel: async (args: unknown) => {
          calls.push({ method: "getCollaboratorPermissionLevel", args });
          if (opts.permissionError) throw new Error("403 forbidden");
          return { data: { permission: opts.permission ?? "none" } };
        },
      },
      pulls: {
        listReviews: () => {},
        createReview: record("createReview"),
        updateReview: record("updateReview"),
        dismissReview: record("dismissReview"),
        get: async (args: unknown) => {
          calls.push({ method: "pulls.get", args });
          return { data: { head: { sha: opts.headSha ?? "sha1" } } };
        },
      },
      actions: {
        listWorkflowRuns: async (args: unknown) => {
          calls.push({ method: "listWorkflowRuns", args });
          return { data: { workflow_runs: opts.runs ?? [] } };
        },
        reRunWorkflow: record("reRunWorkflow"),
      },
      reactions: {
        createForIssueComment: async (args: unknown) => {
          calls.push({ method: "reaction", args });
          if (opts.reactionError) throw new Error("no permission");
          return { data: {} };
        },
      },
      issues: {
        createComment: record("createComment"),
      },
    },
  };
  return { github, calls };
}

function freshCore() {
  return {
    info: () => {},
    setFailed(m: string) {
      (this._failed as string[]).push(m);
    },
    _failed: [] as string[],
  };
}

const context = { repo: { owner: "esphome", repo: "esphome-devices" } };

// --- feedback script -------------------------------------------------------

function withArtifact(prNumber: string, report: string | null): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-art-"));
  fs.writeFileSync(path.join(dir, "pr-number.txt"), prNumber + "\n");
  if (report !== null) fs.writeFileSync(path.join(dir, "mfe-review-report.md"), report);
  process.env.MFE_ARTIFACT_DIR = dir;
  return dir;
}

const MARKER = "<!-- made-for-esphome-review -->";
const SUPERSEDED = "<!-- mfe-superseded -->";

test("feedback: report + no existing review -> creates a REQUEST_CHANGES review", async () => {
  withArtifact("42", "## report body");
  const { github, calls } = makeGithub({ reviews: [] });
  await feedbackScript({ github, context, core: freshCore() });
  const created = calls.filter((c) => c.method === "createReview");
  assert.equal(created.length, 1);
  const args = created[0].args as { event: string; body: string; pull_number: number };
  assert.equal(args.event, "REQUEST_CHANGES");
  assert.equal(args.pull_number, 42);
  assert.ok(args.body.startsWith(MARKER));
  assert.ok(args.body.includes("## report body"));
});

test("feedback: identical existing review -> no-op", async () => {
  withArtifact("42", "## report body");
  const body = `${MARKER}\n## report body`;
  const { github, calls } = makeGithub({
    reviews: [{ id: 1, state: "CHANGES_REQUESTED", body }],
  });
  await feedbackScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "createReview").length, 0);
  assert.equal(calls.filter((c) => c.method === "updateReview").length, 0);
  assert.equal(calls.filter((c) => c.method === "dismissReview").length, 0);
});

test("feedback: changed report -> supersedes old and posts new", async () => {
  withArtifact("7", "## new body");
  const { github, calls } = makeGithub({
    reviews: [
      { id: 9, state: "CHANGES_REQUESTED", body: `${MARKER}\n## old body` },
    ],
  });
  await feedbackScript({ github, context, core: freshCore() });
  const updated = calls.filter((c) => c.method === "updateReview");
  const dismissed = calls.filter((c) => c.method === "dismissReview");
  const created = calls.filter((c) => c.method === "createReview");
  assert.equal(updated.length, 1);
  assert.ok((updated[0].args as { body: string }).body.includes(SUPERSEDED));
  assert.equal(dismissed.length, 1);
  assert.equal(created.length, 1);
  assert.ok((created[0].args as { body: string }).body.includes("## new body"));
});

test("feedback: superseded/other-bot reviews are ignored", async () => {
  withArtifact("7", "## body");
  const { github, calls } = makeGithub({
    reviews: [
      { id: 1, state: "CHANGES_REQUESTED", body: `${MARKER}\n${SUPERSEDED}\nstub` },
      { id: 2, state: "CHANGES_REQUESTED", body: "<!-- device-config-validation -->\nother" },
      { id: 3, state: "APPROVED", body: `${MARKER}\napproved elsewhere` },
    ],
  });
  await feedbackScript({ github, context, core: freshCore() });
  // None of the above are "active" -> treated as first post (create only).
  assert.equal(calls.filter((c) => c.method === "updateReview").length, 0);
  assert.equal(calls.filter((c) => c.method === "dismissReview").length, 0);
  assert.equal(calls.filter((c) => c.method === "createReview").length, 1);
});

test("feedback: no report + active review -> dismiss", async () => {
  withArtifact("7", null);
  const { github, calls } = makeGithub({
    reviews: [{ id: 5, state: "CHANGES_REQUESTED", body: `${MARKER}\nx` }],
  });
  await feedbackScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "dismissReview").length, 1);
  assert.equal(calls.filter((c) => c.method === "createReview").length, 0);
});

test("feedback: no report + no active review -> nothing", async () => {
  withArtifact("7", null);
  const { github, calls } = makeGithub({ reviews: [] });
  await feedbackScript({ github, context, core: freshCore() });
  assert.equal(calls.length, 0);
});

test("feedback: unreadable PR number -> setFailed", async () => {
  withArtifact("not-a-number", "## body");
  const { github, calls } = makeGithub({ reviews: [] });
  const c = freshCore();
  await feedbackScript({ github, context, core: c });
  assert.equal(c._failed.length, 1);
  assert.equal(calls.length, 0);
});

// --- command script --------------------------------------------------------

function commandContext(opts: {
  body: string;
  commenter?: string;
  author?: string;
}) {
  return {
    repo: { owner: "esphome", repo: "esphome-devices" },
    payload: {
      comment: {
        id: 100,
        body: opts.body,
        user: { login: opts.commenter ?? "someone" },
      },
      issue: {
        number: 55,
        user: { login: opts.author ?? "author" },
        pull_request: {},
      },
    },
  };
}

test("command: non-command comment is ignored", async () => {
  const { github, calls } = makeGithub();
  await commandScript({
    github,
    context: commandContext({ body: "just a normal comment" }),
    core: freshCore(),
  });
  assert.equal(calls.length, 0);
});

test("command: commenter without repo write is ignored", async () => {
  const { github, calls } = makeGithub({ permission: "read" });
  await commandScript({
    github,
    context: commandContext({
      body: "@esphome[bot] review",
      commenter: "stranger",
      author: "author",
    }),
    core: freshCore(),
  });
  // It checked the permission but did nothing else.
  assert.deepEqual(
    calls.map((c) => c.method),
    ["getCollaboratorPermissionLevel"]
  );
});

test("command: PR author triggers rerun without a permission check", async () => {
  const { github, calls } = makeGithub({
    headSha: "abc",
    runs: [
      { id: 1, status: "completed", created_at: "2026-01-01T00:00:00Z" },
      { id: 2, status: "completed", created_at: "2026-02-01T00:00:00Z" },
    ],
  });
  await commandScript({
    github,
    context: commandContext({
      body: "please @esphome review",
      commenter: "author",
      author: "author",
    }),
    core: freshCore(),
  });
  // Author fast-path: no permission lookup needed.
  assert.equal(
    calls.filter((c) => c.method === "getCollaboratorPermissionLevel").length,
    0
  );
  const rerun = calls.filter((c) => c.method === "reRunWorkflow");
  assert.equal(rerun.length, 1);
  assert.equal((rerun[0].args as { run_id: number }).run_id, 2); // newest by created_at
  assert.ok(
    calls.some((c) => c.method === "reaction" && (c.args as { content: string }).content === "rocket")
  );
});

test("command: write access authorises a non-author; in-progress run not re-run", async () => {
  const { github, calls } = makeGithub({
    permission: "write",
    runs: [{ id: 3, status: "in_progress", created_at: "2026-02-01T00:00:00Z" }],
  });
  await commandScript({
    github,
    context: commandContext({
      body: "@esphome[bot] review",
      commenter: "maintainer",
      author: "author",
    }),
    core: freshCore(),
  });
  assert.equal(
    calls.filter((c) => c.method === "getCollaboratorPermissionLevel").length,
    1
  );
  assert.equal(calls.filter((c) => c.method === "reRunWorkflow").length, 0);
  assert.ok(
    calls.some((c) => c.method === "reaction" && (c.args as { content: string }).content === "eyes")
  );
});

test("command: admin access authorises; no run found -> confused + comment", async () => {
  const { github, calls } = makeGithub({ permission: "admin", runs: [] });
  await commandScript({
    github,
    context: commandContext({
      body: "@esphome[bot] review",
      commenter: "maintainer",
      author: "author",
    }),
    core: freshCore(),
  });
  assert.equal(calls.filter((c) => c.method === "reRunWorkflow").length, 0);
  assert.equal(calls.filter((c) => c.method === "createComment").length, 1);
  assert.ok(
    calls.some((c) => c.method === "reaction" && (c.args as { content: string }).content === "confused")
  );
});

test("command: a permission lookup failure denies (fail-closed)", async () => {
  const { github, calls } = makeGithub({ permissionError: true });
  await commandScript({
    github,
    context: commandContext({
      body: "@esphome[bot] review",
      commenter: "maintainer",
      author: "author",
    }),
    core: freshCore(),
  });
  assert.equal(calls.filter((c) => c.method === "reRunWorkflow").length, 0);
});
