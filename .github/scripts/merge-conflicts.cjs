// Keeps the `has-conflicts` label and a "Merge conflicts" check run on the PR
// head in sync with whether each pull request merges cleanly into its base.
//
// GitHub computes mergeability lazily: the first read after a base or head
// change returns UNKNOWN and starts the computation. UNKNOWN PRs are re-read
// after each delay below; one still UNKNOWN after the last is left unchanged.
// Labels and check runs are only written when they disagree with the state.

const { removeLabelIfPresent } = require("./labels.cjs");
const { promote } = require("./mfe-promote.cjs");

const LABEL = "has-conflicts";
const CHECK_NAME = "Merge conflicts";
const GITHUB_ACTIONS_APP_ID = 15368;
const PAGE_SIZE = 50;
const RETRY_DELAYS_MS = [3_000, 5_000, 10_000, 20_000];
// Spaces out every write after the first to stay under GitHub's secondary
// rate limit (about 80 content-creating requests a minute).
const WRITE_PACING_MS = 1_000;
const MFE_LABEL = "made-for-esphome";

const PR_FRAGMENT = `fragment Pr on PullRequest {
  number
  state
  headRefOid
  baseRefName
  mergeable
  labels(first: 20) { nodes { name } }
  commits(last: 1) {
    nodes {
      commit {
        oid
        checkSuites(first: 5, filterBy: { appId: ${GITHUB_ACTIONS_APP_ID}, checkName: "${CHECK_NAME}" }) {
          nodes { checkRuns(last: 1, filterBy: { checkName: "${CHECK_NAME}" }) { nodes { databaseId conclusion } } }
        }
      }
    }
  }
}`;

const OPEN_PRS_QUERY = `query ($owner: String!, $repo: String!, $base: String!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    pullRequests(states: OPEN, baseRefName: $base, first: ${PAGE_SIZE}, after: $cursor) {
      nodes { ...Pr }
      pageInfo { hasNextPage endCursor }
    }
  }
}
${PR_FRAGMENT}`;

async function listOpen(github, owner, repo, base) {
  const pulls = [];
  let cursor = null;
  do {
    const { repository } = await github.graphql(OPEN_PRS_QUERY, { owner, repo, base, cursor });
    const page = repository.pullRequests;
    pulls.push(...page.nodes);
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);
  return pulls;
}

async function readByNumber(github, owner, repo, numbers) {
  const pulls = [];
  for (let i = 0; i < numbers.length; i += PAGE_SIZE) {
    const fields = numbers
      .slice(i, i + PAGE_SIZE)
      .map((n) => `pr${n}: pullRequest(number: ${n}) { ...Pr }`)
      .join("\n");
    const { repository } = await github.graphql(
      `query ($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          ${fields}
        }
      }
      ${PR_FRAGMENT}`,
      { owner, repo },
    );
    pulls.push(...Object.values(repository).filter(Boolean));
  }
  return pulls;
}

// Re-reads only the UNKNOWN PRs until they settle or the delays run out.
async function settle(github, owner, repo, pulls, sleep) {
  const settled = [];
  for (let round = 0; ; round++) {
    const unknown = [];
    for (const pull of pulls) {
      if (pull.state !== "OPEN") continue;
      (pull.mergeable === "UNKNOWN" ? unknown : settled).push(pull);
    }
    if (unknown.length === 0 || round === RETRY_DELAYS_MS.length) return { settled, unknown };
    await sleep(RETRY_DELAYS_MS[round]);
    pulls = await readByNumber(github, owner, repo, unknown.map((pull) => pull.number));
  }
}

function headCheckRun(pull) {
  const commit = pull.commits.nodes[0]?.commit;
  if (!commit || commit.oid !== pull.headRefOid) return null;
  const runs = commit.checkSuites.nodes.flatMap((suite) => suite.checkRuns.nodes);
  return runs.sort((a, b) => b.databaseId - a.databaseId)[0] ?? null;
}

// Resolves immediately the first time, then after WRITE_PACING_MS.
function makePacer(sleep) {
  let first = true;
  return async () => {
    if (!first) await sleep(WRITE_PACING_MS);
    first = false;
  };
}

