// Promotes a Made for ESPHome pull request once the automation is happy with
// it: the draft is marked ready for review and labeled
// `made-for-esphome-pending`, the "a human reviewer should look at this now"
// signal. While checks are failing or still running the label comes off again.
//
// A PR is only taken out of draft if the bot put it there (see mfe-intake.cjs),
// so an author's own work-in-progress draft is left alone.
//
// Runs as the last step of made-for-esphome-pr.yml, i.e. once the Made for
// ESPHome review (the slowest check by a wide margin, it compiles the linked
// config) has finished, so the other checks are in their final state by then.
// It reads the PR number from the same `mfe-review-report` artifact and
// re-derives everything else from the check runs, so the review verdict itself
// needs no plumbing: a failed review is simply a failed check.
//
// Exported as a function so it can be linted (`node --check`) and unit-tested
// with a mocked GitHub client.
const fs = require("fs");
const path = require("path");

const MFE_LABEL = "made-for-esphome";
const PENDING_LABEL = "made-for-esphome-pending";

// Conclusions that don't stand in the way of a human review: `skipped` covers
// jobs excluded by a path/event filter and `neutral` is an explicit
// non-failure. Everything else (failure, cancelled, timed_out,
// action_required, stale) means the automation isn't happy yet.
const PASSING_CONCLUSIONS = new Set(["success", "neutral", "skipped"]);

// Did we put this PR into draft, rather than its author or a maintainer? The
// most recent draft-state change in the timeline answers that.
async function botConvertedToDraft({ github, owner, repo, prNumber }) {
  const events = await github.paginate(github.rest.issues.listEvents, {
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  });
  const last = events
    .filter((event) => event.event === "convert_to_draft" || event.event === "ready_for_review")
    .pop();
  return Boolean(
    last && last.event === "convert_to_draft" && last.actor && last.actor.type === "Bot"
  );
}

module.exports = async ({ github, context, core }) => {
  const artifactDir = process.env.MFE_ARTIFACT_DIR || "artifact";
  const prNumber = parseInt(
    fs.readFileSync(path.join(artifactDir, "pr-number.txt"), "utf8").trim(),
    10
  );
  if (!Number.isInteger(prNumber)) {
    core.setFailed("Could not read a PR number from the artifact.");
    return;
  }

  const { owner, repo } = context.repo;
  const { data: pr } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });
  if (pr.state !== "open") {
    core.info(`PR #${prNumber} is ${pr.state}; nothing to do.`);
    return;
  }

  const labels = (pr.labels || []).map((label) => label.name);
  if (!labels.includes(MFE_LABEL)) {
    core.info(`PR #${prNumber} is not made-for-esphome; nothing to do.`);
    return;
  }

  const checks = await github.paginate(github.rest.checks.listForRef, {
    owner,
    repo,
    ref: pr.head.sha,
    filter: "latest",
    per_page: 100,
  });

  // Only GitHub Actions check runs count. Runs from `workflow_run` and
  // `pull_request_target` workflows (including this one) attach their check
  // runs to the default/base branch commit rather than the PR head, so what is
  // left here is exactly the CI and Made for ESPHome Review jobs.
  const relevant = checks.filter((check) => check.app && check.app.slug === "github-actions");
  const running = relevant.filter((check) => check.status !== "completed");
  const failed = relevant.filter(
    (check) => check.status === "completed" && !PASSING_CONCLUSIONS.has(check.conclusion)
  );
  // No checks at all (e.g. the runs have since expired) is not a pass.
  const green = relevant.length > 0 && running.length === 0 && failed.length === 0;
  const hasPending = labels.includes(PENDING_LABEL);

  if (!green) {
    // The failing review posts its own REQUEST_CHANGES review; all that is
    // needed here is to take back the "ready for a reviewer" signal. The draft
    // state is left as it is so a PR a human is already reviewing doesn't get
    // pulled out from under them.
    if (hasPending) {
      try {
        await github.rest.issues.removeLabel({
          owner,
          repo,
          issue_number: prNumber,
          name: PENDING_LABEL,
        });
      } catch (error) {
        // Someone removed the label between the read and the write, not an error.
        if (error.status !== 404) throw error;
      }
      core.info(
        `${running.length} check(s) running, ${failed.length} failing, removed ` +
          `\`${PENDING_LABEL}\` from PR #${prNumber}.`
      );
      return;
    }
    core.info(`${running.length} check(s) running, ${failed.length} failing on PR #${prNumber}.`);
    return;
  }

  if (pr.draft) {
    if (await botConvertedToDraft({ github, owner, repo, prNumber })) {
      try {
        // Draft state is GraphQL-only; the REST pulls API cannot toggle it.
        await github.graphql(
          `mutation ($id: ID!) {
            markPullRequestReadyForReview(input: { pullRequestId: $id }) {
              clientMutationId
            }
          }`,
          { id: pr.node_id }
        );
        core.info(`All ${relevant.length} check(s) pass, marked PR #${prNumber} ready for review.`);
      } catch (error) {
        // Both promotion jobs can reach this within seconds of each other when
        // CI and the review finish together, and the loser's mutation fails
        // because the PR is no longer a draft. Never worth failing over.
        core.warning(`Could not mark PR #${prNumber} ready for review: ${error.message}`);
      }
    } else {
      core.info(`PR #${prNumber} was drafted by a human; leaving it as a draft.`);
    }
  }

  if (!hasPending) {
    await github.rest.issues.addLabels({
      owner,
      repo,
      issue_number: prNumber,
      labels: [PENDING_LABEL],
    });
    core.info(`Added \`${PENDING_LABEL}\` to PR #${prNumber}.`);
    return;
  }
  core.info(`\`${PENDING_LABEL}\` already set on PR #${prNumber}.`);
};
