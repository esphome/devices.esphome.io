// Keeps the `has-conflicts` label in sync with whether a pull request can be
// merged into its base branch, and fails the PR's own check while it can't.
//
// GitHub computes `mergeable` lazily: the first read after a push returns
// `null` and starts the computation, so a `null` is retried a few times
// before giving up. A PR whose state is still unknown is left as it is,
// neither labelled nor failed.
//
// Two triggers:
// - pull_request_target (opened / reopened / synchronize): checks that PR,
//   syncs its label and fails the job while it conflicts, so the author sees
//   a red "Merge conflicts" check until they merge or rebase the base branch.
// - push to the default branch: rechecks every open PR, since a merge can
//   create a conflict in a PR nobody touched. This only syncs labels; it
//   can't fail another PR's check.
//
// Loaded by .github/workflows/merge-conflicts.yml via actions/github-script.
// Exported as a function so it can be linted (`node --check`) and unit-tested
// with a mocked GitHub client; the pure classifier is exported separately.

const LABEL = "has-conflicts";
const ATTEMPTS = 6;
const DELAY_MS = 10_000;

// "conflict" | "clean" | "unknown" from a pull request object.
function classify(pull) {
  if (pull.mergeable === true) return "clean";
  if (pull.mergeable === false && pull.mergeable_state === "dirty") return "conflict";
  return "unknown";
}

async function fetchState(github, owner, repo, number, sleep) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const { data } = await github.rest.pulls.get({ owner, repo, pull_number: number });
    const state = classify(data);
    if (state !== "unknown" || attempt === ATTEMPTS) return { state, pull: data };
    await sleep(DELAY_MS);
  }
  return { state: "unknown", pull: null };
}

async function syncLabel(github, core, owner, repo, number, labels, state) {
  const has = labels.some((l) => (typeof l === "string" ? l : l.name) === LABEL);
  if (state === "conflict" && !has) {
    await github.rest.issues.addLabels({ owner, repo, issue_number: number, labels: [LABEL] });
    core.info(`#${number}: added ${LABEL}`);
  } else if (state === "clean" && has) {
    try {
      await github.rest.issues.removeLabel({ owner, repo, issue_number: number, name: LABEL });
      core.info(`#${number}: removed ${LABEL}`);
    } catch (err) {
      if (err.status !== 404) throw err;
    }
  }
}

module.exports = async ({ github, context, core, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) => {
  const { owner, repo } = context.repo;

  if (context.eventName === "push") {
    const pulls = await github.paginate(github.rest.pulls.list, {
      owner,
      repo,
      state: "open",
      base: context.ref.replace(/^refs\/heads\//, ""),
      per_page: 100,
    });
    for (const pull of pulls) {
      const { state } = await fetchState(github, owner, repo, pull.number, sleep);
      if (state === "unknown") {
        core.warning(`#${pull.number}: mergeability still unknown; label left unchanged`);
        continue;
      }
      await syncLabel(github, core, owner, repo, pull.number, pull.labels, state);
    }
    return;
  }

  const number = context.payload.pull_request.number;
  const { state, pull } = await fetchState(github, owner, repo, number, sleep);
  if (state === "unknown") {
    core.warning(`#${number}: mergeability still unknown; label left unchanged`);
    return;
  }
  await syncLabel(github, core, owner, repo, number, pull.labels, state);
  if (state === "conflict") {
    core.setFailed(
      `This pull request has merge conflicts with ${pull.base.ref}. ` +
        `Merge ${pull.base.ref} into your branch (or rebase onto it), resolve the conflicts and push.`,
    );
  }
};

module.exports.classify = classify;
module.exports.LABEL = LABEL;
