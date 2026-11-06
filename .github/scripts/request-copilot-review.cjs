// Requests a Copilot code review on a pull request. A failed request only
// warns: Copilot review is advisory and must never block the PR.
//
// GitHub answers a request it will not act on (one made with GITHUB_TOKEN, or
// by an identity without Copilot code review access) with a success and no
// review, so the timeline is read back to confirm the request was recorded.

const COPILOT_REVIEWER = "copilot-pull-request-reviewer[bot]";
// The timeline names the reviewer by its display login.
const COPILOT_LOGIN = "Copilot";
// Allows for clock skew between the runner and GitHub.
const RECORDED_SLACK_MS = 60 * 1000;

async function requestCopilotReview({ github, core, owner, repo, prNumber }) {
  const requestedAt = Date.now();
  try {
    await github.rest.pulls.requestReviewers({
      owner,
      repo,
      pull_number: prNumber,
      reviewers: [COPILOT_REVIEWER],
    });
  } catch (err) {
    core.warning(`Could not request a Copilot review on #${prNumber}: ${err.message}`);
    return;
  }
  const events = await github.paginate(github.rest.issues.listEventsForTimeline, {
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  });
  const recorded = events.some(
    (event) =>
      event.event === "review_requested" &&
      event.requested_reviewer?.login === COPILOT_LOGIN &&
      Date.parse(event.created_at) >= requestedAt - RECORDED_SLACK_MS
  );
  if (recorded) {
    core.info(`Requested a Copilot review on #${prNumber}.`);
    return;
  }
  core.warning(
    `GitHub accepted the Copilot review request on #${prNumber} but recorded none; ` +
      "the requesting token likely has no Copilot code review access."
  );
}

module.exports = async ({ github, context, core }) => {
  const pull = context.payload.pull_request;
  if (pull.user?.type === "Bot") {
    core.info(`#${pull.number} was opened by a bot; skipping the Copilot review.`);
    return;
  }
  await requestCopilotReview({ github, core, ...context.repo, prNumber: pull.number });
};

module.exports.requestCopilotReview = requestCopilotReview;
