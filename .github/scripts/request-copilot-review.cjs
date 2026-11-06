// Requests a Copilot code review on a pull request. A failed request only
// warns: Copilot review is advisory and must never block the PR.
//
// GitHub answers a request it will not act on (one made with GITHUB_TOKEN, or
// by an identity without Copilot code review access) with a success and no
// review, so the timeline is read back to confirm the request was recorded.

const COPILOT_REVIEWER = "copilot-pull-request-reviewer[bot]";
// The timeline names the reviewer by its display login; the reviews API uses
// the bot account.
const COPILOT_LOGINS = new Set(["Copilot", COPILOT_REVIEWER]);

async function requestCopilotReview({ github, core, owner, repo, prNumber }) {
  const readTimeline = () =>
    github.paginate(github.rest.issues.listEventsForTimeline, {
      owner,
      repo,
      issue_number: prNumber,
      per_page: 100,
    });
  let before;
  try {
    before = await readTimeline();
  } catch (err) {
    before = null;
    core.warning(`Could not read the timeline of #${prNumber}, so the request goes unconfirmed: ${err.message}`);
  }
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
  if (!before) return;
  let events;
  try {
    events = await readTimeline();
  } catch (err) {
    core.warning(`Requested a Copilot review on #${prNumber} but could not confirm it: ${err.message}`);
    return;
  }
  const seen = new Set(before.map((event) => event.id));
  const copilotRequests = events.filter(
    (event) => event.event === "review_requested" && COPILOT_LOGINS.has(event.requested_reviewer?.login)
  );
  // Ours is a bot-filed request that was not there before; the ruleset files under a user.
  if (copilotRequests.some((event) => event.actor?.type === "Bot" && !seen.has(event.id))) {
    core.info(`Requested a Copilot review on #${prNumber}.`);
    return;
  }
  // The latest request or removal decides whether a review is still queued.
  const last = events
    .filter(
      (event) =>
        (event.event === "review_requested" || event.event === "review_request_removed") &&
        COPILOT_LOGINS.has(event.requested_reviewer?.login)
    )
    .at(-1);
  if (last?.event === "review_requested" && !reviewedSince(events, last.created_at)) {
    core.info(`A Copilot review requested by ${last.actor?.login} is still pending on #${prNumber}.`);
    return;
  }
  core.warning(
    `GitHub accepted the Copilot review request on #${prNumber} but recorded none; ` +
      "the requesting token likely has no Copilot code review access."
  );
}

function reviewedSince(events, since) {
  return events.some(
    (event) =>
      event.event === "reviewed" &&
      COPILOT_LOGINS.has(event.user?.login) &&
      Date.parse(event.submitted_at) >= Date.parse(since)
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

// Requests a review on each PR in a comma-separated list, the promotion jobs'
// marked-ready output.
async function requestCopilotReviews({ github, core, owner, repo, prNumbers }) {
  for (const number of String(prNumbers).split(",").filter(Boolean)) {
    await requestCopilotReview({ github, core, owner, repo, prNumber: Number(number) });
  }
}

module.exports.requestCopilotReview = requestCopilotReview;
module.exports.requestCopilotReviews = requestCopilotReviews;
