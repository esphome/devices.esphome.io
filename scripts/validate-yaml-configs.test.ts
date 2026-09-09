#!/usr/bin/env tsx
/**
 * Unit tests for the pure URL-allowlist helper in
 * scripts/validate-yaml-configs.ts. Run with:
 *
 *   npm test
 *
 * Uses Node's built-in test runner (node:test), so no test framework is
 * added to the project.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { isAllowedUpstreamUrl } from "./validate-yaml-configs.ts";

test("isAllowedUpstreamUrl accepts the canonical GitHub shapes", () => {
  assert.equal(
    isAllowedUpstreamUrl(
      "https://github.com/owner/repo/blob/main/path/to/main.yaml"
    ),
    true
  );
  assert.equal(
    isAllowedUpstreamUrl("https://github.com/owner/repo/raw/v1.2.3/cfg.yml"),
    true
  );
  assert.equal(
    isAllowedUpstreamUrl(
      "https://raw.githubusercontent.com/owner/repo/main/a/b.yaml"
    ),
    true
  );
  assert.equal(
    isAllowedUpstreamUrl(
      "https://raw.githubusercontent.com/owner/repo/refs/heads/dev/c.yaml"
    ),
    true
  );
  assert.equal(
    isAllowedUpstreamUrl(
      "https://github.com/owner/repo/blob/refs/tags/v9/d.yaml"
    ),
    true
  );
});

test("isAllowedUpstreamUrl accepts the canonical Codeberg shapes", () => {
  assert.equal(
    isAllowedUpstreamUrl(
      "https://codeberg.org/owner/repo/src/branch/main/path/to/main.yaml"
    ),
    true
  );
  assert.equal(
    isAllowedUpstreamUrl(
      "https://codeberg.org/owner/repo/src/tag/v1.2.3/cfg.yml"
    ),
    true
  );
  assert.equal(
    isAllowedUpstreamUrl(
      "https://codeberg.org/owner/repo/raw/commit/abcdef0123/a/b.yaml"
    ),
    true
  );
});

test("isAllowedUpstreamUrl accepts the canonical GitLab shapes", () => {
  assert.equal(
    isAllowedUpstreamUrl(
      "https://gitlab.com/owner/repo/-/blob/main/path/to/main.yaml"
    ),
    true
  );
  assert.equal(
    isAllowedUpstreamUrl(
      "https://gitlab.com/group/sub/proj/-/raw/main/a/b.yaml"
    ),
    true
  );
});

test("isAllowedUpstreamUrl rejects everything else", () => {
  for (const bad of [
    "https://github.com/owner/repo", // repo root, too few segments
    "https://github.com/owner/repo/tree/main/dir", // directory, not blob/raw
    "https://github.com/owner/repo/blob/main/README.md", // not yaml
    "https://raw.githubusercontent.com/owner/repo/main", // no path past the ref
    "https://codeberg.org/o/r/src/main/x.yaml", // legacy Gitea shape, no branch/tag/commit segment
    "https://codeberg.org/o/r/raw/main/x.yaml", // legacy Gitea shape, no branch/tag/commit segment
    "https://codeberg.org/o/r/src/branch/main/dir", // not yaml
    "https://codeberg.org/o/r/src/branch/main", // no path past the ref
    "https://codeberg.org/o/r/src/blob/main/x.yaml", // wrong type segment
    "http://codeberg.org/o/r/src/branch/main/x.yaml", // not https
    "https://gitlab.com/o/r/blob/main/x.yaml", // no `-` separator
    "https://gitlab.com/o/-/blob/main/x.yaml", // `-` too early (index 1)
    "https://gitlab.com/o/r/-/tree/main/x.yaml", // wrong type segment
    "https://gitlab.com/o/r/-/raw/main", // no path past the ref
    "https://gitlab.com/o/r/-/raw/main/x.txt", // not yaml
    "https://bitbucket.org/o/r/raw/main/x.yaml", // unknown host
    "not a url", // invalid URL string
  ]) {
    assert.equal(isAllowedUpstreamUrl(bad), false, bad);
  }
});
