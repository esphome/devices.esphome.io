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

// Hidden markers so we only ever touch our own reviews/comments and never the
// device-config validation review or the made-for-esphome checklist review
// (both also bot REQUEST_CHANGES reviews). SUPERSEDED tags the stub we leave
// behind when a newer review replaces an older one; MARKER_PASS tags the
// non-blocking "all checks pass" acknowledgement comment.
const MARKER = "<!-- made-for-esphome-review -->";
const SUPERSEDED = "<!-- mfe-superseded -->";
const MARKER_PASS = "<!-- made-for-esphome-pass -->";

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

  // A report file means the review found blocking issues. Its absence is
  // ambiguous, so the review script also writes an explicit verdict to
  // mfe-status.txt: `pass`/`no-mfe` mean genuinely clear (safe to dismiss),
  // `inconclusive` means the run could not complete the checks, and a MISSING
  // status file means the run crashed. We only ever dismiss on a real pass, so
  // a crash or an inconclusive run never silently unblocks the PR.
  const reportPath = path.join(artifactDir, "mfe-review-report.md");
  const hasReport = fs.existsSync(reportPath);
  const statusPath = path.join(artifactDir, "mfe-status.txt");
  const status = fs.existsSync(statusPath)
    ? fs.readFileSync(statusPath, "utf8").trim()
    : null;
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

  const dismissActive = async (message) => {
    for (const r of active) {
      await github.rest.pulls.dismissReview({ ...common, review_id: r.id, message });
    }
    if (active.length) core.info(`Dismissed ${active.length} review(s) on PR #${prNumber}.`);
  };

  // The "all checks pass" acknowledgement is a plain issue comment (keyed by
  // MARKER_PASS) — non-blocking, and cleanly upserted/removed.
  const issueCommon = { owner: context.repo.owner, repo: context.repo.repo };
  const findPassComment = async () => {
    const comments = await github.paginate(github.rest.issues.listComments, {
      ...issueCommon,
      issue_number: prNumber,
      per_page: 100,
    });
    return comments.find((c) => c.body && c.body.includes(MARKER_PASS)) || null;
  };
  const removePassComment = async () => {
    const existing = await findPassComment();
    if (existing) {
      await github.rest.issues.deleteComment({ ...issueCommon, comment_id: existing.id });
      core.info(`Removed pass comment ${existing.id}.`);
    }
  };

  const reportBody = hasReport ? fs.readFileSync(reportPath, "utf8").trim() : null;

  if (status === "changes") {
    if (!reportBody) {
      // The verdict is failures, so a stale "all pass" comment must go even if
      // we can't (re)post the blocking review without the report body.
      core.warning("status is `changes` but no report was uploaded; leaving reviews untouched.");
      await removePassComment();
      return;
    }
    const body = `${MARKER}\n${reportBody}`;
    // workflow_run fires on every push; if the newest active review already
    // carries this exact content, nothing changed — skip so we don't spam a
    // fresh review on a no-op push.
    const newest = active[active.length - 1];
    if (newest && newest.body === body) {
      core.info(`Review ${newest.id} already current; nothing to do.`);
    } else {
      // Move the old content to a stub and post a new review lower down rather
      // than editing in place.
      for (const r of active) {
        await supersede(r);
      }
      // Reviews are only ever REQUEST_CHANGES (blocking) — never APPROVE.
      await github.rest.pulls.createReview({ ...common, event: "REQUEST_CHANGES", body });
      core.info(`Posted a new Made for ESPHome review on PR #${prNumber}.`);
    }
    // A failing run must not leave a stale "all pass" acknowledgement behind.
    await removePassComment();
  } else if (status === "pass") {
    // Genuine pass: unblock (dismiss any active review) and post/refresh the
    // non-blocking green acknowledgement comment.
    await dismissActive("Made for ESPHome checks now pass — dismissing.");
    const passBody = `${MARKER_PASS}\n${
      reportBody ?? "## ✅ Made for ESPHome review\n\nAll automated checks pass."
    }`;
    const existing = await findPassComment();
    if (existing && existing.body === passBody) {
      core.info(`Pass comment ${existing.id} already current.`);
    } else if (existing) {
      await github.rest.issues.updateComment({ ...issueCommon, comment_id: existing.id, body: passBody });
      core.info(`Updated pass comment ${existing.id}.`);
    } else {
      await github.rest.issues.createComment({ ...issueCommon, issue_number: prNumber, body: passBody });
      core.info(`Posted pass comment on PR #${prNumber}.`);
    }
  } else if (status === "no-mfe") {
    // No longer made-for-esphome: unblock and remove any acknowledgement.
    await dismissActive("No longer made-for-esphome — dismissing.");
    await removePassComment();
  } else {
    // `inconclusive` or a missing status file (a crashed run). Leave everything
    // as-is; dismissing here would silently unblock a PR whose checks never
    // actually completed.
    core.warning(
      `Made for ESPHome run did not produce a pass (status: ${status ?? "missing"}); ` +
        "leaving any existing review/comment untouched."
    );
  }
};
