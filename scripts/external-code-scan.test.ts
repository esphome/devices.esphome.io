#!/usr/bin/env tsx
/** Unit tests for scripts/external-code-scan.ts. Run with `npm test`. */
import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { scanExternalCode } from "./external-code-scan.ts";

const BASE = "esphome:\n  name: plug\nesp8266:\n  board: esp01_1m\n";

const cases: { name: string; files: Record<string, string>; reasons: RegExp[] }[] = [
  { name: "a plain hardware config is clean", files: { "config.yaml": BASE }, reasons: [] },
  {
    name: "a local package include inside the folder is clean",
    files: {
      "config.yaml": `${BASE}packages:\n  extra: !include extra.yaml\n`,
      "extra.yaml": "sensor:\n  - platform: uptime\n    name: Uptime\n",
    },
    reasons: [],
  },
  {
    name: "a mapping-form local include is clean",
    files: {
      "config.yaml": `${BASE}packages:\n  - !include { file: extra.yaml, vars: { n: 1 } }\n`,
      "extra.yaml": "logger:\n",
    },
    reasons: [],
  },
  {
    name: "external_components is refused",
    files: {
      "config.yaml": `${BASE}external_components:\n  - source: github://owner/repo\n`,
    },
    reasons: [/uses `external_components:`/, /git source/],
  },
  {
    name: "a local external_components path is refused",
    files: { "config.yaml": `${BASE}external_components:\n  - source:\n      type: local\n      path: x\n` },
    reasons: [/uses `external_components:`/],
  },
  {
    name: "a remote package is refused",
    files: { "config.yaml": `${BASE}packages:\n  board: github://owner/repo/board.yaml@main\n` },
    reasons: [/git source/, /not a local `!include`/],
  },
  {
    name: "a url package is refused",
    files: { "config.yaml": `${BASE}packages:\n  remote:\n    url: https://github.com/o/r\n    files: [a.yaml]\n` },
    reasons: [/not a local `!include`/, /has a remote package/],
  },
  {
    name: "a remote package map behind a local include is refused",
    files: {
      "config.yaml": `${BASE}packages: !include pkgs.yaml\n`,
      "pkgs.yaml": "remote:\n  url: https://github.com/o/r\n  files: [a.yaml]\n",
    },
    reasons: [/`pkgs.yaml` has a remote package/],
  },
  {
    name: "an include escaping the folder is refused",
    files: { "config.yaml": `${BASE}sensor: !include ../other/sensors.yaml\n` },
    reasons: [/outside the device folder/],
  },
  {
    name: "external_components inside an included file is refused",
    files: {
      "config.yaml": `${BASE}packages:\n  extra: !include extra.yaml\n`,
      "extra.yaml": "external_components:\n  - source: components\n",
    },
    reasons: [/`extra.yaml` uses `external_components:`/],
  },
  {
    name: "a Python file in the folder is refused",
    files: { "config.yaml": BASE, "custom_components/x/__init__.py": "" },
    reasons: [/`custom_components\/` directory/],
  },
  {
    name: "a stray Python file is refused",
    files: { "config.yaml": BASE, "helper.py": "" },
    reasons: [/Python file \(`helper.py`\)/],
  },
];

for (const c of cases) {
  test(`scan: ${c.name}`, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scan-test-"));
    try {
      for (const [name, content] of Object.entries(c.files)) {
        fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
        fs.writeFileSync(path.join(dir, name), content);
      }
      const reasons = scanExternalCode(dir, ["config.yaml"]);
      assert.equal(reasons.length, c.reasons.length, reasons.join("\n"));
      for (const re of c.reasons) assert.ok(reasons.some((r) => re.test(r)), `${re} in ${reasons}`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}
