// Finds the open pull request a `workflow_run` was triggered for, using only
// the run's own head repository, branch and commit. Artifact contents are not
// consulted: a PR whose head has moved on, or a run with no matching open PR,
// resolves to null so the caller does nothing.
//
// `workflow_run.pull_requests` is empty for fork PRs, so the PR is looked up
// by `owner:branch` and then pinned to the exact head SHA and repository.

async function findRunPullRequest({ github, context }) {
  const run = context.payload.workflow_run;
  const headRepo = run && run.head_repository;
  if (!headRepo || !headRepo.owner || !run.head_branch || !run.head_sha) return null;
  const pulls = await github.paginate(github.rest.pulls.list, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: "open",
    head: `${headRepo.owner.login}:${run.head_branch}`,
    per_page: 100,
  });
  return (
    pulls.find(
      (pr) =>
        pr.head.sha === run.head_sha &&
        pr.head.repo &&
        pr.head.repo.full_name === headRepo.full_name
    ) || null
  );
}

module.exports = { findRunPullRequest };
