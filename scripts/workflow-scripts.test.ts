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
  permission?: string; // legacy `permission` field
  roleName?: string; // granular `role_name` field
  permissionError?: boolean; // getCollaboratorPermissionLevel throws
  comments?: unknown[]; // issue comments for paginate(listComments)
} = {}) {
  const calls: Call[] = [];
  const record =
    (method: string) =>
    async (args: unknown) => {
      calls.push({ method, args });
      return { data: {} };
    };
  // Tag the list functions so paginate can dispatch reviews vs comments.
  const listReviews = Object.assign(() => {}, { _kind: "reviews" });
  const listComments = Object.assign(() => {}, { _kind: "comments" });
  const github = {
    paginate: async (fn: { _kind?: string }) =>
      fn && fn._kind === "comments" ? opts.comments ?? [] : opts.reviews ?? [],
    rest: {
      repos: {
        getCollaboratorPermissionLevel: async (args: unknown) => {
          calls.push({ method: "getCollaboratorPermissionLevel", args });
          if (opts.permissionError) throw new Error("403 forbidden");
          return {
            data: {
              permission: opts.permission ?? "none",
              role_name: opts.roleName ?? opts.permission ?? "none",
            },
          };
        },
      },
      pulls: {
        listReviews,
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
        listComments,
        createComment: record("createComment"),
        updateComment: record("updateComment"),
        deleteComment: record("deleteComment"),
      },
    },
  };
  return { github, calls };
}

function freshCore() {
  return {
    info: () => {},
    warning(m: string) {
      (this._warned as string[]).push(m);
    },
    setFailed(m: string) {
      (this._failed as string[]).push(m);
    },
    _warned: [] as string[],
    _failed: [] as string[],
  };
}

const context = { repo: { owner: "esphome", repo: "esphome-devices" } };

// --- feedback script -------------------------------------------------------

// `status` writes mfe-status.txt (the review verdict); pass `undefined` to omit
// it entirely (simulating a crashed run).
function withArtifact(
  prNumber: string,
  report: string | null,
  status?: string
): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-art-"));
  fs.writeFileSync(path.join(dir, "pr-number.txt"), prNumber + "\n");
  if (report !== null) fs.writeFileSync(path.join(dir, "mfe-review-report.md"), report);
  if (status !== undefined) fs.writeFileSync(path.join(dir, "mfe-status.txt"), status + "\n");
  process.env.MFE_ARTIFACT_DIR = dir;
  return dir;
}

const MARKER = "<!-- made-for-esphome-review -->";
const SUPERSEDED = "<!-- mfe-superseded -->";
const MARKER_PASS = "<!-- made-for-esphome-pass -->";

test("feedback: changes + no existing review -> creates a REQUEST_CHANGES review", async () => {
  withArtifact("42", "## report body", "changes");
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
  withArtifact("42", "## report body", "changes");
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
  withArtifact("7", "## new body", "changes");
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
  withArtifact("7", "## body", "changes");
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

test("feedback: changes clears a stale pass comment", async () => {
  withArtifact("7", "## body", "changes");
  const { github, calls } = makeGithub({
    reviews: [],
    comments: [{ id: 88, body: `${MARKER_PASS}\nall good` }],
  });
  await feedbackScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "createReview").length, 1);
  const del = calls.filter((c) => c.method === "deleteComment");
  assert.equal(del.length, 1);
  assert.equal((del[0].args as { comment_id: number }).comment_id, 88);
});

test("feedback: changes with no report still removes a stale pass comment", async () => {
  withArtifact("7", null, "changes"); // status changes but report missing
  const { github, calls } = makeGithub({
    reviews: [{ id: 5, state: "CHANGES_REQUESTED", body: `${MARKER}\nx` }],
    comments: [{ id: 88, body: `${MARKER_PASS}\nall good` }],
  });
  const c = freshCore();
  await feedbackScript({ github, context, core: c });
  // No report -> don't touch the review, but still clear the contradictory ✅ comment.
  assert.equal(calls.filter((x) => x.method === "createReview").length, 0);
  assert.equal(calls.filter((x) => x.method === "dismissReview").length, 0);
  assert.equal(calls.filter((x) => x.method === "deleteComment").length, 1);
  assert.equal(c._warned.length, 1);
});

