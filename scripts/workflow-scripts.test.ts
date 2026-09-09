#!/usr/bin/env tsx
/**
 * Unit tests for the extracted github-script handlers used by the Made for
 * ESPHome review workflows:
 *   .github/scripts/mfe-review-feedback.cjs  (supersede-and-repost / dismiss)
 *   .github/scripts/mfe-review-command.cjs   (`@esphome[bot] review` command)
 *   .github/scripts/mfe-intake.cjs           (draft + label a new submission)
 *   .github/scripts/mfe-promote.cjs          (ready for review + pending label)
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
const intakeScript = require("../.github/scripts/mfe-intake.cjs");
const promoteScript = require("../.github/scripts/mfe-promote.cjs");

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

// --- intake script ---------------------------------------------------------

type ChangedFile = { filename: string; patch?: string };

// Mock for the intake script. `files` seeds paginate(pulls.listFiles).
function makeIntakeGithub(opts: { files?: ChangedFile[] } = {}) {
  const calls: Call[] = [];
  const listFiles = Object.assign(() => {}, { _kind: "files" });
  const github = {
    paginate: async (fn: { _kind?: string }, args: unknown) => {
      calls.push({ method: `paginate:${fn._kind}`, args });
      return opts.files ?? [];
    },
    graphql: async (query: string, vars: unknown) => {
      calls.push({ method: "graphql", args: { query, vars } });
      return {};
    },
    rest: {
      pulls: { listFiles },
      issues: {
        addLabels: async (args: unknown) => {
          calls.push({ method: "addLabels", args });
          return { data: {} };
        },
        createComment: async (args: unknown) => {
          calls.push({ method: "createComment", args });
          return { data: {} };
        },
      },
    },
  };
  return { github, calls };
}

const MFE = "made-for-esphome";
const PENDING = "made-for-esphome-pending";

const PAGE = "src/docs/devices/Some-Device/index.md";
const ADDS_FLAG = "@@ -1,3 +1,4 @@\n title: Some Device\n+made-for-esphome: true\n";

// The pull_request payload intake sees.
const intakeContext = (opts: { labels?: string[]; draft?: boolean } = {}) => ({
  repo: { owner: "esphome", repo: "esphome-devices" },
  payload: {
    pull_request: {
      number: 42,
      node_id: "PR_node",
      draft: opts.draft ?? false,
      labels: (opts.labels ?? []).map((name) => ({ name })),
    },
  },
});

test("intake: a new made-for-esphome page is labeled, drafted and explained", async () => {
  const { github, calls } = makeIntakeGithub({
    files: [{ filename: PAGE, patch: ADDS_FLAG }],
  });
  await intakeScript({ github, context: intakeContext(), core: freshCore() });
  const added = calls.filter((c) => c.method === "addLabels");
  assert.equal(added.length, 1);
  assert.deepEqual((added[0].args as { labels: string[] }).labels, [MFE]);
  const graphql = calls.filter((c) => c.method === "graphql");
  assert.equal(graphql.length, 1);
  const gql = graphql[0].args as { query: string; vars: { id: string } };
  assert.ok(gql.query.includes("convertPullRequestToDraft"));
  assert.equal(gql.vars.id, "PR_node");
  const comment = calls.filter((c) => c.method === "createComment");
  assert.equal(comment.length, 1);
  assert.ok((comment[0].args as { body: string }).body.includes("<!-- made-for-esphome-intake -->"));
});

test("intake: an already-draft PR is labeled and explained but not re-drafted", async () => {
  const { github, calls } = makeIntakeGithub({
    files: [{ filename: PAGE, patch: ADDS_FLAG }],
  });
  await intakeScript({
    github,
    context: intakeContext({ draft: true }),
    core: freshCore(),
  });
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 1);
  assert.equal(calls.filter((c) => c.method === "graphql").length, 0);
  assert.equal(calls.filter((c) => c.method === "createComment").length, 1);
});

test("intake: an already-labeled PR is left alone", async () => {
  const { github, calls } = makeIntakeGithub({
    files: [{ filename: PAGE, patch: ADDS_FLAG }],
  });
  await intakeScript({
    github,
    context: intakeContext({ labels: [MFE] }),
    core: freshCore(),
  });
  assert.equal(calls.length, 0);
});

test("intake: a diff that doesn't add the flag is left alone", async () => {
  const { github, calls } = makeIntakeGithub({
    files: [
      // Right file, but the flag line is context, not an addition.
      { filename: PAGE, patch: "@@ -1,3 +1,3 @@\n made-for-esphome: true\n+title: X\n" },
      // Right file, no patch at all (binary/too large).
      { filename: "src/docs/devices/Other/index.md" },
      // The flag added somewhere that isn't a device page.
      { filename: "src/docs/guides/index.md", patch: ADDS_FLAG },
      // A device page one level too deep.
      { filename: "src/docs/devices/Other/sub/index.md", patch: ADDS_FLAG },
    ],
  });
  await intakeScript({ github, context: intakeContext(), core: freshCore() });
  assert.equal(calls.filter((c) => c.method.startsWith("paginate:")).length, 1);
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 0);
  assert.equal(calls.filter((c) => c.method === "graphql").length, 0);
  assert.equal(calls.filter((c) => c.method === "createComment").length, 0);
});

// --- promote script --------------------------------------------------------

type CheckRun = {
  status: string;
  conclusion?: string | null;
  app?: { slug: string };
};

type PullRequest = {
  state?: string;
  draft?: boolean;
  node_id?: string;
  head?: { sha: string };
  labels?: { name: string }[];
};

// Mock for the promote script. `pr` seeds pulls.get, `checks` seeds
// paginate(checks.listForRef), `events` seeds paginate(issues.listEvents) and
// `removeError` makes removeLabel throw with that HTTP status.
function makePromoteGithub(
  opts: {
    pr?: PullRequest;
    checks?: CheckRun[];
    events?: unknown[];
    removeError?: number;
    graphqlError?: string;
  } = {}
) {
  const calls: Call[] = [];
  const listForRef = Object.assign(() => {}, { _kind: "checks" });
  const listEvents = Object.assign(() => {}, { _kind: "events" });
  const github = {
    paginate: async (fn: { _kind?: string }, args: unknown) => {
      calls.push({ method: `paginate:${fn._kind}`, args });
      return fn._kind === "checks" ? opts.checks ?? [] : opts.events ?? [];
    },
    graphql: async (query: string, vars: unknown) => {
      calls.push({ method: "graphql", args: { query, vars } });
      if (opts.graphqlError) throw new Error(opts.graphqlError);
      return {};
    },
    rest: {
      checks: { listForRef },
      pulls: {
        get: async (args: unknown) => {
          calls.push({ method: "pulls.get", args });
          return { data: opts.pr ?? makePr([]) };
        },
      },
      issues: {
        listEvents,
        addLabels: async (args: unknown) => {
          calls.push({ method: "addLabels", args });
          return { data: {} };
        },
        removeLabel: async (args: unknown) => {
          calls.push({ method: "removeLabel", args });
          if (opts.removeError) {
            throw Object.assign(new Error("removeLabel failed"), {
              status: opts.removeError,
            });
          }
          return { data: {} };
        },
      },
    },
  };
  return { github, calls };
}

function makePr(
  labelNames: string[],
  extra: { state?: string; draft?: boolean } = {}
): PullRequest {
  return {
    state: extra.state ?? "open",
    draft: extra.draft ?? false,
    node_id: "PR_node",
    head: { sha: "sha1" },
    labels: labelNames.map((name) => ({ name })),
  };
}

// A GitHub Actions check run in the given state.
const ga = (status: string, conclusion: string | null = null): CheckRun => ({
  status,
  conclusion,
  app: { slug: "github-actions" },
});

const draftedBy = (type: string) => [
  { event: "labeled" },
  { event: "convert_to_draft", actor: { type } },
];

// The promote script only needs pr-number.txt out of the review artifact.
const withPrNumber = (prNumber: string) => withArtifact(prNumber, null, "pass");

test("promote: all checks green -> adds the pending label", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE]),
    checks: [
      ga("completed", "success"),
      ga("completed", "skipped"),
      ga("completed", "neutral"),
    ],
  });
  await promoteScript({ github, context, core: freshCore() });
  const added = calls.filter((c) => c.method === "addLabels");
  assert.equal(added.length, 1);
  assert.deepEqual((added[0].args as { labels: string[] }).labels, [PENDING]);
  assert.equal((added[0].args as { issue_number: number }).issue_number, 42);
  // Not a draft, so nothing to mark ready.
  assert.equal(calls.filter((c) => c.method === "graphql").length, 0);
});

test("promote: a green draft the bot created is marked ready for review", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE], { draft: true }),
    checks: [ga("completed", "success")],
    events: draftedBy("Bot"),
  });
  await promoteScript({ github, context, core: freshCore() });
  const graphql = calls.filter((c) => c.method === "graphql");
  assert.equal(graphql.length, 1);
  const gql = graphql[0].args as { query: string; vars: { id: string } };
  assert.ok(gql.query.includes("markPullRequestReadyForReview"));
  assert.equal(gql.vars.id, "PR_node");
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 1);
});

test("promote: a draft a human created stays a draft", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE], { draft: true }),
    checks: [ga("completed", "success")],
    events: draftedBy("User"),
  });
  await promoteScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "graphql").length, 0);
  // The label still goes on: the checks did pass.
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 1);
});

test("promote: a draft with no draft-state history stays a draft", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE], { draft: true }),
    checks: [ga("completed", "success")],
    events: [{ event: "labeled" }],
  });
  await promoteScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "graphql").length, 0);
});

test("promote: a re-draft after the bot's is respected", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE], { draft: true }),
    checks: [ga("completed", "success")],
    // Bot drafted, bot marked ready, then someone drafted it again by hand.
    events: [
      { event: "convert_to_draft", actor: { type: "Bot" } },
      { event: "ready_for_review", actor: { type: "Bot" } },
      { event: "convert_to_draft" }, // no actor on the payload
    ],
  });
  await promoteScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "graphql").length, 0);
});

test("promote: a green PR that is already promoted is left alone", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE, PENDING]),
    checks: [ga("completed", "success")],
  });
  await promoteScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 0);
  assert.equal(calls.filter((c) => c.method === "graphql").length, 0);
  assert.equal(calls.filter((c) => c.method === "removeLabel").length, 0);
});

test("promote: a failing check removes an existing pending label", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE, PENDING]),
    checks: [ga("completed", "success"), ga("completed", "failure")],
  });
  await promoteScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 0);
  const removed = calls.filter((c) => c.method === "removeLabel");
  assert.equal(removed.length, 1);
  assert.equal((removed[0].args as { name: string }).name, PENDING);
});

test("promote: a still-running check leaves the label off", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE]),
    checks: [ga("completed", "success"), ga("in_progress")],
  });
  await promoteScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 0);
  assert.equal(calls.filter((c) => c.method === "removeLabel").length, 0);
});

test("promote: no check runs at all is not a pass", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE, PENDING]),
    checks: [],
  });
  await promoteScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "removeLabel").length, 1);
});

test("promote: non-Actions check runs are ignored", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE]),
    checks: [
      ga("completed", "success"),
      { status: "in_progress", app: { slug: "netlify" } },
      { status: "completed", conclusion: "failure" }, // no app at all
    ],
  });
  await promoteScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 1);
});

test("promote: a PR without the made-for-esphome label is left alone", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr(["new-device"]),
    checks: [ga("completed", "success")],
  });
  await promoteScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method.startsWith("paginate:")).length, 0);
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 0);
});

test("promote: a PR with no labels array is left alone", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: { state: "open", head: { sha: "sha1" } },
    checks: [ga("completed", "success")],
  });
  await promoteScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 0);
});

test("promote: a closed PR is left alone", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE], { state: "closed" }),
    checks: [ga("completed", "success")],
  });
  await promoteScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 0);
});

test("promote: an unreadable PR number -> setFailed", async () => {
  withPrNumber("not-a-number");
  const { github, calls } = makePromoteGithub({ pr: makePr([MFE]) });
  const core = freshCore();
  await promoteScript({ github, context, core });
  assert.equal(core._failed.length, 1);
  assert.equal(calls.length, 0);
});

test("promote: a 404 from removeLabel is swallowed", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE, PENDING]),
    checks: [ga("completed", "failure")],
    removeError: 404,
  });
  await promoteScript({ github, context, core: freshCore() });
  assert.equal(calls.filter((c) => c.method === "removeLabel").length, 1);
});

test("promote: any other removeLabel error propagates", async () => {
  withPrNumber("42");
  const { github } = makePromoteGithub({
    pr: makePr([MFE, PENDING]),
    checks: [ga("completed", "failure")],
    removeError: 500,
  });
  await assert.rejects(
    () => promoteScript({ github, context, core: freshCore() }),
    /removeLabel failed/
  );
});

test("promote: falls back to ./artifact when MFE_ARTIFACT_DIR is unset", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-cwd-"));
  fs.mkdirSync(path.join(dir, "artifact"));
  fs.writeFileSync(path.join(dir, "artifact", "pr-number.txt"), "42\n");
  delete process.env.MFE_ARTIFACT_DIR;
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const { github, calls } = makePromoteGithub({
      pr: makePr([MFE]),
      checks: [ga("completed", "success")],
    });
    await promoteScript({ github, context, core: freshCore() });
    assert.equal(calls.filter((c) => c.method === "addLabels").length, 1);
  } finally {
    process.chdir(cwd);
  }
});

test("promote: a failed ready-for-review mutation warns instead of throwing", async () => {
  withPrNumber("42");
  const { github, calls } = makePromoteGithub({
    pr: makePr([MFE], { draft: true }),
    checks: [ga("completed", "success")],
    events: draftedBy("Bot"),
    graphqlError: "Pull request is not a draft",
  });
  const core = freshCore();
  await promoteScript({ github, context, core });
  assert.equal(core._warned.length, 1);
  assert.ok(core._warned[0].includes("not a draft"));
  // The label still goes on.
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 1);
});
