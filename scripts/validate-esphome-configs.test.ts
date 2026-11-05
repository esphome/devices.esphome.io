#!/usr/bin/env tsx
/**
 * Unit tests for scripts/validate-esphome-configs.ts: the Device Builder
 * import rules, the fragment-vs-standalone split and the changed-folder scope.
 * The `esphome config` run itself needs ESPHome and is not exercised here.
 * Run with:
 *
 *   npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  changedDeviceDirs,
  checkImport,
  configTargets,
  importerPrimaryFence,
  liftableComponents,
  loadPage,
  resolveBoard,
  resolveSubstitutions,
  sourceLine,
  trimEsphomeError,
  userScaffold,
} from "./validate-esphome-configs.ts";

const FRONTMATTER = "---\ntitle: Test Plug\ndate-published: 2025-01-01\ntype: plug\nstandard: eu\n---\n";
const IMAGE = '![Test Plug](plug.jpg "Test Plug")\n';
const CONFIG = [
  "esphome:",
  "  name: test-plug",
  "esp8266:",
  "  board: esp01_1m",
  "switch:",
  "  - platform: gpio",
  "    name: Relay",
  "    pin: GPIO12",
  "",
].join("\n");

function makeDevice(files: Record<string, string>): { root: string; dir: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "validate-esphome-test-"));
  const dir = path.join(root, "Test-Plug");
  fs.mkdirSync(dir);
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  return { root, dir };
}

function importErrors(files: Record<string, string>): string[] {
  const { root, dir } = makeDevice(files);
  try {
    const page = loadPage(dir, root);
    assert.ok(page);
    return checkImport(page).map((f) => `${f.level}: ${f.message}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const PAGE = `${FRONTMATTER}\n${IMAGE}\n\`\`\`yaml file=config.yaml\n\`\`\`\n`;

test("a hardware config.yaml page with a local image imports cleanly", () => {
  assert.deepEqual(importErrors({ "index.md": PAGE, "config.yaml": CONFIG, "plug.jpg": "x" }), []);
});

test("an inline snippet above config.yaml is what the importer would read", () => {
  const md = `${FRONTMATTER}\n${IMAGE}\n\`\`\`yaml inline\nlogger:\n  level: DEBUG\n\`\`\`\n\n\`\`\`yaml file=config.yaml\n\`\`\`\n`;
  const errors = importErrors({ "index.md": md, "config.yaml": CONFIG, "plug.jpg": "x" });
  assert.equal(errors.length, 2);
  assert.match(errors[0], /first yaml fence that parses as a mapping, which is an inline yaml fence/);
});

test("a non-mapping inline snippet above config.yaml is skipped like the importer does", () => {
  const md = `${FRONTMATTER}\n${IMAGE}\n\`\`\`yaml inline\n- just a list\n\`\`\`\n\n\`\`\`yaml file=config.yaml\n\`\`\`\n`;
  assert.deepEqual(importErrors({ "index.md": md, "config.yaml": CONFIG, "plug.jpg": "x" }), []);
});

test("missing or subfolder images are reported", () => {
  const noImage = importErrors({ "index.md": PAGE.replace(IMAGE, ""), "config.yaml": CONFIG });
  assert.equal(noImage.length, 1);
  assert.match(noImage[0], /embeds no local image/);
  const sub = importErrors({
    "index.md": PAGE.replace("(plug.jpg", "(images/plug.jpg"),
    "config.yaml": CONFIG,
  });
  assert.match(sub[0], /images in a subfolder are not picked up/);
  const missing = importErrors({ "index.md": PAGE, "config.yaml": CONFIG });
  assert.match(missing[0], /embeds no local image/);
});

test("a missing title fails", () => {
  const md = PAGE.replace("title: Test Plug\n", "");
  const errors = importErrors({ "index.md": md, "config.yaml": CONFIG, "plug.jpg": "x" });
  assert.match(errors[0], /frontmatter `title` is missing/);
});

test("a config without a SoC block fails, with a hint for packages", () => {
  const config = "packages:\n  board: github://owner/repo/board.yaml@main\n";
  const errors = importErrors({ "index.md": PAGE, "config.yaml": config, "plug.jpg": "x" });
  assert.match(errors[0], /no `esp32`, `esp8266`.*block.*through `packages:` cannot be imported/);
});

test("an ln882x page is a notice, not an error", () => {
  const config = "esphome:\n  name: x\nln882x:\n  board: wb02a\n";
  const md = PAGE.replace("standard: eu\n", "standard: eu\nboard: ln882x\n");
  const errors = importErrors({ "index.md": md, "config.yaml": config, "plug.jpg": "x" });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /^notice: .*does not handle `ln882x`/);
});

test("the board id must be concrete", () => {
  assert.equal(resolveBoard("esp8266", { board: "<REPLACEME>" }), null);
  assert.equal(resolveBoard("esp8266", {}), null);
  assert.equal(resolveBoard("esp8266", { board: "esp01_1m" }), "esp01_1m");
  assert.equal(resolveBoard("esp32", { variant: "ESP32-C3" }), "esp32-c3-devkitm-1");
  assert.equal(resolveBoard("esp32", { variant: "esp32x9" }), null);
  const errors = importErrors({
    "index.md": PAGE,
    "config.yaml": CONFIG.replace("  board: esp01_1m\n", "  framework: {}\n"),
    "plug.jpg": "x",
  });
  assert.match(errors[0], /`esp8266:` has no concrete `board:`/);
});

test("substitutions resolve before the board is read", () => {
  const resolved = resolveSubstitutions({
    substitutions: { board: "esp01_1m" },
    esp8266: { board: "${board}" },
  });
  assert.deepEqual(resolved, { esp8266: { board: "esp01_1m" } });
});

test("liftable components skip template, lambda and skeleton items", () => {
  assert.deepEqual(
    liftableComponents({
      sensor: [
        { platform: "template", name: "x", lambda: "return 1;" },
        { platform: "adc", lambda: "return 1;", pin: "A0" },
        { platform: "uptime", name: "Uptime" },
        { platform: "adc", name: "Voltage", pin: "A0" },
      ],
      ethernet: { type: "LAN8720" },
    }),
    ["ethernet", "sensor.adc"]
  );
  const errors = importErrors({
    "index.md": PAGE,
    "config.yaml": "esphome:\n  name: x\nesp8266:\n  board: esp01_1m\n",
    "plug.jpg": "x",
  });
  assert.match(errors[0], /no hardware component the importer can lift/);
});

test("an ethernet block from a later fence is folded in like the importer does", () => {
  const { root, dir } = makeDevice({ "config.yaml": "esphome:\n  name: x\n" });
  try {
    const fences = [
      { info: " file=config.yaml", body: "", file: "config.yaml", line: 1 },
      { info: "", body: "ethernet:\n  type: LAN8720\n", file: null, line: 5 },
    ];
    const primary = importerPrimaryFence(fences, dir);
    assert.equal(primary?.fence.file, "config.yaml");
    assert.deepEqual(primary?.config.ethernet, { type: "LAN8720" });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("files with their own esphome name stand alone, the rest merge onto config.yaml", () => {
  const md = `${PAGE}\n\`\`\`yaml file=full.yaml\n\`\`\`\n\n\`\`\`yaml file=extra.yaml\n\`\`\`\n`;
  const { root, dir } = makeDevice({
    "index.md": md,
    "config.yaml": CONFIG,
    "full.yaml": CONFIG,
    "extra.yaml": "esphome:\n  platformio_options: {}\nsensor:\n  - platform: uptime\n",
  });
  try {
    const page = loadPage(dir, root);
    assert.ok(page);
    assert.deepEqual(configTargets(page).targets, [
      { file: "config.yaml", mergeOnto: null },
      { file: "full.yaml", mergeOnto: null },
      { file: "extra.yaml", mergeOnto: "config.yaml" },
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the user scaffold adds Wi-Fi only when config.yaml has no network", () => {
  assert.match(userScaffold({ esp8266: {} }), /wifi:/);
  assert.doesNotMatch(userScaffold({ ethernet: {} }), /wifi:/);
  assert.match(userScaffold({ wifi: { ap: {} } }), /^api:\nota:\n {2}- platform: esphome\n$/);
});

test("changed device dirs come from files directly inside a device folder", () => {
  assert.deepEqual(
    changedDeviceDirs(
      [
        "src/docs/devices/B-Dev/index.md",
        "src/docs/devices/A-Dev/config.yaml",
        "src/docs/devices/B-Dev/photo.jpg",
        "src/docs/devices/adding-devices.mdx",
        "src/docs/devices/C-Dev/resources/x.webp",
        "scripts/foo.ts",
      ].join("\n")
    ),
    ["A-Dev", "B-Dev"]
  );
});

test("esphome output is trimmed to the Failed config block with temp paths removed", () => {
  const work = "/tmp/esphome-config-abc/Dev";
  const stdout = `INFO noise\nFailed config\n\nuart: [source ${work}/config.yaml:3]\n  bad id\n`;
  assert.equal(
    trimEsphomeError(stdout, "INFO Reading\n", work),
    "Failed config\nuart: [source config.yaml:3]\n  bad id"
  );
  assert.equal(trimEsphomeError("", "INFO x\nERROR boom\n", work), "ERROR boom");
});

test("the annotation line comes from the file's own source marker", () => {
  const out = "Failed config\nuart: [source config.yaml:14]\nx: [source extra.yaml:3]\n";
  assert.equal(sourceLine(out, "extra.yaml"), 3);
  assert.equal(sourceLine(out, "config.yaml"), 14);
  assert.equal(sourceLine(out, "other.yaml"), undefined);
});