const hasLabel = (pull, name) => pull.labels.nodes.some((label) => label.name === name);
const conclusionOf = (pull) => (pull.mergeable === "CONFLICTING" ? "failure" : "success");

// The check run is keyed by head SHA alone, so it is only published for PRs on
// the default branch: a PR into another base sharing that SHA can't clobber it.
function wantsWrite(pull, defaultBranch) {
  const conflict = pull.mergeable === "CONFLICTING";
  if (conflict !== hasLabel(pull, LABEL)) return true;
  if (pull.baseRefName !== defaultBranch) return false;
  return headCheckRun(pull)?.conclusion !== conclusionOf(pull).toUpperCase();
}

// Syncs one settled PR's label and head check; returns whether the check changed.
async function check({ github, core, owner, repo, pace, defaultBranch }, listed) {
  if (!wantsWrite(listed, defaultBranch)) return false;
  // Another run may have written since the read; decide on one taken just before writing.
  const [pull] = await readByNumber(github, owner, repo, [listed.number]);
  if (!pull || pull.state !== "OPEN" || pull.mergeable === "UNKNOWN" || pull.headRefOid !== listed.headRefOid) {
    core.info(`#${listed.number}: changed while syncing; left to the next run`);
    return false;
  }
  const { number, baseRefName: base } = pull;
  const conflict = pull.mergeable === "CONFLICTING";

  const labelled = hasLabel(pull, LABEL);
  if (conflict && !labelled) {
    await pace();
    await github.rest.issues.addLabels({ owner, repo, issue_number: number, labels: [LABEL] });
    core.info(`#${number}: added ${LABEL}`);
  } else if (!conflict && labelled) {
    await pace();
    await removeLabelIfPresent(github, { owner, repo, issue_number: number, name: LABEL });
    core.info(`#${number}: removed ${LABEL}`);
  }

  if (base !== defaultBranch) return false;
  const conclusion = conclusionOf(pull);
  const existing = headCheckRun(pull);
  if (existing?.conclusion === conclusion.toUpperCase()) return false;
  const run = {
    owner,
    repo,
    name: CHECK_NAME,
    status: "completed",
    conclusion,
    output: conflict
      ? {
          title: `Conflicts with ${base}`,
          summary: `Merge ${base} into your branch (or rebase onto it), resolve the conflicts and push.`,
        }
      : { title: `No conflicts with ${base}`, summary: `This branch merges cleanly into ${base}.` },
  };
  await pace();
  if (existing) {
    await github.rest.checks.update({ ...run, check_run_id: existing.databaseId });
  } else {
    await github.rest.checks.create({ ...run, head_sha: pull.headRefOid });
  }
  core.info(`#${number}: ${CHECK_NAME} check set to ${conclusion}`);
  return true;
}

module.exports = async ({ github, context, core, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) => {
  const { owner, repo } = context.repo;
  const defaultBranch = context.payload.repository.default_branch;
  const pulls =
    context.eventName === "push"
      ? await listOpen(github, owner, repo, context.ref.replace(/^refs\/heads\//, ""))
      : await readByNumber(github, owner, repo, [context.payload.pull_request.number]);
  const { settled, unknown } = await settle(github, owner, repo, pulls, sleep);
  // A clean new head re-runs CI and the review, whose completion promotes. A
  // sweep or base change moves the check on a head they already judged, and a
  // conflict blocks those pull_request workflows, so both re-run it here (a
  // failing check only ever demotes).
  const repromote = context.eventName === "push" || context.payload.action === "edited";
  const pace = makePacer(sleep);
  for (const pull of settled) {
    const changed = await check({ github, core, owner, repo, pace, defaultBranch }, pull);
    const conflict = pull.mergeable === "CONFLICTING";
    if (changed && (repromote || conflict) && hasLabel(pull, MFE_LABEL)) {
      await pace();
      await promote({ github, core, owner, repo, prNumber: pull.number });
    }
  }
  for (const pull of unknown) {
    core.warning(`#${pull.number}: mergeability still unknown; label and check left unchanged`);
  }
};

module.exports.LABEL = LABEL;
module.exports.RETRY_DELAYS_MS = RETRY_DELAYS_MS;
module.exports.WRITE_PACING_MS = WRITE_PACING_MS;
