#!/usr/bin/env tsx
/**
 * Unit tests for scripts/validate-esphome-configs.ts (target split, scaffold,
 * output trimming, scope). Run with `npm test`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  checkEsphome,
  checkImport,
  deviceDirsOf,
  isDownloadOnlyFailure,
  isStandalone,
  loadPage,
  sourceLine,
  trimEsphomeError,
  userScaffold,
} from "./validate-esphome-configs.ts";
import { parseNameStatus } from "./changed-paths.ts";

const fence = (attrs: string): string => `\`\`\`yaml ${attrs}\n\`\`\`\n`;
const CONFIG = "esphome:\n  name: plug\nesp8266:\n  board: esp01_1m\n";

function withDevice(files: Record<string, string>, fn: (dir: string, root: string) => void): void {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "validate-esphome-test-"));
  const dir = path.join(root, "Plug");
  fs.mkdirSync(dir);
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content);
  try {
    fn(dir, root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const targetCases: {
  name: string;
  md: string;
  files: Record<string, string>;
  targets: [string, string | null][] | null;
  finding?: RegExp;
}[] = [
  {
    name: "config.yaml stands alone",
    md: fence("file=config.yaml"),
    files: { "config.yaml": CONFIG },
    targets: [["config.yaml", null]],
  },
  {
    name: "a quoted file= reference is a target",
    md: fence('file="config.yaml"') + fence("file='extra.yaml'"),
    files: { "config.yaml": CONFIG, "extra.yaml": "sensor: []\n" },
    targets: [
      ["config.yaml", null],
      ["extra.yaml", "config.yaml"],
    ],
  },
  {
    name: "a file with esphome: name stands alone, others merge onto config.yaml",
    md: fence("file=full.yaml") + fence("file=config.yaml") + fence("file=extra.yaml"),
    files: {
      "config.yaml": CONFIG,
      "full.yaml": CONFIG,
      "extra.yaml": "esphome:\n  platformio_options: {}\n",
    },
    targets: [
      ["config.yaml", null],
      ["full.yaml", null],
      ["extra.yaml", "config.yaml"],
    ],
  },
  {
    name: "a fragment without a config.yaml on disk is a finding",
    md: fence("file=config.yaml") + fence("file=extra.yaml"),
    files: { "extra.yaml": "sensor: []\n" },
    targets: [],
    finding: /no `config.yaml` to merge it onto/,
  },
  {
    name: "a file= target outside the page folder is a notice, not dropped",
    md: fence("file=configs/plug.yaml"),
    files: {},
    targets: [],
    finding: /`configs\/plug.yaml` is not beside index.md/,
  },
  {
    name: "a page with only url= and inline fences is out of scope",
    md: fence("url=https://github.com/o/r/blob/main/x.yaml") + "```yaml inline\nlogger:\n```\n",
    files: {},
    targets: null,
  },
];

for (const c of targetCases) {
  test(`targets: ${c.name}`, () => {
    withDevice({ "index.md": `---\ntitle: Plug\n---\n\n${c.md}`, ...c.files }, (dir, root) => {
      const page = loadPage(dir, root);
      if (c.targets === null) {
        assert.equal(page, null);
        return;
      }
      assert.ok(page);
      assert.deepEqual(
        page.targets.map((t) => [t.file, t.mergeOnto]),
        c.targets
      );
      if (c.finding) assert.match(page.findings[0].message, c.finding);
      else assert.deepEqual(page.findings, []);
    });
  });
}

test("isStandalone needs esphome: name", () => {
  assert.equal(isStandalone({ esphome: { name: "x" } }), true);
  assert.equal(isStandalone({ esphome: { platformio_options: {} } }), false);
  assert.equal(isStandalone(undefined), false);
});

const scaffoldCases: [string, unknown, unknown, boolean][] = [
  ["no network anywhere adds Wi-Fi", { esp8266: {} }, { sensor: [] }, true],
  ["config.yaml with Wi-Fi", { wifi: { ap: {} } }, {}, false],
  ["config.yaml with ethernet", { ethernet: {} }, {}, false],
  ["an ethernet fragment", { esp32: {} }, { ethernet: { type: "W5500" } }, false],
];
for (const [name, base, fragment, wifi] of scaffoldCases) {
  test(`scaffold: ${name}`, () => {
    const out = userScaffold(base, fragment);
    assert.match(out, /^api:\nota:\n {2}- platform: esphome\n/);
    assert.equal(out.includes("wifi:"), wifi);
  });
}

test("device dirs include subfolder and deleted paths, not top-level docs", () => {
  const changes = parseNameStatus(
    [
      "M", "src/docs/devices/B-Dev/index.md",
      "D", "src/docs/devices/A-Dev/photo.jpg",
      "T", "src/docs/devices/C-Dev/resources/x.webp",
      "R100", "src/docs/devices/Old/index.md", "src/docs/devices/New/index.md",
      "M", "src/docs/devices/adding-devices.mdx",
      "",
    ].join("\0")
  );
  assert.deepEqual(changes[3], {
    status: "R",
    oldPath: "src/docs/devices/Old/index.md",
    path: "src/docs/devices/New/index.md",
  });
  assert.deepEqual(deviceDirsOf(changes.map((c) => c.path)), ["A-Dev", "B-Dev", "C-Dev", "New"]);
});

test("esphome output is trimmed to the Failed config block with temp paths removed", () => {
  const work = "/tmp/esphome-config-abc/Dev";
  const stdout = `INFO noise\nFailed config\n\nuart: [source ${work}/config.yaml:3]\n  bad id\n`;
  const trimmed = trimEsphomeError(stdout, "INFO Reading\n", work);
  assert.equal(trimmed, "Failed config\nuart: [source config.yaml:3]\n  bad id");
  assert.equal(trimEsphomeError("", "INFO x\nERROR boom\n", work), "ERROR boom");
  assert.equal(sourceLine(trimmed, "config.yaml"), 3);
  assert.equal(sourceLine(trimmed, "other.yaml"), undefined);
});

const FONT_FAILURE = ["font: [source config.yaml:3]", "  Could not download font"];
const downloadCases: [string, string[], boolean][] = [
  ["a download error in the only failing component", ["Failed config", ...FONT_FAILURE], true],
  [
    "a download error next to a schema error in another component",
    ["Failed config", ...FONT_FAILURE, "sensor: [source config.yaml:9]", "  Invalid key"],
    false,
  ],
  ["a logged fetch line beside a real error", ["WARNING ConnectionError fetching", "ERROR Traceback"], false],
  ["a download error line beside a crash", ["ERROR ConnectionError fetching", "ERROR Traceback"], false],
  ["an unrelated 'failed to resolve' message", ["Failed config", "sensor: [source config.yaml:4]", "  Failed to resolve ID 'x'"], false],
  ["an error line that is a download failure", ["ERROR Failed to resolve fonts.gstatic.com"], true],
];

for (const [name, lines, expected] of downloadCases) {
  test(`download-only: ${name}`, () => assert.equal(isDownloadOnlyFailure(lines), expected));
}

// A stand-in executable that prints *output* and exits with *status*.
function fakeBin(status: number, output = "Failed config"): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fake-bin-"));
  const bin = path.join(dir, "fake");
  fs.writeFileSync(bin, `#!/bin/sh\ncat <<'OUT'\n${output}\nOUT\nexit ${status}\n`, { mode: 0o755 });
  return bin;
}

async function esphomeFindings(files: Record<string, string>, status: number, output?: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "validate-esphome-test-"));
  const dir = path.join(root, "Plug");
  fs.mkdirSync(dir);
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content);
  try {
    const page = loadPage(dir, root);
    assert.ok(page);
    await checkEsphome(page, { bin: fakeBin(status, output), timeoutMs: 10_000, limit: (fn) => fn() });
    return page.findings.map((f) => ({ level: f.level, file: path.basename(f.file), message: f.message }));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("the sandbox's timeout exit (124) is an inconclusive warning, not a config error", async () => {
  const findings = await esphomeFindings(
    { "index.md": fence("file=config.yaml"), "config.yaml": CONFIG },
    124
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].level, "warning");
  assert.match(findings[0].message, /time limit; inconclusive/);
});

test("a memory or process kill in the sandbox (137) is an inconclusive warning", async () => {
  const findings = await esphomeFindings({ "index.md": fence("file=config.yaml"), "config.yaml": CONFIG }, 137);
  assert.equal(findings[0].level, "warning");
  assert.match(findings[0].message, /memory or process limit; inconclusive/);
});

test("docker failing to start the sandbox (125) is fatal, not a config error", async () => {
  await assert.rejects(
    esphomeFindings({ "index.md": fence("file=config.yaml"), "config.yaml": CONFIG }, 125),
    /sandbox could not run esphome/
  );
});

test("an add-on skipped because its base failed gets a notice", async () => {
  const findings = await esphomeFindings(
    {
      "index.md": fence("file=config.yaml") + fence("file=extra.yaml"),
      "config.yaml": CONFIG,
      "extra.yaml": "sensor: []\n",
    },
    1
  );
  const extra = findings.find((f) => f.file === "extra.yaml");
  assert.equal(extra?.level, "notice");
  assert.match(extra?.message ?? "", /not validated: `config.yaml` did not validate/);
});

test("an add-on skipped because its base was inconclusive gets a warning", async () => {
  const findings = await esphomeFindings(
    {
      "index.md": fence("file=config.yaml") + fence("file=extra.yaml"),
      "config.yaml": CONFIG,
      "extra.yaml": "sensor: []\n",
    },
    1,
    ["Failed config", "", ...FONT_FAILURE].join("\n")
  );
  const extra = findings.find((f) => f.file === "extra.yaml");
  assert.equal(extra?.level, "warning");
  assert.match(extra?.message ?? "", /`config.yaml` could not be validated/);
});

test("a logged fetch failure doesn't downgrade a real Failed config error", async () => {
  const output = "WARNING ConnectionError fetching a font\nFailed config\n\nsensor: [unknown]: Invalid key";
  const findings = await esphomeFindings(
    { "index.md": fence("file=config.yaml"), "config.yaml": CONFIG },
    1,
    output
  );
  assert.equal(findings[0].level, "error");
});

test("a page the importer returns no row for is an import error", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "validate-esphome-test-"));
  const pages = ["Plug-A", "Plug-B"].map((name) => {
    const dir = path.join(root, name);
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, "index.md"), fence("file=config.yaml"));
    fs.writeFileSync(path.join(dir, "config.yaml"), CONFIG);
    const page = loadPage(dir, root);
    assert.ok(page);
    return page;
  });
  const prev = process.env.DEVICE_BUILDER_CMD;
  process.env.DEVICE_BUILDER_CMD = fakeBin(0, '[{"device": "Plug-A", "imported": true, "reason": null}]');
  try {
    await checkImport(pages, root);
  } finally {
    if (prev === undefined) delete process.env.DEVICE_BUILDER_CMD;
    else process.env.DEVICE_BUILDER_CMD = prev;
    fs.rmSync(root, { recursive: true, force: true });
  }
  assert.deepEqual(pages[0].findings, []);
  assert.match(pages[1].findings[0]?.message ?? "", /returned no result for this page/);
});

test("a malformed importer row is fatal, not read as a successful import", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "validate-esphome-test-"));
  const dir = path.join(root, "Plug-A");
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, "index.md"), fence("file=config.yaml"));
  fs.writeFileSync(path.join(dir, "config.yaml"), CONFIG);
  const page = loadPage(dir, root);
  assert.ok(page);
  const prev = process.env.DEVICE_BUILDER_CMD;
  process.env.DEVICE_BUILDER_CMD = fakeBin(0, '[{"device": "Plug-A", "imported": "false", "reason": null}]');
  try {
    await assert.rejects(checkImport([page], root), /unexpected row/);
  } finally {
    if (prev === undefined) delete process.env.DEVICE_BUILDER_CMD;
    else process.env.DEVICE_BUILDER_CMD = prev;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
