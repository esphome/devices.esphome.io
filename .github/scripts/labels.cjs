// Label helpers shared by the github-script handlers.

// Removes a label, treating "not on the issue" (404) as already done.
async function removeLabelIfPresent(github, { owner, repo, issue_number, name }) {
  try {
    await github.rest.issues.removeLabel({ owner, repo, issue_number, name });
    return true;
  } catch (err) {
    if (err.status !== 404) throw err;
    return false;
  }
}

module.exports = { removeLabelIfPresent };
