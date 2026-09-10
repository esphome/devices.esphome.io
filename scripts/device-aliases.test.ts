/**
 * Tests for device `alias` frontmatter: parsing, cross-page conflict checks,
 * and the generated Netlify redirect rules.
 *
 * Run with `npm test` (or `tsx --test scripts/device-aliases.test.ts`).
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ALIAS_SLUG_PATTERN,
  buildAliasRedirects,
  devicePathFor,
  findAliasConflicts,
  parseAliases,
  slugFromTitle,
} from "../src/utils/deviceAliases";
import deviceAliases, {
  appendRedirects,
  scanDeviceAliases,
  writeAliasRedirects,
} from "../src/integrations/device-aliases";

function withTempDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "alias-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeDevice(
  root: string,
  folder: string,
  file: string,
  body: string
): string {
  mkdirSync(join(root, folder), { recursive: true });
  const target = join(root, folder, file);
  writeFileSync(target, body);
  return target;
}

test("slugFromTitle mirrors the device folder naming rules", () => {
  assert.equal(
    slugFromTitle("Athom Smart Plug US V3 (PG03V3-US16A)"),
    "Athom-Smart-Plug-US-V3-PG03V3-US16A"
  );
  assert.equal(slugFromTitle("  Spaced  Out  "), "Spaced-Out");
  assert.equal(slugFromTitle("Keeps_dots.and+plus"), "Keeps_dots.and+plus");
  assert.equal(slugFromTitle("((("), "");
});

test("devicePathFor lowercases the slug", () => {
  assert.equal(
    devicePathFor("Athom-Smart-Plug-PG03V3-US16A"),
    "/devices/athom-smart-plug-pg03v3-us16a/"
  );
});

test("ALIAS_SLUG_PATTERN accepts folder-name characters only", () => {
  assert.ok(ALIAS_SLUG_PATTERN.test("Feit-BPA800-RGBW-AG-2-P"));
  assert.ok(ALIAS_SLUG_PATTERN.test("a_b.c+d-e"));
  assert.ok(!ALIAS_SLUG_PATTERN.test("has space"));
  assert.ok(!ALIAS_SLUG_PATTERN.test("parens(P)"));
});

test("parseAliases returns nothing for an absent alias field", () => {
  for (const raw of [undefined, null]) {
    assert.deepEqual(parseAliases(raw), { aliases: [], errors: [] });
  }
});

test("parseAliases treats a bare string as a redirect-only slug", () => {
  assert.deepEqual(parseAliases(["Some-Old-Name"]), {
    aliases: [{ slug: "Some-Old-Name" }],
    errors: [],
  });
});

test("parseAliases accepts a single unwrapped value", () => {
  assert.deepEqual(parseAliases("Some-Old-Name").aliases, [
    { slug: "Some-Old-Name" },
  ]);
});

test("parseAliases keeps title and slug from a mapping", () => {
  assert.deepEqual(
    parseAliases([
      {
        title: "Athom Smart Plug US V3 (PG03V3-US16A)",
        slug: "Athom-Smart-Plug-PG03V3-US16A",
      },
    ]).aliases,
    [
      {
        slug: "Athom-Smart-Plug-PG03V3-US16A",
        title: "Athom Smart Plug US V3 (PG03V3-US16A)",
      },
    ]
  );
});

test("parseAliases derives a slug from a title-only mapping", () => {
  assert.deepEqual(parseAliases([{ title: " Some Old Name " }]).aliases, [
    { slug: "Some-Old-Name", title: "Some Old Name" },
  ]);
});

test("parseAliases trims a whitespace-padded slug", () => {
  assert.deepEqual(parseAliases([{ slug: "  Padded-Name  " }]).aliases, [
    { slug: "Padded-Name" },
  ]);
});

test("parseAliases reports malformed entries and drops them", () => {
  const cases: Array<[unknown, string]> = [
    ["   ", "alias[0] is empty."],
    [
      { colour: "red" },
      'alias[0] has unknown key "colour". Only "slug" and "title" are allowed.',
    ],
    [{ title: 42 }, "alias[0].title must be a non-empty string."],
    [{ title: "  " }, "alias[0].title must be a non-empty string."],
    [{ slug: "" }, "alias[0].slug must be a non-empty string."],
    [{ slug: ["a"] }, "alias[0].slug must be a non-empty string."],
    [
      { title: "(((" },
      'alias[0] cannot derive a slug from title "(((". Add an explicit slug. ' +
        "Only a-z, A-Z, 0-9, _, ., -, + are allowed.",
    ],
    [{}, 'alias[0] needs a "title", a "slug", or both.'],
    [7, 'alias[0] must be a string, or a mapping with "slug" and/or "title".'],
    [null, 'alias[0] must be a string, or a mapping with "slug" and/or "title".'],
    [
      ["nested"],
      'alias[0] must be a string, or a mapping with "slug" and/or "title".',
    ],
    [
      "has space",
      'alias[0] slug "has space" is invalid. Only a-z, A-Z, 0-9, _, ., -, + are allowed.',
    ],
  ];

  for (const [entry, message] of cases) {
    const result = parseAliases([entry]);
    assert.deepEqual(
      result.aliases,
      [],
      `${JSON.stringify(entry)} should be dropped`
    );
    assert.deepEqual(result.errors, [message]);
  }
});

test("parseAliases rejects a slug repeated on the same page", () => {
  const result = parseAliases([
    "Same-Name",
    { slug: "same-name", title: "Same Name" },
  ]);
  assert.deepEqual(result.aliases, [{ slug: "Same-Name" }]);
  assert.deepEqual(result.errors, [
    'alias[1] repeats the alias slug "same-name".',
  ]);
});

test("parseAliases keeps good entries alongside bad ones", () => {
  const result = parseAliases([{}, "Good-Name"]);
  assert.deepEqual(result.aliases, [{ slug: "Good-Name" }]);
  assert.equal(result.errors.length, 1);
});

test("findAliasConflicts passes a clean set", () => {
  const conflicts = findAliasConflicts(
    [
      {
        folder: "New-Name",
        file: "New-Name/index.md",
        aliases: [{ slug: "Old-Name" }],
      },
    ],
    ["New-Name", "Other-Device"]
  );
  assert.deepEqual(conflicts, []);
});

test("findAliasConflicts rejects an alias shadowing another device folder", () => {
  const conflicts = findAliasConflicts(
    [
      {
        folder: "New-Name",
        file: "New-Name/index.md",
        aliases: [{ slug: "other-device" }],
      },
    ],
    ["New-Name", "Other-Device"]
  );
  assert.deepEqual(conflicts, [
    'Alias "other-device" in New-Name/index.md collides with device folder Other-Device.',
  ]);
});

test("findAliasConflicts rejects an alias for the page's own folder", () => {
  const conflicts = findAliasConflicts(
    [
      {
        folder: "New-Name",
        file: "New-Name/index.md",
        aliases: [{ slug: "New-Name" }],
      },
    ],
    ["New-Name"]
  );
  assert.deepEqual(conflicts, [
    'Alias "New-Name" in New-Name/index.md is the page\'s own folder name.',
  ]);
});

test("findAliasConflicts rejects the same alias claimed twice", () => {
  const conflicts = findAliasConflicts(
    [
      { folder: "One", file: "One/index.md", aliases: [{ slug: "Shared" }] },
      { folder: "Two", file: "Two/index.md", aliases: [{ slug: "shared" }] },
    ],
    ["One", "Two"]
  );
  assert.deepEqual(conflicts, [
    'Alias "shared" in Two/index.md is already claimed by One/index.md.',
  ]);
});

test("findAliasConflicts defaults the folder list to the records themselves", () => {
  assert.deepEqual(
    findAliasConflicts([
      { folder: "One", file: "One/index.md", aliases: [{ slug: "One" }] },
    ]),
    ['Alias "One" in One/index.md is the page\'s own folder name.']
  );
});

test("buildAliasRedirects emits a 301 per alias", () => {
  assert.deepEqual(
    buildAliasRedirects([
      {
        folder: "IoTorero-Plug",
        file: "IoTorero-Plug/index.md",
        aliases: [
          { slug: "Athom-Plug", title: "Athom Plug" },
          { slug: "Old-Plug" },
        ],
      },
    ]),
    [
      "/devices/athom-plug/ /devices/iotorero-plug/ 301",
      "/devices/old-plug/ /devices/iotorero-plug/ 301",
    ]
  );
});

test("scanDeviceAliases reads index.md and lone markdown files", () => {
  withTempDir((dir) => {
    writeDevice(
      dir,
      "With-Index",
      "index.md",
      "---\nalias:\n  - Old-One\n---\n\nbody\n"
    );
    writeDevice(
      dir,
      "Lone-Md",
      "device.md",
      "---\nalias:\n  - Old-Two\n---\n\nbody\n"
    );
    writeFileSync(join(dir, "not-a-folder.txt"), "ignored");

    assert.deepEqual(scanDeviceAliases(dir), [
      {
        folder: "Lone-Md",
        file: join(dir, "Lone-Md", "device.md"),
        aliases: [{ slug: "Old-Two" }],
      },
      {
        folder: "With-Index",
        file: join(dir, "With-Index", "index.md"),
        aliases: [{ slug: "Old-One" }],
      },
    ]);
  });
});

test("scanDeviceAliases skips folders it cannot resolve or that have no aliases", () => {
  withTempDir((dir) => {
    writeDevice(dir, "No-Alias", "index.md", "---\ntitle: Plain\n---\n\nbody\n");
    writeDevice(dir, "Empty-Folder", "notes.txt", "nothing here");
    writeDevice(dir, "Two-Md", "a.md", "---\nalias:\n  - A\n---\n");
    writeFileSync(join(dir, "Two-Md", "b.md"), "---\nalias:\n  - B\n---\n");
    writeDevice(dir, "Bad-Yaml", "index.md", "---\nalias: [unclosed\n---\n\nbody\n");

    assert.deepEqual(scanDeviceAliases(dir), []);
  });
});

test("scanDeviceAliases drops malformed alias entries but keeps the good ones", () => {
  withTempDir((dir) => {
    writeDevice(
      dir,
      "Mixed",
      "index.md",
      "---\nalias:\n  - Good-Name\n  - has space\n---\n\nbody\n"
    );

    assert.deepEqual(scanDeviceAliases(dir)[0].aliases, [{ slug: "Good-Name" }]);
  });
});

test("appendRedirects creates the file when the build wrote none", () => {
  withTempDir((dir) => {
    const target = join(dir, "nested", "_redirects");
    appendRedirects(target, ["/devices/a/ /devices/b/ 301"]);
    assert.equal(
      readFileSync(target, "utf8"),
      "\n# Generated from device `alias` frontmatter\n/devices/a/ /devices/b/ 301\n"
    );
  });
});

test("appendRedirects keeps existing rules and terminates an unterminated line", () => {
  withTempDir((dir) => {
    const target = join(dir, "_redirects");
    writeFileSync(target, "/old /new");
    appendRedirects(target, ["/devices/a/ /devices/b/ 301"]);
    assert.equal(
      readFileSync(target, "utf8"),
      "/old /new\n\n# Generated from device `alias` frontmatter\n" +
        "/devices/a/ /devices/b/ 301\n"
    );
  });
});

test("appendRedirects does not add a second newline after a terminated file", () => {
  withTempDir((dir) => {
    const target = join(dir, "_redirects");
    writeFileSync(target, "/old /new\n");
    appendRedirects(target, ["/devices/a/ /devices/b/ 301"]);
    assert.equal(
      readFileSync(target, "utf8"),
      "/old /new\n\n# Generated from device `alias` frontmatter\n" +
        "/devices/a/ /devices/b/ 301\n"
    );
  });
});

test("writeAliasRedirects is a no-op without a devices directory", () => {
  withTempDir((dir) => {
    assert.equal(writeAliasRedirects(join(dir, "missing"), dir), 0);
  });
});

test("writeAliasRedirects is a no-op when no device declares an alias", () => {
  withTempDir((dir) => {
    const devices = join(dir, "devices");
    writeDevice(devices, "Plain", "index.md", "---\ntitle: Plain\n---\n");
    assert.equal(writeAliasRedirects(devices, dir), 0);
  });
});

test("writeAliasRedirects appends one rule per alias", () => {
  withTempDir((dir) => {
    const devices = join(dir, "devices");
    writeDevice(
      devices,
      "New-Name",
      "index.md",
      "---\nalias:\n  - Old-Name\n---\n"
    );
    const dist = join(dir, "dist");
    mkdirSync(dist);

    assert.equal(writeAliasRedirects(devices, dist), 1);
    assert.match(
      readFileSync(join(dist, "_redirects"), "utf8"),
      /^\/devices\/old-name\/ \/devices\/new-name\/ 301$/m
    );
  });
});

test("the integration writes this repo's aliases at astro:build:done", async () => {
  const dir = mkdtempSync(join(tmpdir(), "alias-test-"));
  try {
    const messages: string[] = [];
    const integration = deviceAliases();
    assert.equal(integration.name, "esphome-devices:device-aliases");

    const hook = integration.hooks["astro:build:done"]!;
    await hook({
      dir: new URL(`file://${dir}/`),
      logger: { info: (msg: string) => messages.push(msg) },
    } as never);

    assert.match(
      readFileSync(join(dir, "_redirects"), "utf8"),
      /^\/devices\/athom-smart-plug-pg03v3-us16a\/ \/devices\/iotorero-smart-plug-pg03v3-us16a\/ 301$/m
    );
    assert.match(
      messages[0],
      /^Added \d+ device alias redirect\(s\) to _redirects$/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
