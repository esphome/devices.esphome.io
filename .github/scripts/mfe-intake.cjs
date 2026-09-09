// Intake for Made for ESPHome submissions. When a pull request adds
// `made-for-esphome: true` to a device page it is labeled `made-for-esphome`
// and converted to a draft, with a comment explaining what happens next.
//
// The draft state is the gate: the PR stays a draft until the automated review
// and the rest of the checks are green, at which point mfe-promote.cjs marks it
// ready for review and labels it for a human reviewer.
//
// Loaded by .github/workflows/made-for-esphome-pr.yml via actions/github-script.
// It reads the diff and the pages through the API and never checks out the
// PR's code. Exported as a function so it can be linted
// (`node --check`) and unit-tested with a mocked GitHub client.
const MFE_LABEL = "made-for-esphome";

// Hidden marker so the intake comment stays recognisable.
const MARKER = "<!-- made-for-esphome-intake -->";

// Device pages are `src/docs/devices/<device>/index.md`.
const DEVICE_PAGE = /^src\/docs\/devices\/[^/]+\/index\.mdx?$/i;

// Cheap negative filter over a diff: adding the flag to the frontmatter always
// shows up as an added `made-for-esphome:` line, whatever its value.
const FLAG_TOUCHED = /^\+\s*made-for-esphome:/m;

// Frontmatter is the leading `---` block. A truthy flag is the YAML boolean or
// the rare quoted string form, matching isMadeForEsphome() in
// scripts/review-made-for-esphome.ts.
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const FLAG_TRUE = /^made-for-esphome:[ \t]*(?:"true"|'true'|true)[ \t]*$/im;

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

function isMadeForEsphome(content) {
  const frontmatter = FRONTMATTER.exec(content);
  return Boolean(frontmatter && FLAG_TRUE.test(frontmatter[1]));
}

async function readPage({ github, owner, repo, path, ref }) {
  try {
    const { data } = await github.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
      mediaType: { format: "raw" },
    });
    return String(data);
  } catch (error) {
    // A page that doesn't exist on that ref (the usual answer for a new page
    // on the base) is information, not a failure.
    if (error.status === 404) return null;
    throw error;
  }
}

// A page is a new submission when it carries the flag at the PR head and did
// not already carry it on the base. The diff alone can't answer this: GitHub
// omits `patch` once a file's diff is large, and the largest device page added
// to this repo so far (3,911 lines) already comes back without one.
async function addsTheFlag({ github, owner, repo, pr, file }) {
  const head = await readPage({
    github,
    owner,
    repo,
    path: file.filename,
    ref: pr.head.sha,
  });
  if (!head || !isMadeForEsphome(head)) return false;
  if (file.status === "added") return true;
  const base = await readPage({
    github,
    owner,
    repo,
    // A renamed page lived under its old path on the base.
    path: file.previous_filename || file.filename,
    ref: pr.base.sha,
  });
  return !(base && isMadeForEsphome(base));
}

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
  // A page whose patch is present but never touches the flag is settled right
  // here, without fetching anything; the rest are confirmed against the file.
  const candidates = files.filter(
    (file) =>
      DEVICE_PAGE.test(file.filename) &&
      file.status !== "removed" &&
      (!file.patch || FLAG_TOUCHED.test(file.patch))
  );

  let flagged = false;
  for (const file of candidates) {
    if (await addsTheFlag({ github, owner, repo, pr, file })) {
      core.info(`PR #${pr.number} adds ${MFE_LABEL} to ${file.filename}.`);
      flagged = true;
      break;
    }
  }
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
