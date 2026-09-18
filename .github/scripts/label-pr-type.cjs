// Reads the "Type of changes" section of the pull request description and
// applies the matching type label (new-device / update-device / remove-device
// / cleanup / other) based on which checkbox is ticked. The labels themselves
// already exist in the repo; this script only keeps them in sync.
//
// The section is also validated: a missing section, no ticked box, more than
// one ticked box, a malformed tick (stray spaces inside the brackets, e.g.
// `[ x]` or `[x ]`), or a ticked line that doesn't match any known box all
// fail the job so the author gets a clear message on what to fix. A failing
// run still syncs labels first - an invalid description clears any
// previously applied managed label, since it no longer represents a single
// valid selection.
//
// Pull requests opened by bots (Dependabot and friends) never carry the
// template, so they are skipped entirely rather than failed.
//
// Loaded by .github/workflows/label-pr-type.yml via actions/github-script.
// Exported as a function so it can be linted (`node --check`) and
// unit-tested with a mocked GitHub client. The pure parser is exported
// separately so its edge cases can be tested without a GitHub client at all.

// `match` is anchored at the start of the checkbox's label text so an
// unrelated box (e.g. "Another …") can't match by substring. Every entry is a
// "managed" label: unticking (or invalidating) the section removes it again.
const LABELS = [
  { name: "new-device", match: /^new device\b/i },
  { name: "update-device", match: /^update existing device\b/i },
  { name: "remove-device", match: /^removing a device\b/i },
  { name: "cleanup", match: /^general cleanup\b/i },
  { name: "other", match: /^other\b/i },
];

// Isolate the "Type of changes" section so checkboxes in other sections
// (e.g. the "Checklist:" block, which also mentions "new device") can never
// trigger a label. \r?\n throughout so CRLF bodies (common from the web
// editor) match.
const SECTION = /##\s*Type of changes\s*\r?\n([\s\S]*?)(?:\r?\n##\s|$)/i;

// Every list-item checkbox line in the section, however it's indented
// (spaces or tabs) or bulleted (-, *, +). Group 1 is the exact bracket
// content, so callers can tell a clean `x`/`X`/` ` apart from anything else
// (a stray space, an empty box, a non-ASCII tick, ...). Group 2 is the label
// text after the checkbox, trimmed of trailing whitespace.
const CHECKBOX_LINE = /^[ \t]*[-*+][ \t]*\[([^\]]*)\][ \t]*(.*?)[ \t]*\r?$/gm;

// Parses the "Type of changes" section of a pull request body.
//
// Returns `{ ticked, malformed, sectionFound }`:
//   - `sectionFound` is false when the section itself is missing (including
//     a null/undefined/empty body).
//   - `ticked` holds the label text of every cleanly ticked box (bracket
//     content exactly "x" or "X").
//   - `malformed` holds the full trimmed line of every checkbox whose
//     bracket content is neither a clean tick nor a clean blank " " (a stray
//     space, an empty box, a non-ASCII mark, ...).
function parseTypeOfChanges(body) {
  const ticked = [];
  const malformed = [];
  if (!body) {
    return { ticked, malformed, sectionFound: false };
  }
  const section = SECTION.exec(body);
  if (!section) {
    return { ticked, malformed, sectionFound: false };
  }

  const scoped = section[1];
  CHECKBOX_LINE.lastIndex = 0;
  let m;
  while ((m = CHECKBOX_LINE.exec(scoped)) !== null) {
    const mark = m[1];
    if (mark === " ") {
      continue;
    }
    if (mark === "x" || mark === "X") {
      ticked.push(m[2]);
      continue;
    }
    malformed.push(m[0].trim());
  }
  return { ticked, malformed, sectionFound: true };
}

module.exports = async ({ github, context, core }) => {
  const pr = context.payload.pull_request;
  const { owner, repo } = context.repo;

  // Bots (Dependabot, GitHub Actions, ...) don't fill in the pull request
  // template, so there is nothing to validate or label for them.
  if (pr.user && pr.user.type === "Bot") {
    core.info(`PR #${pr.number} was opened by ${pr.user.login} (a bot); nothing to do.`);
    return;
  }

  const { ticked, malformed, sectionFound } = parseTypeOfChanges(pr.body);

  // Map each ticked text to the label it drives. `matched` is the distinct
  // set of labels found; `unrecognised` is any ticked text that matched none
  // of them (a box that isn't from the current template).
  const matched = [];
  const unrecognised = [];
  for (const text of ticked) {
    const label = LABELS.find((l) => l.match.test(text));
    if (!label) {
      unrecognised.push(text);
    } else if (!matched.includes(label.name)) {
      matched.push(label.name);
    }
  }

  const problems = [];
  if (!sectionFound) {
    problems.push(
      'The pull request description has no "## Type of changes" section. ' +
        "Please restore the pull request template and tick exactly one box."
    );
  }
  for (const line of malformed) {
    problems.push(
      `Malformed checkbox: \`${line}\`. Tick a box as \`- [x]\` with no spaces inside the brackets.`
    );
  }
  for (const text of unrecognised) {
    problems.push(
      `Unrecognised ticked box: \`${text}\`. ` +
        "Only the boxes from the pull request template are accepted."
    );
  }
  const noneMatched = malformed.length === 0 && unrecognised.length === 0 && matched.length === 0;
  if (sectionFound && noneMatched) {
    problems.push('No "Type of changes" box is ticked. Please tick exactly one.');
  }
  if (matched.length > 1) {
    problems.push(
      `Multiple "Type of changes" boxes are ticked (${matched.join(", ")}). ` +
        "Please tick exactly one."
    );
  }

  // An invalid description doesn't represent a single valid selection, so it
  // clears any managed label a previous (valid) run applied.
  const desired = new Set(problems.length === 0 ? matched : []);
  core.info(`Desired type labels: ${[...desired].join(", ") || "(none)"}`);

  const managed = new Set(LABELS.map((l) => l.name));
  const current = new Set(pr.labels.map((l) => l.name));

  const toAdd = [...desired].filter((name) => !current.has(name));
  const toRemove = [...managed].filter((name) => current.has(name) && !desired.has(name));

  if (toAdd.length) {
    await github.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pr.number,
      labels: toAdd,
    });
    core.info(`Added: ${toAdd.join(", ")}`);
  }

  for (const name of toRemove) {
    await github.rest.issues.removeLabel({
      owner,
      repo,
      issue_number: pr.number,
      name,
    });
    core.info(`Removed: ${name}`);
  }

  if (!toAdd.length && !toRemove.length) {
    core.info("Labels already in sync.");
  }

  if (problems.length) {
    core.setFailed(
      'The "Type of changes" section of the pull request description is invalid:\n' +
        problems.map((p) => `- ${p}`).join("\n")
    );
  }
};

module.exports.parseTypeOfChanges = parseTypeOfChanges;
module.exports.LABELS = LABELS;
