#!/usr/bin/env tsx
/**
 * Unit tests for the pure structural-check helpers in
 * scripts/review-made-for-esphome.ts. Run with:
 *
 *   npm test
 *
 * These cover the deterministic checklist logic without touching the network
 * or the ESPHome toolchain (the download/compile path is exercised separately
 * against a live example — see the PR description). Uses Node's built-in test
 * runner (node:test), so no test framework is added to the project.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  parseGitHubYamlUrl,
  nameViolatesEsphomeRule,
  collectMissingIds,
  collectBakedPasswords,
  collectManualIps,
  collectStraySecrets,
  runChecklist,
  pageBlocks,
  buildReport,
  stripAnsi,
  findYamlFences,
  isMadeForEsphome,
  classifyConfigError,
  buildMultiDeviceReport,
  variantToChipFamily,
  chipFamilyFromConfig,
  resolveBinaryUrl,
  validateManifest,
  updateSources,
  checkOneManifest,
  type PageResult,
} from "./review-made-for-esphome.ts";

test("parseGitHubYamlUrl accepts the canonical shapes", () => {
  assert.deepEqual(
    parseGitHubYamlUrl(
      "https://github.com/Owner/Repo/blob/main/path/to/main.yaml"
    ),
    { owner: "Owner", repo: "Repo", ref: "main", filePath: "path/to/main.yaml" }
  );
  assert.deepEqual(
    parseGitHubYamlUrl("https://github.com/Owner/Repo/raw/v1.2.3/cfg.yml"),
    { owner: "Owner", repo: "Repo", ref: "v1.2.3", filePath: "cfg.yml" }
  );
  assert.deepEqual(
    parseGitHubYamlUrl(
      "https://raw.githubusercontent.com/Owner/Repo/main/a/b.yaml"
    ),
    { owner: "Owner", repo: "Repo", ref: "main", filePath: "a/b.yaml" }
  );
  assert.deepEqual(
    parseGitHubYamlUrl(
      "https://github.com/Owner/Repo/blob/refs/heads/dev/c.yaml"
    ),
    { owner: "Owner", repo: "Repo", ref: "dev", filePath: "c.yaml" }
  );
  assert.deepEqual(
    parseGitHubYamlUrl(
      "https://raw.githubusercontent.com/Owner/Repo/refs/tags/v9/d.yaml"
    ),
    { owner: "Owner", repo: "Repo", ref: "v9", filePath: "d.yaml" }
  );
});

test("parseGitHubYamlUrl rejects non-canonical URLs", () => {
  for (const bad of [
    "https://github.com/Owner/Repo", // repo root
    "https://github.com/Owner/Repo/tree/main/dir", // directory, not blob
    "https://github.com/Owner/Repo/blob/main/README.md", // not yaml
    "https://gitlab.com/Owner/Repo/blob/main/x.yaml", // wrong host
    "http://github.com/Owner/Repo/blob/main/x.yaml", // not https
    "not a url",
  ]) {
    assert.equal(parseGitHubYamlUrl(bad), null, bad);
  }
});

test("nameViolatesEsphomeRule allows a trailing 'for ESPHome' only", () => {
  assert.equal(nameViolatesEsphomeRule("Sonoff for ESPHome"), false);
  assert.equal(nameViolatesEsphomeRule("Widget for esphome"), false);
  assert.equal(nameViolatesEsphomeRule("ApolloAutomation.H-2"), false);
  assert.equal(nameViolatesEsphomeRule("My Cool Device"), false);
  assert.equal(nameViolatesEsphomeRule("ESPHome Sonoff"), true);
  assert.equal(nameViolatesEsphomeRule("esphome-thing"), true);
  // "ESPHome" both mid-string and as suffix still violates.
  assert.equal(nameViolatesEsphomeRule("ESPHome Widget for ESPHome"), true);
});

test("collectMissingIds requires id on every component, incl. buses/hubs", () => {
  const cfg = {
    sensor: [
      { platform: "uptime", name: "Uptime" }, // named, no id -> flagged
      { platform: "template", id: "ok", name: "Fine" }, // has id -> ok
      { platform: "wifi_info", ip_address: { name: "IP" } }, // container -> skipped
      "not-an-object",
    ],
    switch: [{ platform: "gpio", name: "Relay", id: " " }], // blank id -> flagged
    // Buses / hubs are components too: no name, no id -> flagged.
    i2c: [{ sda: "GPIO21", scl: "GPIO22" }],
    uart: [{ tx_pin: "GPIO1", id: "bus_uart" }], // has id -> ok
    canbus: [{ platform: "esp32_can", tx_pin: "GPIO5" }], // no id -> flagged
    // Non-id automation/platform/source domains are exempt.
    ota: [{ platform: "esphome", password: "" }],
    interval: [{ interval: "1s", then: [] }],
    external_components: [
      { source: "github://acme/comp", components: ["x"], refresh: "0s" },
    ],
  };
  const missing = collectMissingIds(cfg);
  assert.deepEqual(
    missing.map((m) => m.domain).sort(),
    ["canbus", "i2c", "sensor", "switch"]
  );
  // Named entity keeps its name; the bus with no name reports by index.
  const i2c = missing.find((m) => m.domain === "i2c")!;
  assert.equal(i2c.name, null);
  assert.equal(i2c.index, 0);
  const uptime = missing.find((m) => m.domain === "sensor")!;
  assert.equal(uptime.name, "Uptime");
});

test("collectBakedPasswords distinguishes secrets, empties and literals", () => {
  const cfg = {
    ota: [
      { platform: "esphome", password: "" }, // empty -> fine
      { platform: "http_request", password: "!secret ota_pw" }, // non-wifi secret on a password key -> flag
    ],
    wifi: {
      ap: { password: "!secret wifi_password" }, // allowed wifi secret -> fine
      password: "!secret wifi_password", // allowed wifi secret -> fine
    },
    // `key:` is not a password/psk key, so this is NOT a collectBakedPasswords
    // concern — a non-wifi secret here is caught by collectStraySecrets and by
    // `esphome config` failing to resolve it.
    api: { encryption: { key: "!secret api_key" } },
    mqtt: { password: "hunter2" }, // literal -> flag
    some: { psk: "0011aabb" }, // psk literal -> flag
  };
  const out: string[] = [];
  collectBakedPasswords(cfg, [], out);
  assert.equal(out.length, 3, out.join(" | "));
  assert.ok(out.some((s) => s.includes("ota.1.password") && s.includes("ota_pw")));
  assert.ok(out.some((s) => s.includes("mqtt.password")));
  assert.ok(out.some((s) => s.includes("some.psk")));
});

test("collectManualIps finds static IPs under wifi/ethernet only", () => {
  assert.deepEqual(collectManualIps({ wifi: { manual_ip: { static_ip: "1" } } }), [
    "wifi",
  ]);
  assert.deepEqual(
    collectManualIps({ ethernet: { manual_ip: {} }, wifi: {} }),
    ["ethernet"]
  );
  assert.deepEqual(collectManualIps({ wifi: {} }), []);
});

test("collectStraySecrets ignores the wifi pair, catches others", () => {
  assert.equal(
    collectStraySecrets("a: !secret wifi_ssid\nb: !secret 'wifi_password'").size,
    0
  );
  const stray = collectStraySecrets("k: !secret api_key\nj: !secret ota_pw");
  assert.deepEqual([...stray].sort(), ["api_key", "ota_pw"]);
});

test("stripAnsi removes literal and real escape sequences", () => {
  assert.equal(stripAnsi("\\033[8m\\033[28m"), "");
  assert.equal(stripAnsi("\\033[8mmotor-1\\033[28m"), "motor-1");
  assert.equal(stripAnsi("\x1b[31mred\x1b[0m"), "red");
  assert.equal(stripAnsi("plain"), "plain");
});

test("findYamlFences extracts file/url/inline attributes", () => {
  const md = [
    "```yaml file=config.yaml",
    "```",
    "text",
    "```yaml url=https://github.com/o/r/blob/main/x.yaml",
    "```",
    "```yaml inline",
    "esphome:",
    "```",
  ].join("\n");
  const fences = findYamlFences(md);
  assert.equal(fences.length, 3);
  assert.equal(fences[0].fileAttr, "config.yaml");
  assert.equal(fences[1].urlAttr, "https://github.com/o/r/blob/main/x.yaml");
  assert.equal(fences[2].inline, true);
});

test("isMadeForEsphome reads boolean and string frontmatter", () => {
  assert.equal(isMadeForEsphome("---\nmade-for-esphome: true\n---\n"), true);
  assert.equal(isMadeForEsphome("---\nmade-for-esphome: True\n---\n"), true);
  assert.equal(isMadeForEsphome('---\nmade-for-esphome: "true"\n---\n'), true);
  assert.equal(isMadeForEsphome("---\nmade-for-esphome: false\n---\n"), false);
  assert.equal(isMadeForEsphome("---\ntitle: x\n---\n"), false);
});

// A fully compliant expanded config -> every hard check OK.
const GOOD_CFG = {
  esphome: {
    name: "widget",
    friendly_name: "Widget",
    project: { name: "Acme.Widget" },
  },
  esp32: { board: "esp32dev", variant: "ESP32" },
  wifi: {
    ssid: "!secret wifi_ssid",
    password: "!secret wifi_password",
    ap: { password: "" },
  },
  esp32_improv: {},
  improv_serial: {},
  dashboard_import: { package_import_url: "github://acme/widget/widget.yaml" },
  ota: [{ platform: "esphome", password: "" }],
  update: [{ platform: "http_request", id: "fw", name: "Firmware" }],
  logger: { baud_rate: 115200 },
  sensor: [{ platform: "uptime", id: "up", name: "Uptime" }],
};

test("runChecklist passes a compliant config", () => {
  const checks = runChecklist(
    GOOD_CFG,
    "wifi:\n  password: !secret wifi_password",
    "Widget",
    "PASS"
  );
  const bad = checks.filter(
    (c) => c.status === "MISSING" || c.status === "FAIL"
  );
  assert.deepEqual(bad, [], JSON.stringify(bad, null, 2));
  const result: PageResult = {
    page: "p",
    url: "u",
    fenceMissing: false,
    fatalError: null,
    configOk: true,
    configInconclusive: false,
    configError: null,
    compile: "PASS",
    compileLog: null,
    checks,
  };
  assert.equal(pageBlocks(result), false);
});

test("runChecklist flags a non-compliant config", () => {
  const cfg = {
    esphome: { name: "esphome-thing" }, // name violation
    esp8266: {}, // wrong platform
    wifi: { manual_ip: { static_ip: "10.0.0.5" } }, // static IP + wifi present
    // no esp32_improv, no dashboard_import, no ota, no update
    switch: [{ platform: "gpio", name: "Relay" }], // missing id
    api: { password: "hunter2" }, // baked password
  };
  const checks = runChecklist(cfg, "x: !secret api_key", "ESPHome Thing", "FAIL");
  const byItem = new Map(checks.map((c) => [c.item, c.status]));
  assert.equal(byItem.get("ESP32 or supported variant"), "FAIL");
  assert.equal(byItem.get('Project name free of "ESPHome"'), "FAIL");
  assert.equal(byItem.get("esp32_improv (Wi-Fi provisioning)"), "MISSING");
  assert.equal(byItem.get("dashboard_import"), "MISSING");
  assert.equal(byItem.get("ota: `- platform: esphome`"), "MISSING");
  assert.equal(byItem.get("update: `- platform: http_request`"), "MISSING");
  assert.equal(byItem.get("No passwords in the configuration"), "FAIL");
  assert.equal(byItem.get("No references to non-standard secrets"), "FAIL");
  assert.equal(byItem.get("No static IP addresses"), "FAIL");
  assert.equal(byItem.get("Every entity/component has an `id:`"), "MISSING");
  assert.equal(byItem.get("Compiles without user changes"), "FAIL");
});

test("esp32_improv is N/A when there is no wifi", () => {
  const cfg = { esphome: { name: "x" }, esp32: { board: "b" } };
  const checks = runChecklist(cfg, "", "x", "SKIPPED");
  const improv = checks.find((c) => c.item.startsWith("esp32_improv"));
  assert.equal(improv?.status, "N/A");
});

test("pageBlocks: fence/fatal/config/compile gate correctly", () => {
  const base: PageResult = {
    page: "p",
    url: null,
    fenceMissing: false,
    fatalError: null,
    configOk: true,
    configInconclusive: false,
    configError: null,
    compile: "PASS",
    compileLog: null,
    checks: [],
  };
  assert.equal(pageBlocks({ ...base, fenceMissing: true }), true);
  assert.equal(pageBlocks({ ...base, fatalError: "404" }), true);
  assert.equal(pageBlocks({ ...base, configOk: false }), true);
  assert.equal(pageBlocks({ ...base, compile: "FAIL" }), true);
  // INCONCLUSIVE compile and NEEDS-HUMAN-CHECK alone do not block.
  assert.equal(pageBlocks({ ...base, compile: "INCONCLUSIVE" }), false);
  // A network/toolchain-inconclusive config (configOk still null) does not block.
  assert.equal(
    pageBlocks({ ...base, configOk: null, configInconclusive: true }),
    false
  );
  assert.equal(
    pageBlocks({
      ...base,
      checks: [{ item: "x", status: "NEEDS-HUMAN-CHECK", detail: "" }],
    }),
    false
  );
  assert.equal(
    pageBlocks({
      ...base,
      checks: [{ item: "x", status: "MISSING", detail: "" }],
    }),
    true
  );
});

test("buildReport renders a fence-missing page", () => {
  const report = buildReport([
    {
      page: "src/docs/devices/Foo/index.md",
      url: null,
      fenceMissing: true,
      fatalError: null,
      configOk: null,
      configInconclusive: false,
      configError: null,
      compile: "SKIPPED",
      compileLog: null,
      checks: [],
    },
  ]);
  assert.ok(report.includes("Made for ESPHome review"));
  assert.ok(report.includes("no ") && report.includes("url="));
  assert.ok(report.includes("src/docs/devices/Foo/index.md"));
});

test("classifyConfigError separates secret, network and generic failures", () => {
  const secret = classifyConfigError({
    ok: false,
    stdout: "",
    stderr: "ERROR ... Secret 'api_key' not defined",
    timedOut: false,
  });
  assert.equal(secret.network, false);
  assert.ok(secret.message.includes("api_key"));

  const network = classifyConfigError({
    ok: false,
    stdout: "",
    stderr: "Failed to clone github://acme/x: Could not resolve host",
    timedOut: false,
  });
  assert.equal(network.network, true);

  const generic = classifyConfigError({
    ok: false,
    stdout: "",
    stderr: "Component sensor.foo requires a bar",
    timedOut: false,
  });
  assert.equal(generic.network, false);
  assert.ok(generic.message.includes("bar"));
});

// --- OTA update manifest checks -------------------------------------------

test("variantToChipFamily maps ESPHome variants to manifest chipFamily", () => {
  assert.equal(variantToChipFamily("ESP32"), "ESP32");
  assert.equal(variantToChipFamily("ESP32C3"), "ESP32-C3");
  assert.equal(variantToChipFamily("ESP32S3"), "ESP32-S3");
  assert.equal(variantToChipFamily("ESP32C6"), "ESP32-C6");
  assert.equal(variantToChipFamily("ESP32H2"), "ESP32-H2");
});

test("chipFamilyFromConfig reads esp32/esp8266", () => {
  assert.equal(
    chipFamilyFromConfig({ esp32: { board: "b", variant: "ESP32S3" } }),
    "ESP32-S3"
  );
  assert.equal(chipFamilyFromConfig({ esp32: { board: "b" } }), "ESP32");
  assert.equal(chipFamilyFromConfig({ esp8266: { board: "b" } }), "ESP8266");
  assert.equal(chipFamilyFromConfig({ rp2040: {} }), null);
});

test("resolveBinaryUrl handles absolute and relative ota.path", () => {
  const manifest =
    "https://raw.githubusercontent.com/o/r/main/firmware/motor/manifest.json";
  assert.equal(
    resolveBinaryUrl("https://github.com/o/r/releases/download/v1/x.bin", manifest),
    "https://github.com/o/r/releases/download/v1/x.bin"
  );
  assert.equal(
    resolveBinaryUrl("motor.bin", manifest),
    "https://raw.githubusercontent.com/o/r/main/firmware/motor/motor.bin"
  );
});

test("validateManifest accepts a good manifest and finds the matching build", () => {
  const manifest = {
    name: "NEATO Motor",
    version: "1.0.0",
    builds: [
      { chipFamily: "ESP32", ota: { path: "x.bin", md5: "abc" } },
      { chipFamily: "ESP32-S3", ota: { path: "y.bin" } },
    ],
  };
  const v = validateManifest(manifest, "ESP32");
  assert.deepEqual(v.problems, []);
  assert.ok(v.matchBuild);
  assert.equal((v.matchBuild as { chipFamily: string }).chipFamily, "ESP32");
  assert.deepEqual(v.chipFamilies, ["ESP32", "ESP32-S3"]);
});

test("validateManifest reports shape and chip problems", () => {
  assert.ok(validateManifest("nope", "ESP32").problems[0].includes("not a JSON"));

  const noFields = validateManifest({ builds: [] }, "ESP32");
  assert.ok(noFields.problems.some((p) => p.includes("name")));
  assert.ok(noFields.problems.some((p) => p.includes("version")));
  assert.ok(noFields.problems.some((p) => p.includes("builds")));

  const mismatch = validateManifest(
    { name: "n", version: "1", builds: [{ chipFamily: "ESP32-C3", ota: { path: "x.bin" } }] },
    "ESP32"
  );
  assert.ok(mismatch.problems.some((p) => p.includes("no build for this device's chip")));
  assert.equal(mismatch.matchBuild, null);

  const noPath = validateManifest(
    { name: "n", version: "1", builds: [{ chipFamily: "ESP32" }] },
    "ESP32"
  );
  assert.ok(noPath.problems.some((p) => p.includes("ota.path")));

  const noChip = validateManifest(
    { name: "n", version: "1", builds: [{ ota: { path: "x.bin" } }] },
    "ESP32"
  );
  assert.ok(noChip.problems.some((p) => p.includes("chipFamily")));
});

test("updateSources extracts http_request sources only", () => {
  const cfg = {
    update: [
      { platform: "http_request", source: "https://example.com/m.json" },
      { platform: "http_request" }, // no source -> skipped
      { platform: "other", source: "https://example.com/x.json" }, // wrong platform
    ],
  };
  assert.deepEqual(updateSources(cfg), ["https://example.com/m.json"]);
  assert.deepEqual(updateSources({ update: "not-a-list" }), []);
});

// Live end-to-end checks against the fixtures cited by the scope request
// (CodeMakesItGo/NeatoFx_Public@main). Opt-in via MFE_LIVE_TESTS=1 so the
// default suite stays offline and deterministic.
const LIVE = process.env.MFE_LIVE_TESTS ? test : test.skip;
const RAW = "https://raw.githubusercontent.com/CodeMakesItGo/NeatoFx_Public/main/firmware";

LIVE("live: NeatoFx manifests all pass (motor, target-ir, audio50)", async () => {
  for (const name of ["motor", "target-ir", "audio50"]) {
    const rows = await checkOneManifest(`${RAW}/${name}/manifest.json`, "ESP32");
    const bad = rows.filter((r) => r.status === "FAIL");
    assert.deepEqual(bad, [], `${name}: ${JSON.stringify(bad)}`);
    assert.ok(rows.some((r) => r.item.startsWith("OTA binary") && r.status === "OK"), name);
  }
});

LIVE("live: bogus manifest URL is MUST-FIX", async () => {
  const rows = await checkOneManifest(`${RAW}/does-not-exist/manifest.json`, "ESP32");
  assert.ok(rows.some((r) => r.status === "FAIL"), JSON.stringify(rows));
});

test("buildMultiDeviceReport lists the pages and states the one-device rule", () => {
  const report = buildMultiDeviceReport([
    "src/docs/devices/Foo/index.md",
    "src/docs/devices/Bar/index.md",
  ]);
  assert.ok(report.includes("**2**"));
  assert.ok(report.includes("one device per pull request"));
  assert.ok(report.includes("`src/docs/devices/Foo/index.md`"));
  assert.ok(report.includes("`src/docs/devices/Bar/index.md`"));
});

test("buildReport neutralizes @mentions from fork-controlled text", () => {
  const report = buildReport([
    {
      page: "src/docs/devices/Foo/index.md",
      url: "https://github.com/@evil/repo/blob/main/x.yaml",
      fenceMissing: false,
      fatalError: "nope",
      configOk: null,
      configInconclusive: false,
      configError: null,
      compile: "SKIPPED",
      compileLog: null,
      checks: [],
    },
  ]);
  assert.ok(!/@evil/.test(report), "raw @mention must be neutralized");
});

test("buildReport uses a green header when nothing blocks", () => {
  const report = buildReport([
    {
      page: "src/docs/devices/Foo/index.md",
      url: "https://github.com/o/r/blob/main/x.yaml",
      fenceMissing: false,
      fatalError: null,
      configOk: true,
      configInconclusive: false,
      configError: null,
      compile: "PASS",
      compileLog: null,
      checks: [{ item: "ESP32", status: "OK", detail: "ok" }],
    },
  ]);
  assert.ok(report.includes("## ✅ Made for ESPHome review"));
  assert.ok(report.includes("All automated Made for ESPHome checks pass"));
  assert.ok(!report.includes("❌"));
});

test("buildReport escapes pipes/backslashes/newlines in checklist detail", () => {
  const report = buildReport([
    {
      page: "src/docs/devices/Foo/index.md",
      url: "https://github.com/o/r/blob/main/x.yaml",
      fenceMissing: false,
      fatalError: null,
      configOk: true,
      configInconclusive: false,
      configError: null,
      compile: "PASS",
      compileLog: null,
      checks: [
        { item: "Some check", status: "FAIL", detail: "a | b \\ c\nsecond line" },
      ],
    },
  ]);
  const row = report.split("\n").find((l) => l.startsWith("| Some check"))!;
  assert.ok(row.includes("\\|"), "pipe must be escaped");
  assert.ok(row.includes("\\\\"), "backslash must be escaped");
  assert.ok(!/\n/.test(row) && row.includes("second line"), "newline folded into the row");
  // The row must still be a single well-formed table row (3 unescaped pipes:
  // leading, the two separators, trailing => 4 total delimiters).
  const unescaped = (row.match(/(?<!\\)\|/g) || []).length;
  assert.equal(unescaped, 4);
});
