// Requests a Copilot code review on a pull request. A failed request only
// warns: Copilot review is advisory and must never block the PR.

async function requestCopilotReview({ github, core, owner, repo, pull }) {
  if (pull.user?.type === "Bot") {
    core.info(`#${pull.number} was opened by a bot; skipping the Copilot review.`);
    return;
  }
  try {
    await github.rest.pulls.requestReviewers({
      owner,
      repo,
      pull_number: pull.number,
      reviewers: ["copilot-pull-request-reviewer[bot]"],
    });
    core.info(`Requested a Copilot review on #${pull.number}.`);
  } catch (err) {
    core.warning(`Could not request a Copilot review on #${pull.number}: ${err.message}`);
  }
}

module.exports = async ({ github, context, core }) =>
  requestCopilotReview({ github, core, ...context.repo, pull: context.payload.pull_request });

module.exports.requestCopilotReview = requestCopilotReview;
