#!/usr/bin/env tsx
/**
 * Unit tests for the URL extraction in scripts/check-links.ts.
 *
 * Only `extractUrls` is covered - the network side needs no test here, and
 * the part that produced false failures on the weekly report was always the
 * extraction. Run with `npm test`.
 *
 * Fixtures use `esphome.io` and `vendor-site.dev` rather than `example.com`
 * on purpose: `example.*` and `*.invalid` are in the SKIP list, so a fixture
 * built from them would pass every fence test without the fence code ever
 * running.
 */
import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { extractUrls } from "./check-links.ts";

let counter = 0;

/** Write `body` to a scratch .md file and return the URLs extracted from it. */
function urlsIn(body: string): string[] {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-links-"));
  const file = path.join(dir, `fixture-${counter++}.md`);
  fs.writeFileSync(file, body, "utf8");
  try {
    return [...extractUrls([file]).keys()].sort();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("finds a link in prose", () => {
  assert.deepEqual(urlsIn("See [the docs](https://esphome.io/docs) for more."), [
    "https://esphome.io/docs",
  ]);
});

test("reports the line a link is on", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-links-"));
  const file = path.join(dir, "lines.md");
  fs.writeFileSync(file, "# Title\n\ntext\n\nhttps://esphome.io/x\n", "utf8");
  try {
    assert.equal(extractUrls([file]).get("https://esphome.io/x")?.[0].line, 5);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("skips a URL inside a fenced code block", () => {
  // The shape that generates most of the noise: a device page is mostly one
  // YAML config block, and the URLs in it are placeholders or pinned citations.
  assert.deepEqual(
    urlsIn(
      [
        "Config:",
        "",
        "```yaml",
        "# Basic config, see https://vendor-site.dev/product-page",
        "sensor:",
        "  - platform: rest",
        "    resource: http://DEVICE_IP/json",
        "```",
      ].join("\n"),
    ),
    [],
  );
});

test("resumes checking after a fenced block closes", () => {
  assert.deepEqual(
    urlsIn(
      [
        "```yaml",
        "url: https://inside.vendor-site.dev/",
        "```",
        "",
        "https://after.vendor-site.dev/",
      ].join("\n"),
    ),
    ["https://after.vendor-site.dev/"],
  );
});

test("a tilde fence is a fence too", () => {
  assert.deepEqual(
    urlsIn(["~~~", "https://inside.vendor-site.dev/", "~~~"].join("\n")),
    [],
  );
});

test("a backtick run inside a tilde fence does not close it", () => {
  assert.deepEqual(
    urlsIn(
      ["~~~", "```", "https://inside.vendor-site.dev/", "```", "~~~"].join("\n"),
    ),
    [],
  );
});

test("a shorter fence inside a longer one does not close it", () => {
  // CommonMark: the closing fence must be at least as long as the opening one.
  assert.deepEqual(
    urlsIn(
      ["````", "```", "https://inside.vendor-site.dev/", "```", "````"].join(
        "\n",
      ),
    ),
    [],
  );
});

test("an indented fence still opens a block", () => {
  // Up to three spaces of indentation is still a fence, not an indented block.
  assert.deepEqual(
    urlsIn(["   ```", "   https://inside.vendor-site.dev/", "   ```"].join("\n")),
    [],
  );
});

test("skips a URL inside an inline code span", () => {
  assert.deepEqual(
    urlsIn(
      "Point the browser at `http://ip.address.of.device/calib.dat` first.",
    ),
    [],
  );
});

test("an inline span does not hide a link elsewhere on the same line", () => {
  assert.deepEqual(
    urlsIn(
      "Use `http://DEVICE_IP/json`, described at https://esphome.io/components/rest.",
    ),
    ["https://esphome.io/components/rest"],
  );
});

test("still skips reserved and placeholder hostnames", () => {
  // Unchanged behaviour, pinned so the fence work above cannot quietly
  // replace the SKIP list rather than adding to it.
  assert.deepEqual(
    urlsIn(
      [
        "http://localhost:8080/",
        "https://192.168.1.4/",
        "https://www.example.com/",
        "https://device.local/",
        "https://github.com/octocat/Hello-World",
      ].join("\n\n"),
    ),
    [],
  );
});

test("trailing punctuation is not part of the URL", () => {
  assert.deepEqual(urlsIn("Read https://esphome.io/page."), [
    "https://esphome.io/page",
  ]);
});

test("the same URL in two files records both locations", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-links-"));
  const a = path.join(dir, "a.md");
  const b = path.join(dir, "b.md");
  fs.writeFileSync(a, "https://esphome.io/shared\n", "utf8");
  fs.writeFileSync(b, "https://esphome.io/shared\n", "utf8");
  try {
    assert.equal(
      extractUrls([a, b]).get("https://esphome.io/shared")?.length,
      2,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
