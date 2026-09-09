// Intake for Made for ESPHome submissions. When a pull request adds
// `made-for-esphome: true` to a device page it is labeled `made-for-esphome`
// and converted to a draft, with a comment explaining what happens next.
//
// The draft state is the gate: the PR stays a draft until the automated review
// and the rest of the checks are green, at which point mfe-promote.cjs marks it
// ready for review and labels it for a human reviewer.
//
// Loaded by .github/workflows/made-for-esphome-pr.yml via actions/github-script
// as the esphome[bot] app. It reads the diff through the API and never checks
// out the PR's code. Exported as a function so it can be linted
// (`node --check`) and unit-tested with a mocked GitHub client.
const MFE_LABEL = "made-for-esphome";

// Hidden marker so the intake comment stays recognisable.
const MARKER = "<!-- made-for-esphome-intake -->";

// Device pages are `src/docs/devices/<device>/index.md`; the flag only counts
// as newly added when the diff adds the frontmatter line.
const DEVICE_PAGE = /^src\/docs\/devices\/[^/]+\/index\.mdx?$/i;
const FLAG_ADDED = /^\+\s*made-for-esphome:\s*(?:true|True)\s*$/m;

const CHECKLIST =
  "https://github.com/esphome/esphome-devices/blob/main/.github/made-for-esphome-checklist.md";

const COMMENT =
  `${MARKER}\n` +
  "This pull request flags a device as **Made for ESPHome**, so it goes through the automated " +
  "Made for ESPHome review: the linked configuration is compiled and checked against the " +
  `[Made for ESPHome checklist](${CHECKLIST}) on every push.\n\n` +
  "I have converted the PR to a draft while that runs, which takes a few minutes. Once it and " +
  "the rest of the checks pass I will mark it ready for review and label it " +
  "`made-for-esphome-pending` so a human reviewer picks it up. If something needs fixing I will " +
  "leave a review here instead.";

module.exports = async ({ github, context, core }) => {
  const pr = context.payload.pull_request;
  const { owner, repo } = context.repo;

  // Intake runs once per PR: the label is what records that it already ran.
  if (pr.labels.some((label) => label.name === MFE_LABEL)) {
    core.info(`PR #${pr.number} is already labeled ${MFE_LABEL}; nothing to do.`);
    return;
  }

  const files = await github.paginate(github.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pr.number,
    per_page: 100,
  });
  // `patch` is absent for binary files and for diffs GitHub considers too
  // large, neither of which can be a device page adding the flag.
  const flagged = files.some(
    (file) => DEVICE_PAGE.test(file.filename) && file.patch && FLAG_ADDED.test(file.patch)
  );
  if (!flagged) {
    core.info(`PR #${pr.number} does not add a made-for-esphome device page; nothing to do.`);
    return;
  }

  await github.rest.issues.addLabels({
    owner,
    repo,
    issue_number: pr.number,
    labels: [MFE_LABEL],
  });

  // Draft state is GraphQL-only; the REST pulls API cannot toggle it.
  if (!pr.draft) {
    await github.graphql(
      `mutation ($id: ID!) {
        convertPullRequestToDraft(input: { pullRequestId: $id }) {
          clientMutationId
        }
      }`,
      { id: pr.node_id }
    );
    core.info(`Converted PR #${pr.number} to a draft.`);
  }

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: pr.number,
    body: COMMENT,
  });
  core.info(`Labeled PR #${pr.number} and explained the review process.`);
};
