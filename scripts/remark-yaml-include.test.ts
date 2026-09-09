#!/usr/bin/env tsx
/**
 * Unit tests for src/integrations/remark-yaml-include.ts - the `includeDirective`
 * helper and the `url=` allowlist behaviour of the remark plugin itself. Run
 * with:
 *
 *   npm test
 *
 * Uses Node's built-in test runner (node:test), so no test framework is
 * added to the project.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { VFile } from "vfile";
import type { Root } from "mdast";

import remarkYamlInclude, {
  includeDirective,
  parseUpstreamUrl,
} from "../src/integrations/remark-yaml-include.ts";

test("parseUpstreamUrl keeps a nested GitLab namespace and rejects non-yaml or http", () => {
  assert.deepEqual(
    parseUpstreamUrl("https://gitlab.com/group/sub/proj/-/raw/v2/dir/x.yaml"),
    { scheme: "gitlab", namespace: "group/sub", repo: "proj", ref: "v2", rest: "dir/x.yaml" }
  );
  assert.deepEqual(
    parseUpstreamUrl("https://raw.githubusercontent.com/o/r/refs/tags/v1/x.yml"),
    { scheme: "github", namespace: "o", repo: "r", ref: "v1", rest: "x.yml" }
  );
  assert.equal(parseUpstreamUrl("https://github.com/o/r/blob/main/README.md"), null);
  assert.equal(parseUpstreamUrl("http://github.com/o/r/blob/main/x.yaml"), null);
  assert.equal(parseUpstreamUrl("https://github.com/o/r/tree/main/x.yaml"), null);
  assert.equal(parseUpstreamUrl("https://raw.githubusercontent.com/o/r/main"), null);
  assert.equal(parseUpstreamUrl("https://gitlab.com/o/r/-/tree/main/x.yaml"), null);
  assert.equal(parseUpstreamUrl("https://gitlab.com/o/r/-/raw/main"), null);
});

test("includeDirective handles the canonical GitHub shapes", () => {
  assert.equal(
    includeDirective("https://github.com/o/r/blob/main/path/x.yaml"),
    "!include github://o/r/path/x.yaml@main"
  );
  assert.equal(
    includeDirective("https://github.com/o/r/blob/refs/heads/dev/x.yaml"),
    "!include github://o/r/x.yaml@dev"
  );
  assert.equal(
    includeDirective("https://raw.githubusercontent.com/o/r/main/x.yaml"),
    "!include github://o/r/x.yaml@main"
  );
});

test("includeDirective handles the canonical Codeberg shapes", () => {
  assert.equal(
    includeDirective("https://codeberg.org/o/r/src/branch/main/x.yaml"),
    "!include codeberg://o/r/x.yaml@main"
  );
  assert.equal(
    includeDirective("https://codeberg.org/o/r/raw/tag/v1.2.3/x.yaml"),
    "!include codeberg://o/r/x.yaml@v1.2.3"
  );
});

test("includeDirective returns null for Codeberg with too few segments", () => {
  assert.equal(includeDirective("https://codeberg.org/o/r/src/branch/main"), null);
});

test("includeDirective returns null for Codeberg with the wrong type segment", () => {
  assert.equal(
    includeDirective("https://codeberg.org/o/r/src/blob/main/x.yaml"),
    null
  );
});

test("includeDirective handles the canonical GitLab shape", () => {
  assert.equal(
    includeDirective("https://gitlab.com/o/r/-/blob/main/x.yaml"),
    "!include gitlab://o/r/x.yaml@main"
  );
  assert.equal(
    includeDirective("https://gitlab.com/o/r/-/raw/v1.2.3/dir/x.yaml"),
    "!include gitlab://o/r/dir/x.yaml@v1.2.3"
  );
});

test("includeDirective returns null for a GitLab URL with a nested namespace", () => {
  // ESPHome's `!include gitlab://<owner>/<repo>/…` shorthand takes a single-
  // segment owner, so a nested namespace can't be expressed as a directive.
  assert.equal(
    includeDirective("https://gitlab.com/group/sub/proj/-/blob/main/x.yaml"),
    null
  );
});

test("includeDirective returns null for a GitLab URL without a `-` separator", () => {
  assert.equal(
    includeDirective("https://gitlab.com/o/r/blob/main/x.yaml"),
    null
  );
});

test("includeDirective returns null for an unknown host and malformed input", () => {
  assert.equal(
    includeDirective("https://bitbucket.org/o/r/raw/main/x.yaml"),
    null
  );
  assert.equal(includeDirective("not a url"), null);
});

test("includeDirective round-trips a %2F-encoded Codeberg branch name", () => {
  assert.equal(
    includeDirective(
      "https://codeberg.org/o/r/src/branch/feature%2Ffoo/x.yaml"
    ),
    "!include codeberg://o/r/x.yaml@feature/foo"
  );
});

test("includeDirective returns null for a segment with a bad percent-escape", () => {
  assert.equal(
    includeDirective("https://codeberg.org/o/r/src/branch/%E0%A4%A/x.yaml"),
    null
  );
});

// ---------------------------------------------------------------------------
// Plugin end-to-end: run the transformer over a small mdast tree so the
// allowlist behaviour is exercised through the real call site rather than
// only via the pure helper above.
// ---------------------------------------------------------------------------

function codeRoot(meta: string): Root {
  return {
    type: "root",
    children: [{ type: "code", lang: "yaml", meta, value: "" }],
  } as unknown as Root;
}

function renderedHtml(tree: Root): string {
  return (tree.children as unknown as { type: string; value?: string }[])
    .filter((n) => n.type === "html")
    .map((n) => n.value ?? "")
    .join("\n");
}

function runTransform(tree: Root, file: VFile): void {
  const transformer = remarkYamlInclude.call(undefined as never) as (
    tree: Root,
    file: VFile
  ) => void;
  transformer(tree, file);
}

test("plugin renders a remote-yaml-include + copy action for an allowed Codeberg url", () => {
  const tree = codeRoot(
    "url=https://codeberg.org/o/r/src/branch/main/x.yaml"
  );
  const file = new VFile({ path: "src/docs/devices/Foo/index.md" });
  runTransform(tree, file);

  const html = renderedHtml(tree);
  assert.match(
    html,
    /<remote-yaml-include url="https:\/\/codeberg\.org\/o\/r\/src\/branch\/main\/x\.yaml">/
  );
  assert.match(
    html,
    /<yaml-include-action data-include="!include codeberg:\/\/o\/r\/x\.yaml@main">/
  );
  assert.equal(file.messages.length, 0);
});

test("plugin renders a remote-yaml-include + copy action for an allowed GitLab url", () => {
  const tree = codeRoot("url=https://gitlab.com/o/r/-/blob/main/x.yaml");
  const file = new VFile({ path: "src/docs/devices/Foo/index.md" });
  runTransform(tree, file);

  const html = renderedHtml(tree);
  assert.match(
    html,
    /<remote-yaml-include url="https:\/\/gitlab\.com\/o\/r\/-\/blob\/main\/x\.yaml">/
  );
  assert.match(
    html,
    /<yaml-include-action data-include="!include gitlab:\/\/o\/r\/x\.yaml@main">/
  );
  assert.equal(file.messages.length, 0);
});

test("plugin rejects a disallowed host and leaves the code node in place", () => {
  const tree = codeRoot("url=https://bitbucket.org/o/r/raw/main/x.yaml");
  const file = new VFile({ path: "src/docs/devices/Foo/index.md" });
  runTransform(tree, file);

  assert.equal(tree.children.length, 1);
  assert.equal((tree.children[0] as { type: string }).type, "code");
  assert.equal(file.messages.length, 1);
  assert.match(file.messages[0].reason, /is not allowed/);
});

test("plugin warns on a non-canonical shape from an allowed host and leaves the code node in place", () => {
  for (const url of [
    "https://codeberg.org/o/r/src/main/x.yaml", // legacy Gitea shape
    "https://gitlab.com/o/r/blob/main/x.yaml", // no `-` separator
    "https://github.com/o/r/tree/main", // directory listing
  ]) {
    const tree = codeRoot(`url=${url}`);
    const file = new VFile({ path: "src/docs/devices/Foo/index.md" });
    runTransform(tree, file);

    assert.equal(tree.children.length, 1, url);
    assert.equal((tree.children[0] as { type: string }).type, "code", url);
    assert.equal(file.messages.length, 1, url);
    assert.match(file.messages[0].reason, /not a recognised upstream yaml file URL/, url);
  }
});

test("plugin renders a nested-namespace GitLab url without a copy action", () => {
  const tree = codeRoot("url=https://gitlab.com/group/sub/proj/-/blob/main/x.yaml");
  const file = new VFile({ path: "src/docs/devices/Foo/index.md" });
  runTransform(tree, file);

  const html = renderedHtml(tree);
  assert.match(html, /<remote-yaml-include url="https:\/\/gitlab\.com\/group\/sub\/proj\/-\/blob\/main\/x\.yaml">/);
  assert.doesNotMatch(html, /<yaml-include-action/);
  assert.equal(file.messages.length, 0);
});
