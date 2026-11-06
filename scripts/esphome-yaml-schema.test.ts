#!/usr/bin/env tsx
/**
 * Unit tests for the shared ESPHome yaml schema in
 * src/lib/esphome-yaml-schema.ts, used by validate-yaml-configs and
 * review-made-for-esphome. The password and `!secret` checks depend on custom
 * tags parsing to tag-stamped strings, so a js-yaml upgrade that changes what
 * a tag resolver receives must fail here. Run with:
 *
 *   npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import * as yaml from "js-yaml";

import { ESPHOME_SCHEMA } from "../src/lib/esphome-yaml-schema.ts";

const load = (src: string) => yaml.load(src, { schema: ESPHOME_SCHEMA });

test("custom tags parse to tag-stamped strings", () => {
  const cases: Array<[string, unknown]> = [
    ["a: !secret k", "!secret k"],
    ["a: !secret", "!secret"],
    ["a: !secret 'k'", "!secret k"],
    ['a: !secret "k" # comment', "!secret k"],
    ["a: !secret k  # comment", "!secret k"],
    ["a: !lambda 'return 1;'", "!lambda return 1;"],
    ["a: !lambda |-\n  x;\n  y;\n", "!lambda x;\ny;"],
    ["a: !include common.yaml", "!include common.yaml"],
    ["a: !env HOME", "!env HOME"],
    ["a: !extend dev", "!extend dev"],
    ["a: !remove", "!remove"],
  ];
  for (const [src, expected] of cases) {
    assert.deepEqual(load(src), { a: expected }, src);
  }
});

test("custom tags work inside flow sequences", () => {
  assert.deepEqual(load("a: [!secret k, !secret]"), { a: ["!secret k", "!secret"] });
});

test("js-yaml 4 DEFAULT_SCHEMA extras still parse", () => {
  assert.deepEqual(load("base: &b {k: 1}\nchild:\n  <<: *b\n  j: 2\n"), {
    base: { k: 1 },
    child: { k: 1, j: 2 },
  });
  assert.ok((load("t: 2025-07-04") as { t: unknown }).t instanceof Date);
});

test("core scalars keep YAML 1.2 meanings", () => {
  assert.deepEqual(load("a: yes\nb: true\nc: 0x1F\nd: ~\n"), { a: "yes", b: true, c: 31, d: null });
});
