// Requests a Copilot code review when a draft pull request is marked ready.
//
// The repository ruleset asks Copilot to review a PR when it is opened, but
// not drafts and not on later pushes. The device-config checks fail within a
// minute of opening and the review drafter then converts the PR to a draft,
// usually before Copilot's review starts, so those PRs never got one. This
// fills the gap when the author marks the PR ready again.
//
// A failed request only warns: Copilot review is advisory and must never
// block the PR.
//
// Loaded by .github/workflows/request-copilot-review.yml via
// actions/github-script. Exported as a function so it can be linted
// (`node --check`) and unit-tested with a mocked GitHub client.

const COPILOT_REVIEWER = "copilot-pull-request-reviewer[bot]";

module.exports = async ({ github, context, core }) => {
  const pull = context.payload.pull_request;
  if (pull.user?.type === "Bot") {
    core.info("Pull request opened by a bot; skipping.");
    return;
  }
  const { owner, repo } = context.repo;
  try {
    await github.rest.pulls.requestReviewers({
      owner,
      repo,
      pull_number: pull.number,
      reviewers: [COPILOT_REVIEWER],
    });
    core.info(`Requested a Copilot review on #${pull.number}.`);
  } catch (err) {
    core.warning(`Could not request a Copilot review on #${pull.number}: ${err.message}`);
  }
};

module.exports.COPILOT_REVIEWER = COPILOT_REVIEWER;
