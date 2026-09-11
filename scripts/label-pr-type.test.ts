#!/usr/bin/env tsx
/**
 * Unit tests for the extracted github-script handler used by the
 * "Label PR by type" workflow:
 *   .github/scripts/label-pr-type.cjs
 *
 * Covers both the pure `parseTypeOfChanges` parser and the full handler
 * (label sync + validation), exercised with a recording GitHub client mock -
 * no network. Run with `npm test`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const script = require("../.github/scripts/label-pr-type.cjs");
const { parseTypeOfChanges } = script as {
  parseTypeOfChanges: (body: string | null | undefined) => {
    ticked: string[];
    malformed: string[];
    sectionFound: boolean;
  };
};

type Call = { method: string; args: unknown };

// A GitHub client mock that records addLabels/removeLabel calls.
function makeGithub() {
  const calls: Call[] = [];
  const github = {
    rest: {
      issues: {
        addLabels: async (args: unknown) => {
          calls.push({ method: "addLabels", args });
          return { data: {} };
        },
        removeLabel: async (args: unknown) => {
          calls.push({ method: "removeLabel", args });
          return { data: {} };
        },
      },
    },
  };
  return { github, calls };
}

function freshCore() {
  return {
    info: () => {},
    setFailed(m: string) {
      (this._failed as string[]).push(m);
    },
    _failed: [] as string[],
  };
}

// Builds the pull_request_target payload the handler reads, and runs it.
async function run(
  body: string | null,
  currentLabels: string[],
  user: { login: string; type: string } = { login: "someone", type: "User" }
) {
  const { github, calls } = makeGithub();
  const core = freshCore();
  const context = {
    repo: { owner: "esphome", repo: "esphome-devices" },
    payload: {
      pull_request: {
        number: 7,
        body,
        user,
        labels: currentLabels.map((name) => ({ name })),
      },
    },
  };
  await script({ github, context, core });
  return { calls, core };
}

const addedLabels = (calls: Call[]) =>
  calls
    .filter((c) => c.method === "addLabels")
    .flatMap((c) => (c.args as { labels: string[] }).labels);

const removedLabels = (calls: Call[]) =>
  calls.filter((c) => c.method === "removeLabel").map((c) => (c.args as { name: string }).name);

// The exact box text from .github/PULL_REQUEST_TEMPLATE.md, reproduced
// verbatim (including the em dash, which is upstream template text).
const NEW_DEVICE_BOX = "New device (a single device only — one device per pull request)";

function section(lines: string): string {
  return `# Brief description\n\n## Type of changes\n\n${lines}\n\n## Checklist:\n\n- [ ] x\n`;
}

// --- parseTypeOfChanges ------------------------------------------------------

test("parse: null body -> section not found", () => {
  const result = parseTypeOfChanges(null);
  assert.equal(result.sectionFound, false);
  assert.deepEqual(result.ticked, []);
  assert.deepEqual(result.malformed, []);
});

test("parse: undefined and empty body -> section not found", () => {
  assert.equal(parseTypeOfChanges(undefined).sectionFound, false);
  assert.equal(parseTypeOfChanges("").sectionFound, false);
});

test("parse: section present with only unticked boxes -> nothing ticked or malformed", () => {
  const body = section("- [ ] New device\n- [ ] Other");
  const result = parseTypeOfChanges(body);
  assert.equal(result.sectionFound, true);
  assert.deepEqual(result.ticked, []);
  assert.deepEqual(result.malformed, []);
});

test("parse: CRLF body with a clean uppercase tick", () => {
  const body = "## Type of changes\r\n- [X] Other\r\n\r\n## Checklist:\r\n- [ ] x\r\n";
  const result = parseTypeOfChanges(body);
  assert.equal(result.sectionFound, true);
  assert.deepEqual(result.ticked, ["Other"]);
  assert.deepEqual(result.malformed, []);
});

test("parse: tab-indented asterisk bullet is recognised", () => {
  const body = section("\t* [x] General cleanup");
  const result = parseTypeOfChanges(body);
  assert.deepEqual(result.ticked, ["General cleanup"]);
  assert.deepEqual(result.malformed, []);
});

const MALFORMED_VARIANTS = ["[ x]", "[x ]", "[ x ]", "[X ]", "[]", "[✓]"];

for (const variant of MALFORMED_VARIANTS) {
  test(`parse: malformed checkbox ${variant} reported as the full trimmed line`, () => {
    const line = `- ${variant} New device`;
    const body = section(line);
    const result = parseTypeOfChanges(body);
    assert.deepEqual(result.ticked, []);
    assert.deepEqual(result.malformed, [line]);
  });
}

test("parse: checkboxes outside the section are ignored", () => {
  const body =
    "## Type of changes\n\n- [ ] New device\n\n" +
    "## Checklist:\n\n- [x] Adding a new device adds a single device only.\n";
  const result = parseTypeOfChanges(body);
  assert.equal(result.sectionFound, true);
  assert.deepEqual(result.ticked, []);
  assert.deepEqual(result.malformed, []);
});

test("parse: section at the end of the body with no trailing heading", () => {
  const body = "## Type of changes\n\n- [x] Other\n";
  const result = parseTypeOfChanges(body);
  assert.equal(result.sectionFound, true);
  assert.deepEqual(result.ticked, ["Other"]);
});

// --- handler: valid selections ----------------------------------------------

test("handler: a single valid tick labels new-device", async () => {
  const body = section(`- [x] ${NEW_DEVICE_BOX}`);
  const { calls, core } = await run(body, []);
  assert.deepEqual(addedLabels(calls), ["new-device"]);
  assert.deepEqual(removedLabels(calls), []);
  assert.equal(core._failed.length, 0);
});

test("handler: label already present -> no add, already in sync, no failure", async () => {
  const body = section(`- [x] ${NEW_DEVICE_BOX}`);
  const { calls, core } = await run(body, ["new-device"]);
  assert.equal(calls.filter((c) => c.method === "addLabels").length, 0);
  assert.equal(calls.filter((c) => c.method === "removeLabel").length, 0);
  assert.equal(core._failed.length, 0);
});

test("handler: switching selection adds the new label and removes the old one", async () => {
  const body = section("- [x] General cleanup");
  const { calls, core } = await run(body, ["update-device"]);
  assert.deepEqual(addedLabels(calls), ["cleanup"]);
  assert.deepEqual(removedLabels(calls), ["update-device"]);
  assert.equal(core._failed.length, 0);
});

test("handler: duplicate ticks mapping to the same label count once, no failure", async () => {
  const body = section("- [x] Other\n- [X] Other thing");
  const { calls, core } = await run(body, []);
  assert.deepEqual(addedLabels(calls), ["other"]);
  assert.equal(core._failed.length, 0);
});

// --- handler: invalid selections ---------------------------------------------

test("handler: no tick removes a previously managed label; non-managed untouched", async () => {
  const body = section("- [ ] New device\n- [ ] Other");
  const { calls, core } = await run(body, ["new-device", "made-for-esphome"]);
  assert.deepEqual(addedLabels(calls), []);
  assert.deepEqual(removedLabels(calls), ["new-device"]);
  assert.equal(core._failed.length, 1);
  assert.match(core._failed[0], /No "Type of changes" box is ticked/);
});

test("handler: two ticks fails with both names and adds nothing", async () => {
  const body = section(`- [x] ${NEW_DEVICE_BOX}\n- [x] Other`);
  const { calls, core } = await run(body, []);
  assert.deepEqual(addedLabels(calls), []);
  assert.equal(core._failed.length, 1);
  assert.match(core._failed[0], /Multiple "Type of changes" boxes are ticked/);
  assert.match(core._failed[0], /new-device/);
  assert.match(core._failed[0], /other/);
});

test("handler: malformed tick fails, and a valid tick elsewhere is not labeled", async () => {
  const body = section(`- [ x] Other\n- [x] ${NEW_DEVICE_BOX}`);
  const { calls, core } = await run(body, []);
  assert.deepEqual(addedLabels(calls), []);
  assert.equal(core._failed.length, 1);
  assert.match(core._failed[0], /Malformed checkbox: `- \[ x\] Other`/);
});

test("handler: unrecognised ticked text fails with the right message", async () => {
  const body = section("- [x] Something else entirely");
  const { calls, core } = await run(body, []);
  assert.deepEqual(addedLabels(calls), []);
  assert.equal(core._failed.length, 1);
  assert.match(core._failed[0], /Unrecognised ticked box: `Something else entirely`/);
});

test("handler: missing section fails with no-section message", async () => {
  const body = "# Brief description\n\nNo template here.\n";
  const { calls, core } = await run(body, []);
  assert.deepEqual(addedLabels(calls), []);
  assert.equal(core._failed.length, 1);
  assert.match(core._failed[0], /has no "## Type of changes" section/);
});

test("handler: missing body (null) fails the same as a missing section", async () => {
  const { calls, core } = await run(null, []);
  assert.deepEqual(addedLabels(calls), []);
  assert.equal(core._failed.length, 1);
  assert.match(core._failed[0], /has no "## Type of changes" section/);
});

test("handler: an invalid description still strips a previously applied label", async () => {
  const body = section(`- [x] ${NEW_DEVICE_BOX}\n- [x] Other`);
  const { calls, core } = await run(body, ["new-device"]);
  assert.deepEqual(addedLabels(calls), []);
  assert.deepEqual(removedLabels(calls), ["new-device"]);
  assert.equal(core._failed.length, 1);
});

// --- handler: bots -----------------------------------------------------------

test("handler: a bot-authored PR is skipped entirely, even with no template", async () => {
  const body = "Bumps foo from 1.0.0 to 1.1.0.";
  const bot = { login: "dependabot[bot]", type: "Bot" };
  const { calls, core } = await run(body, ["new-device"], bot);
  assert.deepEqual(calls, []);
  assert.equal(core._failed.length, 0);
});

test("handler: a payload without a user is validated normally", async () => {
  const { github, calls } = makeGithub();
  const core = freshCore();
  const context = {
    repo: { owner: "esphome", repo: "esphome-devices" },
    payload: { pull_request: { number: 7, body: null, labels: [] } },
  };
  await script({ github, context, core });
  assert.deepEqual(calls, []);
  assert.equal(core._failed.length, 1);
});
