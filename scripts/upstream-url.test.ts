#!/usr/bin/env tsx
/**
 * Unit tests for the shared upstream-url grammar in src/lib/upstream-url.ts
 * - the single source of truth for the github.com/raw.githubusercontent.com/
 * codeberg.org/gitlab.com yaml URL shapes accepted by remark-yaml-include,
 * validate-yaml-configs, and review-made-for-esphome. Run with:
 *
 *   npm test
 *
 * Uses Node's built-in test runner (node:test), so no test framework is
 * added to the project.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { parseUpstreamUrl } from "../src/lib/upstream-url.ts";

test("parseUpstreamUrl accepts the canonical GitHub blob/raw shapes", () => {
  assert.deepEqual(
    parseUpstreamUrl("https://github.com/owner/repo/blob/main/path/to/main.yaml"),
    {
      host: "github.com",
      scheme: "github",
      owner: "owner",
      repo: "repo",
      ref: "main",
      filePath: "path/to/main.yaml",
    }
  );
  assert.deepEqual(
    parseUpstreamUrl("https://github.com/owner/repo/raw/v1.2.3/cfg.yml"),
    {
      host: "github.com",
      scheme: "github",
      owner: "owner",
      repo: "repo",
      ref: "v1.2.3",
      filePath: "cfg.yml",
    }
  );
});

test("parseUpstreamUrl accepts the canonical raw.githubusercontent.com shape", () => {
  assert.deepEqual(
    parseUpstreamUrl("https://raw.githubusercontent.com/owner/repo/main/a/b.yaml"),
    {
      host: "github.com",
      scheme: "github",
      owner: "owner",
      repo: "repo",
      ref: "main",
      filePath: "a/b.yaml",
    }
  );
});

test("parseUpstreamUrl accepts the explicit refs/heads and refs/tags forms on both GitHub hosts", () => {
  assert.deepEqual(
    parseUpstreamUrl("https://github.com/owner/repo/blob/refs/heads/dev/c.yaml"),
    {
      host: "github.com",
      scheme: "github",
      owner: "owner",
      repo: "repo",
      ref: "dev",
      filePath: "c.yaml",
    }
  );
  assert.deepEqual(
    parseUpstreamUrl("https://github.com/owner/repo/blob/refs/tags/v9/d.yaml"),
    {
      host: "github.com",
      scheme: "github",
      owner: "owner",
      repo: "repo",
      ref: "v9",
      filePath: "d.yaml",
    }
  );
  assert.deepEqual(
    parseUpstreamUrl("https://raw.githubusercontent.com/owner/repo/refs/heads/dev/c.yaml"),
    {
      host: "github.com",
      scheme: "github",
      owner: "owner",
      repo: "repo",
      ref: "dev",
      filePath: "c.yaml",
    }
  );
  assert.deepEqual(
    parseUpstreamUrl("https://raw.githubusercontent.com/owner/repo/refs/tags/v9/d.yaml"),
    {
      host: "github.com",
      scheme: "github",
      owner: "owner",
      repo: "repo",
      ref: "v9",
      filePath: "d.yaml",
    }
  );
});

test("parseUpstreamUrl accepts the canonical Codeberg src/branch, src/tag and raw/commit shapes", () => {
  assert.deepEqual(
    parseUpstreamUrl("https://codeberg.org/owner/repo/src/branch/main/path/to/main.yaml"),
    {
      host: "codeberg.org",
      scheme: "codeberg",
      owner: "owner",
      repo: "repo",
      ref: "main",
      filePath: "path/to/main.yaml",
    }
  );
  assert.deepEqual(
    parseUpstreamUrl("https://codeberg.org/owner/repo/src/tag/v1.2.3/cfg.yml"),
    {
      host: "codeberg.org",
      scheme: "codeberg",
      owner: "owner",
      repo: "repo",
      ref: "v1.2.3",
      filePath: "cfg.yml",
    }
  );
  assert.deepEqual(
    parseUpstreamUrl("https://codeberg.org/owner/repo/raw/commit/abcdef0123/a/b.yaml"),
    {
      host: "codeberg.org",
      scheme: "codeberg",
      owner: "owner",
      repo: "repo",
      ref: "abcdef0123",
      filePath: "a/b.yaml",
    }
  );
});

test("parseUpstreamUrl accepts GitLab -/blob with a single-segment owner", () => {
  assert.deepEqual(
    parseUpstreamUrl("https://gitlab.com/owner/repo/-/blob/main/path/to/main.yaml"),
    {
      host: "gitlab.com",
      scheme: "gitlab",
      owner: "owner",
      repo: "repo",
      ref: "main",
      filePath: "path/to/main.yaml",
    }
  );
});

test("parseUpstreamUrl accepts GitLab -/raw with a nested namespace", () => {
  assert.deepEqual(
    parseUpstreamUrl("https://gitlab.com/group/sub/proj/-/raw/main/a/b.yaml"),
    {
      host: "gitlab.com",
      scheme: "gitlab",
      owner: "group/sub",
      repo: "proj",
      ref: "main",
      filePath: "a/b.yaml",
    }
  );
});

test("parseUpstreamUrl percent-decodes segments: %2F in a branch, %20 in a path", () => {
  assert.deepEqual(
    parseUpstreamUrl("https://codeberg.org/owner/repo/src/branch/feature%2Ffoo/x.yaml"),
    {
      host: "codeberg.org",
      scheme: "codeberg",
      owner: "owner",
      repo: "repo",
      ref: "feature/foo",
      filePath: "x.yaml",
    }
  );
  assert.deepEqual(
    parseUpstreamUrl("https://github.com/owner/repo/blob/main/a%20b/x.yaml"),
    {
      host: "github.com",
      scheme: "github",
      owner: "owner",
      repo: "repo",
      ref: "main",
      filePath: "a b/x.yaml",
    }
  );
});

test("parseUpstreamUrl rejects every non-canonical shape", () => {
  for (const bad of [
    "https://github.com/owner/repo", // repo root
    "https://github.com/owner/repo/tree/main/dir", // directory, not blob/raw
    "https://github.com/owner/repo/blob/main/README.md", // not yaml
    "http://github.com/owner/repo/blob/main/x.yaml", // not https
    "https://raw.githubusercontent.com/owner/repo/main", // no path past the ref
    "https://raw.githubusercontent.com/owner/repo/refs/heads/x.yaml", // explicit refs form, no ref/path (drift fix)
    "https://github.com/owner/repo/blob/refs/heads/x.yaml", // explicit refs form, no ref/path (drift fix)
    "https://codeberg.org/o/r/src/main/x.yaml", // legacy Gitea shape, no branch/tag/commit segment
    "https://codeberg.org/o/r/raw/main/x.yaml", // legacy Gitea shape, no branch/tag/commit segment
    "https://codeberg.org/o/r/tree/branch/main/x.yaml", // wrong type segment (neither src nor raw)
    "https://codeberg.org/o/r/src/branch/main/dir", // not yaml
    "https://codeberg.org/o/r/src/branch/main", // no path
    "https://codeberg.org/o/r/src/blob/main/x.yaml", // wrong type segment
    "http://codeberg.org/o/r/src/branch/main/x.yaml", // not https
    "https://gitlab.com/o/r/blob/main/x.yaml", // no `-` separator
    "https://gitlab.com/o/-/blob/main/x.yaml", // `-` too early (index 1)
    "https://gitlab.com/o/r/-/tree/main/x.yaml", // wrong type segment
    "https://gitlab.com/o/r/-/raw/main", // no path
    "https://gitlab.com/o/r/-/raw/main/x.txt", // not yaml
    "https://bitbucket.org/o/r/raw/main/x.yaml", // unknown host
    "https://codeberg.org/o/r/src/branch/%E0%A4%A/x.yaml", // bad percent-escape
    "not a url",
  ]) {
    assert.equal(parseUpstreamUrl(bad), null, bad);
  }
});