test("feedback: pass -> dismiss active review and post the green comment", async () => {
  withArtifact("7", "## ✅ all green", "pass");
  const { github, calls } = makeGithub({
    reviews: [{ id: 5, state: "CHANGES_REQUESTED", body: `${MARKER}\nx` }],
    comments: [],
  });
  await feedbackScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "dismissReview").length, 1);
  const created = calls.filter((c) => c.method === "createComment");
  assert.equal(created.length, 1);
  const body = (created[0].args as { body: string }).body;
  assert.ok(body.startsWith(MARKER_PASS));
  assert.ok(body.includes("## ✅ all green"));
});

test("feedback: pass with identical existing comment -> no rewrite", async () => {
  withArtifact("7", "## ✅ all green", "pass");
  const { github, calls } = makeGithub({
    reviews: [],
    comments: [{ id: 3, body: `${MARKER_PASS}\n## ✅ all green` }],
  });
  await feedbackScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "createComment").length, 0);
  assert.equal(calls.filter((c) => c.method === "updateComment").length, 0);
});

test("feedback: pass with changed comment -> update in place", async () => {
  withArtifact("7", "## ✅ new green", "pass");
  const { github, calls } = makeGithub({
    reviews: [],
    comments: [{ id: 3, body: `${MARKER_PASS}\n## ✅ old green` }],
  });
  await feedbackScript({ github, context, core: freshCore() });
  const upd = calls.filter((c) => c.method === "updateComment");
  assert.equal(upd.length, 1);
  assert.equal((upd[0].args as { comment_id: number }).comment_id, 3);
  assert.equal(calls.filter((c) => c.method === "createComment").length, 0);
});

test("feedback: no-mfe -> dismiss active review and remove pass comment", async () => {
  withArtifact("7", null, "no-mfe");
  const { github, calls } = makeGithub({
    reviews: [{ id: 5, state: "CHANGES_REQUESTED", body: `${MARKER}\nx` }],
    comments: [{ id: 9, body: `${MARKER_PASS}\ngreen` }],
  });
  await feedbackScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "dismissReview").length, 1);
  assert.equal(calls.filter((c) => c.method === "deleteComment").length, 1);
});

test("feedback: inconclusive status does NOT dismiss the blocking review", async () => {
  withArtifact("7", null, "inconclusive");
  const { github, calls } = makeGithub({
    reviews: [{ id: 5, state: "CHANGES_REQUESTED", body: `${MARKER}\nx` }],
  });
  const c = freshCore();
  await feedbackScript({ github, context, core: c });
  assert.equal(calls.filter((c) => c.method === "dismissReview").length, 0);
  assert.equal(calls.filter((c) => c.method === "createComment").length, 0);
  assert.equal(c._warned.length, 1);
});

test("feedback: crashed run (no status file) does NOT dismiss", async () => {
  withArtifact("7", null); // no report AND no status -> crash
  const { github, calls } = makeGithub({
    reviews: [{ id: 5, state: "CHANGES_REQUESTED", body: `${MARKER}\nx` }],
  });
  const c = freshCore();
  await feedbackScript({ github, context, core: c });
  assert.equal(calls.filter((c) => c.method === "dismissReview").length, 0);
  assert.equal(c._warned.length, 1);
});

test("feedback: unreadable PR number -> setFailed", async () => {
  withArtifact("not-a-number", "## body", "changes");
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

test("command: maintain role (via role_name) authorises", async () => {
  const { github, calls } = makeGithub({
    permission: "read", // legacy field collapses maintain oddly on some repos
    roleName: "maintain",
    runs: [{ id: 4, status: "completed", created_at: "2026-02-01T00:00:00Z" }],
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
  assert.equal(calls.filter((c) => c.method === "reRunWorkflow").length, 1);
});

test("command: triage role is not authorised", async () => {
  const { github, calls } = makeGithub({ permission: "read", roleName: "triage" });
  await commandScript({
    github,
    context: commandContext({
      body: "@esphome[bot] review",
      commenter: "triager",
      author: "author",
    }),
    core: freshCore(),
  });
  assert.equal(calls.filter((c) => c.method === "reRunWorkflow").length, 0);
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
