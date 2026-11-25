// Decides whether a maintainer currently approves a pull request's exact head
// commit. Only each reviewer's latest decisive review counts (approve, request
// changes, dismissed); comment-only reviews don't change it. So an approval
// later superseded by a change request no longer qualifies.

const MAINTAINER_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
const DECISIVE_STATES = new Set(["APPROVED", "CHANGES_REQUESTED", "DISMISSED"]);

function maintainerApproves(reviews, headSha) {
  const latest = new Map();
  for (const review of reviews) {
    if (!review.user || !DECISIVE_STATES.has(review.state)) continue;
    const prior = latest.get(review.user.login);
    if (!prior || new Date(review.submitted_at) >= new Date(prior.submitted_at)) {
      latest.set(review.user.login, review);
    }
  }
  return [...latest.values()].some(
    (r) =>
      r.state === "APPROVED" &&
      r.commit_id === headSha &&
      MAINTAINER_ASSOCIATIONS.has(r.author_association)
  );
}

module.exports = { maintainerApproves };
