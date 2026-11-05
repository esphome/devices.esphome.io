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
  deviceDirsOf,
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
