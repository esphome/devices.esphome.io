// Handles the `@esphome[bot] review` comment command: validates the command and
// the commenter, then re-runs the latest Made for ESPHome Review workflow run
// for the PR's current head commit. The re-run executes in the original
// secret-free `pull_request` context, so contributor code never runs with
// secrets here (this handler only calls the Actions API).
//
// Loaded by .github/workflows/made-for-esphome-review-command.yml via
// actions/github-script. Exported as a function so it can be linted
// (`node --check`) and unit-tested with a mocked GitHub client.

// A line that is `@esphome[bot] review` (the `[bot]` and the mention are
// optional so `@esphome review` works too).
const COMMAND_RE = /(^|\s)@esphome(\[bot\])?\s+review\b/im;

module.exports = async ({ github, context, core }) => {
  const common = { owner: context.repo.owner, repo: context.repo.repo };
  const comment = context.payload.comment;
  const issue = context.payload.issue;

  if (!COMMAND_RE.test(comment.body || "")) {
    core.info("Comment is not a review command; ignoring.");
    return;
  }

  // Authorisation. The PR author may always re-review their own PR. Otherwise
  // require write/admin access to this repo, resolved explicitly rather than
  // from the comment's `author_association` — the effective permission level
  // accounts for team-based access, so it also authorises org members whose
  // membership is private (which `author_association` would report as NONE).
  const login = comment.user.login;
  let authorized = login === issue.user.login;
  if (!authorized) {
    try {
      const { data } = await github.rest.repos.getCollaboratorPermissionLevel({
        ...common,
        username: login,
      });
      // The legacy `permission` field usually collapses maintain -> write, but
      // some responses surface the granular role in `permission`/`role_name`,
      // so accept admin/write/maintain from either. triage/read/none do not
      // grant re-review.
      const level = data.permission;
      const role = data.role_name;
      const allowed = new Set(["admin", "write", "maintain"]);
      authorized = allowed.has(level) || allowed.has(role);
    } catch (e) {
      core.info(`Could not resolve repo permission for ${login}: ${e.message}`);
    }
  }
  if (!authorized) {
    core.info(`Unauthorised commenter (${login}); ignoring.`);
    return;
  }

  const react = async (content) => {
    try {
      await github.rest.reactions.createForIssueComment({
        ...common,
        comment_id: comment.id,
        content,
      });
    } catch (e) {
      core.info(`Could not add reaction: ${e.message}`);
    }
  };

  // Find the most recent Made for ESPHome Review run for this PR's current head.
  const pr = await github.rest.pulls.get({
    ...common,
    pull_number: issue.number,
  });
  const headSha = pr.data.head.sha;
  const runs = await github.rest.actions.listWorkflowRuns({
    ...common,
    workflow_id: "made-for-esphome-review.yml",
    head_sha: headSha,
    per_page: 30,
  });
  const latest = runs.data.workflow_runs.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )[0];

  if (!latest) {
    await react("confused");
    try {
      await github.rest.issues.createComment({
        ...common,
        issue_number: issue.number,
        body:
          "No Made for ESPHome review run was found for the current commit. " +
          "Push a change under `src/docs/devices/` to trigger one.",
      });
    } catch (e) {
      core.info(`Could not post comment: ${e.message}`);
    }
    return;
  }

  if (latest.status !== "completed") {
    // A review is already running for this commit; nothing to do.
    await react("eyes");
    core.info(`Run ${latest.id} is still ${latest.status}; not re-running.`);
    return;
  }

  await github.rest.actions.reRunWorkflow({ ...common, run_id: latest.id });
  await react("rocket");
  core.info(
    `Re-running Made for ESPHome review run ${latest.id} for PR #${issue.number}.`
  );
};
