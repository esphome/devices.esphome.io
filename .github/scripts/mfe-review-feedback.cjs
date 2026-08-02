// Posts the Made for ESPHome review as an esphome[bot] review, driven by the
// `mfe-review-report` artifact the (secret-free) review workflow uploaded.
//
// When the report changed, the old review is turned into a dismissed pointer
// stub and a fresh review is posted lower down; when the checks pass the active
// review is dismissed. Reviews are only ever REQUEST_CHANGES — never APPROVE.
//
// Loaded by .github/workflows/made-for-esphome-review-feedback.yml via
// actions/github-script. Exported as a function so it can be linted
// (`node --check`) and unit-tested with a mocked GitHub client.
const fs = require("fs");
const path = require("path");

// Hidden markers so we only ever touch our own reviews and never the
// device-config validation review or the made-for-esphome checklist review
// (both also bot REQUEST_CHANGES reviews). SUPERSEDED tags the stub we leave
// behind when a newer review replaces an older one.
const MARKER = "<!-- made-for-esphome-review -->";
const SUPERSEDED = "<!-- mfe-superseded -->";

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

  // A report file means the review found blocking issues; its absence means the
  // checks passed (only pr-number.txt was uploaded) or the PR is not
  // made-for-esphome.
  const reportPath = path.join(artifactDir, "mfe-review-report.md");
  const hasReport = fs.existsSync(reportPath);
  const common = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  };

  const reviews = await github.paginate(github.rest.pulls.listReviews, {
    ...common,
    per_page: 100,
  });
  // Our still-active reviews: our marker, still requesting changes, and not
  // already superseded. listReviews returns them oldest-first.
  const active = reviews.filter(
    (r) =>
      r.state === "CHANGES_REQUESTED" &&
      r.body &&
      r.body.includes(MARKER) &&
      !r.body.includes(SUPERSEDED)
  );

  const stub =
    `${MARKER}\n${SUPERSEDED}\n## Made for ESPHome review (superseded)\n\n` +
    "This review is out of date — see the newer Made for ESPHome review below.";

  // Turn an old active review into a dismissed pointer-stub: its content moves
  // to the new review, and its CHANGES_REQUESTED state is cleared so only the
  // newest review blocks the PR.
  const supersede = async (r) => {
    if (r.body !== stub) {
      await github.rest.pulls.updateReview({
        ...common,
        review_id: r.id,
        body: stub,
      });
    }
    await github.rest.pulls.dismissReview({
      ...common,
      review_id: r.id,
      message: "Superseded by a newer Made for ESPHome review below.",
    });
  };

  if (hasReport) {
    const body = `${MARKER}\n${fs.readFileSync(reportPath, "utf8").trim()}`;
    // workflow_run fires on every push; if the newest active review already
    // carries this exact content, nothing changed — skip so we don't spam a
    // fresh review on a no-op push.
    const newest = active[active.length - 1];
    if (newest && newest.body === body) {
      core.info(`Review ${newest.id} already current; nothing to do.`);
      return;
    }
    // When the PR is altered (or a review is re-requested and this re-runs),
    // move the old content to a stub and post a new review lower down rather
    // than editing in place.
    for (const r of active) {
      await supersede(r);
    }
    // Reviews are only ever REQUEST_CHANGES (blocking) — never APPROVE.
    await github.rest.pulls.createReview({
      ...common,
      event: "REQUEST_CHANGES",
      body,
    });
    core.info(`Posted a new Made for ESPHome review on PR #${prNumber}.`);
  } else if (active.length) {
    // Checks pass (or the page is no longer made-for-esphome): dismiss every
    // active review so the PR is unblocked.
    for (const r of active) {
      await github.rest.pulls.dismissReview({
        ...common,
        review_id: r.id,
        message:
          "Made for ESPHome checks now pass (or the page is no longer " +
          "made-for-esphome) — dismissing.",
      });
    }
    core.info(`Dismissed ${active.length} review(s) on PR #${prNumber}.`);
  } else {
    core.info("Checks pass and no active review; nothing to do.");
  }
};
