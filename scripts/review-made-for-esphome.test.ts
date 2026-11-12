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
import * as yaml from "js-yaml";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { execFileSync } from "node:child_process";

import {
  archiveUrl,
  nameViolatesEsphomeRule,
  collectMissingIds,
  collectBakedPasswords,
  collectManualIps,
  collectSecretRefs,
  placeholderSecretsYaml,
  runChecklist,
  improvBleCheck,
  IMPROV_BLE_KEY,
  LEGACY_IMPROV_BLE_KEY,
  LEGACY_IMPROV_BLE_KEY_ALLOWED,
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
  parseImportShorthand,
  importRawUrl,
  findCaseInsensitivePath,
  checkDashboardImport,
  checkAdoptedOta,
  reviewPage,
  runStreaming,
  stamp,
  parseEsphomeVersion,
  compareEsphomeVersions,
  minVersionFromConfigError,
  pickEsphomeRelease,
  ensureEsphomeVersion,
  type PageResult,
} from "./review-made-for-esphome.ts";

test("archiveUrl builds the codeload/Codeberg/GitLab archive URL per host", () => {
  assert.equal(
    archiveUrl({ host: "github.com", scheme: "github", owner: "Owner", repo: "Repo", ref: "main", filePath: "x.yaml" }),
    "https://codeload.github.com/Owner/Repo/tar.gz/main"
  );
  assert.equal(
    archiveUrl({ host: "codeberg.org", scheme: "codeberg", owner: "Owner", repo: "Repo", ref: "main", filePath: "x.yaml" }),
    "https://codeberg.org/Owner/Repo/archive/main.tar.gz"
  );
  assert.equal(
    archiveUrl({ host: "gitlab.com", scheme: "gitlab", owner: "Owner", repo: "Repo", ref: "main", filePath: "x.yaml" }),
    "https://gitlab.com/Owner/Repo/-/archive/main.tar.gz"
  );
  assert.equal(
    archiveUrl({ host: "gitlab.com", scheme: "gitlab", owner: "group/sub", repo: "Repo", ref: "main", filePath: "x.yaml" }),
    "https://gitlab.com/group/sub/Repo/-/archive/main.tar.gz"
  );
  // A ref containing `/` (e.g. a branch named `feature/foo`) keeps its slash
  // in the archive URL rather than being escaped to `%2F`.
  assert.equal(
    archiveUrl({ host: "github.com", scheme: "github", owner: "Owner", repo: "Repo", ref: "feature/foo", filePath: "x.yaml" }),
    "https://codeload.github.com/Owner/Repo/tar.gz/feature/foo"
  );
  // A ref with a space is percent-encoded.
  assert.equal(
    archiveUrl({ host: "github.com", scheme: "github", owner: "Owner", repo: "Repo", ref: "v 1", filePath: "x.yaml" }),
    "https://codeload.github.com/Owner/Repo/tar.gz/v%201"
  );
  // A nested GitLab owner keeps its slash.
  assert.equal(
    archiveUrl({ host: "gitlab.com", scheme: "gitlab", owner: "group/sub", repo: "Repo", ref: "v1", filePath: "x.yaml" }),
    "https://gitlab.com/group/sub/Repo/-/archive/v1.tar.gz"
  );
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

test("collectBakedPasswords flags every non-empty password, secrets included", () => {
  const cfg = {
    ota: [
      { platform: "esphome", password: "" }, // empty -> fine
      { platform: "http_request", password: "!secret ota_pw" }, // secret ref -> flag
    ],
    wifi: {
      // The Wi-Fi pair is NOT exempt: a shipped config must carry no
      // credentials at all, so both of these are flagged.
      ap: { password: "!secret wifi_password" },
      password: "!secret wifi_password",
    },
    // `key:` is not a password/psk key, so this is NOT a collectBakedPasswords
    // concern: a secret here is caught by collectSecretRefs instead.
    api: { encryption: { key: "!secret api_key" } },
    mqtt: { password: "hunter2" }, // literal -> flag
    some: { psk: "0011aabb" }, // psk literal -> flag
  };
  const out: string[] = [];
  collectBakedPasswords(cfg, [], out);
  assert.equal(out.length, 5, out.join(" | "));
  assert.ok(out.some((s) => s.includes("ota.1.password") && s.includes("ota_pw")));
  assert.ok(
    out.some(
      (s) => s.includes("wifi.password") && s.includes("!secret wifi_password")
    )
  );
  assert.ok(
    out.some(
      (s) =>
        s.includes("wifi.ap.password") && s.includes("!secret wifi_password")
    )
  );
  assert.ok(out.some((s) => s.includes("mqtt.password")));
  assert.ok(out.some((s) => s.includes("some.psk")));
  // A password key that is only whitespace still counts as empty.
  const blank: string[] = [];
  collectBakedPasswords({ ota: [{ password: "  " }] }, [], blank);
  assert.deepEqual(blank, []);
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

test("collectSecretRefs catches every secret, wifi pair included", () => {
  assert.deepEqual(
    [
      ...collectSecretRefs("a: !secret wifi_ssid\nb: !secret 'wifi_password'"),
    ].sort(),
    ["wifi_password", "wifi_ssid"]
  );
  const refs = collectSecretRefs("k: !secret api_key\nj: !secret ota_pw");
  assert.deepEqual([...refs].sort(), ["api_key", "ota_pw"]);
  assert.equal(collectSecretRefs("wifi:\n  ap: {}\n").size, 0);
});

// Secret names are arbitrary YAML keys. A name-character class of
// `[A-Za-z0-9_]` truncated hyphenated names (merging `ha-key` and `ha-token`
// into one `ha`) and matched no double-quoted name at all, which made the
// check silently pass on `!secret "wifi_ssid"`.
test("collectSecretRefs handles quoted, hyphenated and flow-style names", () => {
  assert.deepEqual([...collectSecretRefs('a: !secret "wifi_ssid"')], [
    "wifi_ssid",
  ]);
  assert.deepEqual(
    [...collectSecretRefs("a: !secret ha-key\nb: !secret ha-token")].sort(),
    ["ha-key", "ha-token"]
  );
  assert.deepEqual([...collectSecretRefs("a: !secret 'ha-key'")], ["ha-key"]);
  // Flow sequences and trailing comments must not swallow the terminator.
  assert.deepEqual(
    [...collectSecretRefs("a: [!secret one, !secret two]")].sort(),
    ["one", "two"]
  );
  assert.deepEqual([...collectSecretRefs("a: !secret three # comment")], [
    "three",
  ]);
  // The same name in different quoting styles is one secret.
  assert.deepEqual(
    [...collectSecretRefs("a: !secret k\nb: !secret 'k'\nc: !secret \"k\"")],
    ["k"]
  );
  // The regex is module-level; a previous call must not leave lastIndex set.
  assert.equal(collectSecretRefs("a: !secret k").size, 1);
  assert.equal(collectSecretRefs("a: !secret k").size, 1);
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
  // A compliant shipped config provisions Wi-Fi over Improv and carries no
  // credentials at all: no `ssid:`/`password:`, no `!secret` references.
  wifi: {
    ap: { password: "" },
  },
  improv_ble: {},
  improv_serial: {},
  dashboard_import: { package_import_url: "github://acme/widget/widget.yaml" },
  ota: [{ platform: "esphome", password: "" }],
  update: [{ platform: "http_request", id: "fw", name: "Firmware" }],
  logger: { baud_rate: 115200 },
  sensor: [{ platform: "uptime", id: "up", name: "Uptime" }],
};

test("runChecklist passes a compliant config", () => {
  const checks = runChecklist(GOOD_CFG, "wifi:\n  ap: {}\n", "Widget", "PASS");
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
    // no improv_ble, no dashboard_import, no ota, no update
    switch: [{ platform: "gpio", name: "Relay" }], // missing id
    api: { password: "hunter2" }, // baked password
  };
  const checks = runChecklist(cfg, "x: !secret api_key", "ESPHome Thing", "FAIL");
  const byItem = new Map(checks.map((c) => [c.item, c.status]));
  assert.equal(byItem.get("ESP32 or supported variant"), "FAIL");
  assert.equal(byItem.get('Project name free of "ESPHome"'), "FAIL");
  assert.equal(byItem.get("improv_ble (Wi-Fi provisioning)"), "MISSING");
  assert.equal(byItem.get("dashboard_import"), "MISSING");
  assert.equal(byItem.get("ota: `- platform: esphome`"), "MISSING");
  assert.equal(byItem.get("update: `- platform: http_request`"), "MISSING");
  assert.equal(byItem.get("No passwords in the configuration"), "FAIL");
  assert.equal(byItem.get("No references to secrets in the configuration"), "FAIL");
  assert.equal(byItem.get("No static IP addresses"), "FAIL");
  assert.equal(byItem.get("Every entity/component has an `id:`"), "MISSING");
  assert.equal(byItem.get("Compiles without user changes"), "FAIL");
});

// The rule the programme actually enforces: a manufacturer's shipped config
// must contain NO secrets, the `wifi_ssid`/`wifi_password` pair included.
// Users provision their own Wi-Fi credentials, so baking the pair in only
// leaves dummy values in device storage; secrets belong in the config the user
// ends up with after taking control.
test("runChecklist fails a shipped config that references the Wi-Fi secrets", () => {
  const cfg = {
    ...GOOD_CFG,
    wifi: {
      ssid: "!secret wifi_ssid",
      password: "!secret wifi_password",
      ap: { password: "" },
    },
  };
  const expanded = [
    "wifi:",
    "  ssid: !secret wifi_ssid",
    "  password: !secret wifi_password",
    "",
  ].join("\n");
  const checks = runChecklist(cfg, expanded, "Widget", "PASS");
  const byItem = new Map(checks.map((c) => [c.item, c]));

  const passwords = byItem.get("No passwords in the configuration")!;
  assert.equal(passwords.status, "FAIL");
  assert.ok(passwords.detail.includes("wifi.password"));
  assert.ok(passwords.detail.includes("!secret wifi_password"));

  const secrets = byItem.get("No references to secrets in the configuration")!;
  assert.equal(secrets.status, "FAIL");
  assert.ok(secrets.detail.includes("!secret wifi_ssid"));
  assert.ok(secrets.detail.includes("!secret wifi_password"));

  // Everything else about the config is fine; these two are the only
  // failures, and they are enough to block the page.
  assert.deepEqual(
    checks
      .filter((c) => c.status === "FAIL" || c.status === "MISSING")
      .map((c) => c.item),
    [
      "No passwords in the configuration",
      "No references to secrets in the configuration",
    ]
  );
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
  assert.equal(pageBlocks(result), true);
});

// The placeholder secrets are the review tool's own, written so that a config
// referencing the Wi-Fi pair still expands and compiles; they must never
// double as an allowlist for the checks above.
test("placeholderSecretsYaml keeps the compile step working", () => {
  const body = placeholderSecretsYaml();
  assert.equal(
    body,
    'wifi_ssid: "placeholder_ssid"\nwifi_password: "placeholder_password"\n'
  );
  const parsed = yaml.load(body) as Record<string, string>;
  assert.deepEqual(Object.keys(parsed).sort(), ["wifi_password", "wifi_ssid"]);
  // Exactly the names the checklist now flags: supplying them lets
  // `esphome config`/`compile` run, while the config is still reported as
  // non-compliant.
  const flagged = collectSecretRefs(
    "a: !secret wifi_ssid\nb: !secret wifi_password"
  );
  assert.deepEqual([...flagged].sort(), Object.keys(parsed).sort());
});

// ---------------------------------------------------------------------------
// Signed firmware without network OTA (signed_ota_verification)
// ---------------------------------------------------------------------------

const OTA_ITEM = "ota: `- platform: esphome`";
const otaRow = (checks: { item: string }[]) =>
  checks.find((c) => c.item === OTA_ITEM) as { status: string; detail: string };
const { ota: _ota, ...NO_OTA_CFG } = GOOD_CFG;
const signedEsp32 = {
  ...GOOD_CFG.esp32,
  framework: { type: "esp-idf", advanced: { signed_ota_verification: { signing_scheme: "rsa3072" } } },
};
const SIGNED_CFG = { ...NO_OTA_CFG, esp32: signedEsp32 };
const { improv_serial: _is, ...SIGNED_NO_SERIAL_CFG } = SIGNED_CFG;
const { improv_serial: _is2, ...NO_OTA_NO_SERIAL } = NO_OTA_CFG;

const SERIAL_ITEM = "improv_serial (USB provisioning)";
const serialRow = (checks: { item: string }[]) =>
  checks.find((c) => c.item === SERIAL_ITEM) as { status: string; detail: string };

test("runChecklist: signed firmware with a web_server OTA endpoint gets no exception", () => {
  const cfg = { ...SIGNED_CFG, ota: [{ platform: "web_server" }] };
  const checks = runChecklist(cfg, "", "Widget", "PASS");
  const row = otaRow(checks);
  assert.equal(row.status, "MISSING");
  assert.ok(row.detail.includes("web_server"));
  // Not USB-only, so improv_serial is no longer forced to block.
  const { improv_serial: _x, ...noSerial } = cfg;
  assert.equal(serialRow(runChecklist(noSerial, "", "Widget", "PASS")).status, "NEEDS-HUMAN-CHECK");
  // The single-mapping form of `ota:` is read the same way.
  assert.equal(otaRow(runChecklist({ ...SIGNED_CFG, ota: { platform: "web_server" } }, "", "W", "PASS")).status, "MISSING");
  assert.equal(otaRow(runChecklist({ ...SIGNED_CFG, ota: { platform: "esphome" } }, "", "W", "PASS")).status, "OK");
});

test("checkAdoptedOta skips signed firmware that has a web_server OTA endpoint", async () => {
  const never = async () => { throw new Error("must not fetch"); };
  const cfg = { ...SIGNED_IMPORT_CFG, ota: [{ platform: "web_server" }] };
  assert.equal(await checkAdoptedOta(cfg, UPSTREAM, never), null);
});

test("runChecklist: no esphome ota is accepted only for signed firmware", () => {
  // Signed firmware: accepted pending a human check of USB flashing.
  let checks = runChecklist(SIGNED_CFG, "", "Widget", "PASS");
  let row = otaRow(checks);
  assert.equal(row.status, "NEEDS-HUMAN-CHECK");
  assert.ok(row.detail.includes("no keys and no disassembly"));
  assert.equal(serialRow(checks).status, "OK");
  // Not signed: blocks, and the message names the alternative.
  row = otaRow(runChecklist(NO_OTA_CFG, "", "Widget", "PASS"));
  assert.equal(row.status, "MISSING");
  assert.ok(row.detail.includes("signed_ota_verification"));
  // An esp32 block without framework/advanced, or with advanced lacking the key, is not signed.
  for (const esp32 of [
    { ...GOOD_CFG.esp32, framework: { type: "esp-idf" } },
    { ...GOOD_CFG.esp32, framework: { advanced: { enable_ota_rollback: true } } },
  ]) {
    assert.equal(otaRow(runChecklist({ ...NO_OTA_CFG, esp32 }, "", "Widget", "PASS")).status, "MISSING");
  }
  // Having esphome OTA keeps passing.
  assert.equal(otaRow(runChecklist(GOOD_CFG, "", "Widget", "PASS")).status, "OK");
  // Entries that are not mappings are ignored.
  assert.equal(otaRow(runChecklist({ ...NO_OTA_CFG, ota: ["x"] }, "", "Widget", "PASS")).status, "MISSING");

  // Signed with no network OTA but no improv_serial: its own row fails, and explains why.
  checks = runChecklist(SIGNED_NO_SERIAL_CFG, "", "Widget", "PASS");
  const serial = serialRow(checks);
  assert.equal(serial.status, "MISSING");
  assert.ok(serial.detail.includes("a device with a USB port must have `improv_serial:`"));
  assert.ok(!serial.detail.includes("flashed"));
  const result = {
    page: "p", url: "u", fenceMissing: false, fatalError: null, configOk: true,
    configInconclusive: false, configError: null, compile: "PASS", compileLog: null, checks,
  } as PageResult;
  assert.equal(pageBlocks(result), true);

  // Signed but with esphome OTA, or unsigned with no OTA: improv_serial stays a human check.
  const { improv_serial: _x, ...noSerial } = GOOD_CFG;
  assert.equal(serialRow(runChecklist({ ...noSerial, esp32: signedEsp32 }, "", "W", "PASS")).status, "NEEDS-HUMAN-CHECK");
  assert.equal(serialRow(runChecklist({ ...NO_OTA_NO_SERIAL, }, "", "W", "PASS")).status, "NEEDS-HUMAN-CHECK");
});

const ADOPTED_ITEM = "Adopted config has `ota: - platform: esphome`";
const SIGNED_IMPORT_CFG = {
  ...SIGNED_CFG,
  dashboard_import: { package_import_url: "github://owner/repo/packages/core.yaml@main" },
};
const UPSTREAM = {
  host: "github.com", scheme: "github", owner: "owner", repo: "repo", ref: "main", filePath: "factory.yaml",
} as const;
const okBody = (body: string) => async () => new Response(body, { status: 200 });

test("checkAdoptedOta only applies to signed firmware without ESPHome OTA", async () => {
  const never = async () => { throw new Error("must not fetch"); };
  // Has ESPHome OTA, or is not signed, or has no usable dashboard_import: nothing to check.
  assert.equal(await checkAdoptedOta({ ...SIGNED_IMPORT_CFG, ota: [{ platform: "esphome" }] }, UPSTREAM, never), null);
  assert.equal(await checkAdoptedOta({ ...NO_OTA_CFG, dashboard_import: SIGNED_IMPORT_CFG.dashboard_import }, UPSTREAM, never), null);
  const { dashboard_import: _di, ...signedNoImport } = SIGNED_CFG;
  assert.equal(await checkAdoptedOta(signedNoImport, UPSTREAM, never), null);
  assert.equal(await checkAdoptedOta({ ...SIGNED_CFG, dashboard_import: { package_import_url: "nope" } }, UPSTREAM, never), null);
});

test("checkAdoptedOta reads the imported package", async () => {
  const withOta = yaml.dump({ ota: [{ platform: "esphome", id: "o" }] });
  let r = await checkAdoptedOta(SIGNED_IMPORT_CFG, UPSTREAM, okBody(withOta));
  assert.equal(r?.item, ADOPTED_ITEM);
  assert.equal(r?.status, "OK");

  // The mapping form of `ota:` counts, as ESPHome accepts it.
  r = await checkAdoptedOta(SIGNED_IMPORT_CFG, UPSTREAM, okBody("ota:\n  platform: esphome\n"));
  assert.equal(r?.status, "OK");

  // OTA present but the raw file includes packages that were not expanded: a human checks.
  r = await checkAdoptedOta(SIGNED_IMPORT_CFG, UPSTREAM, okBody(`${withOta}packages:\n  extra: !include missing.yaml\n`));
  assert.equal(r?.status, "NEEDS-HUMAN-CHECK");
  assert.ok(r?.detail.includes("were not expanded"));

  // Package without it directly but with nested packages: a human checks.
  r = await checkAdoptedOta(SIGNED_IMPORT_CFG, UPSTREAM, okBody("packages:\n  core: !include core.yaml\n"));
  assert.equal(r?.status, "NEEDS-HUMAN-CHECK");
  assert.ok(r?.detail.includes("no `ota: - platform: esphome` found directly"));

  // No ota and no packages: nothing can supply it, definitively missing.
  for (const body of ["wifi: {}\n", "- just\n- a list\n"]) {
    r = await checkAdoptedOta(SIGNED_IMPORT_CFG, UPSTREAM, okBody(body));
    assert.equal(r?.status, "MISSING", body);
    assert.ok(r?.detail.includes("includes no packages"));
  }

  // Unreadable package.
  r = await checkAdoptedOta(SIGNED_IMPORT_CFG, UPSTREAM, okBody("a: [unclosed\n"));
  assert.equal(r?.status, "NEEDS-HUMAN-CHECK");
  assert.ok(r?.detail.includes("did not parse"));
  r = await checkAdoptedOta(SIGNED_IMPORT_CFG, UPSTREAM, async () => new Response("", { status: 404 }));
  assert.equal(r?.status, "NEEDS-HUMAN-CHECK");
  assert.ok(r?.detail.includes("HTTP 404"));
  r = await checkAdoptedOta(SIGNED_IMPORT_CFG, UPSTREAM, async () => { throw new Error("boom"); });
  assert.equal(r?.status, "NEEDS-HUMAN-CHECK");
  assert.ok(r?.detail.includes("boom"));
});

test("checkAdoptedOta stops waiting when the body read stalls", async () => {
  const prev = process.env.MANIFEST_TIMEOUT_MS;
  process.env.MANIFEST_TIMEOUT_MS = "50";
  try {
    let aborted = false;
    const stalled = async (_url: string, signal: AbortSignal): Promise<Response> => {
      signal.addEventListener("abort", () => { aborted = true; });
      // Headers arrive, the body never does.
      return new Response(new ReadableStream({ start() {} }), { status: 200 });
    };
    const r = await checkAdoptedOta(SIGNED_IMPORT_CFG, UPSTREAM, stalled);
    assert.equal(r?.status, "NEEDS-HUMAN-CHECK");
    assert.ok(r?.detail.includes("timed out after 50 ms"));
    assert.ok(aborted);
  } finally {
    if (prev === undefined) delete process.env.MANIFEST_TIMEOUT_MS;
    else process.env.MANIFEST_TIMEOUT_MS = prev;
  }
});

test("checkAdoptedOta fetches with the default fetcher", async () => {
  const server = http.createServer((_req, res) => res.end(yaml.dump({ ota: [{ platform: "esphome" }] })));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    const cfg = {
      ...SIGNED_CFG,
      dashboard_import: { package_import_url: "github://owner/repo/packages/core.yaml@main" },
    };
    const realFetch = globalThis.fetch;
    globalThis.fetch = ((_url: string | URL | Request, init?: RequestInit) =>
      realFetch(`http://127.0.0.1:${port}/`, init)) as typeof fetch;
    try {
      const r = await checkAdoptedOta(cfg, UPSTREAM);
      assert.equal(r?.status, "OK");
    } finally {
      globalThis.fetch = realFetch;
    }
  } finally {
    server.close();
  }
});

test("checkAdoptedOta fails an import that points back at the reviewed config", async () => {
  const cfg = {
    ...SIGNED_CFG,
    dashboard_import: { package_import_url: "github://Owner/Repo/factory.yaml@main" },
  };
  const r = await checkAdoptedOta(cfg, UPSTREAM, async () => { throw new Error("must not fetch"); });
  assert.equal(r?.status, "MISSING");
  assert.ok(r?.detail.includes("points at the reviewed config itself"));
  // A different or omitted ref can name another version of the file: fetch the adoption target instead.
  const body = okBody(yaml.dump({ ota: [{ platform: "esphome" }] }));
  for (const ref of ["@user-main", ""]) {
    const withRef = { ...SIGNED_CFG, dashboard_import: { package_import_url: `github://owner/repo/factory.yaml${ref}` } };
    const fetched = await checkAdoptedOta(withRef, UPSTREAM, body);
    assert.equal(fetched?.status, "OK", ref);
  }
  // A different file in the same repo is fetched instead.
  const other = await checkAdoptedOta(SIGNED_IMPORT_CFG, UPSTREAM, okBody(yaml.dump({ ota: [{ platform: "esphome" }] })));
  assert.equal(other?.status, "OK");
});

test("reviewPage adds the adopted-OTA row for signed firmware", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-rp-adopt-"));
  const repo = path.join(dir, "src", "repo-main");
  fs.mkdirSync(repo, { recursive: true });
  fs.writeFileSync(path.join(repo, "config.yaml"), "esphome:\n  name: x\n");
  const tarball = path.join(dir, "repo.tar.gz");
  execFileSync("tar", ["czf", tarball, "-C", path.join(dir, "src"), "repo-main"]);
  const bin = path.join(dir, "fake-esphome");
  fs.writeFileSync(bin, `#!/bin/sh\ncat <<'EOF_YAML'\n${yaml.dump(SIGNED_IMPORT_CFG)}EOF_YAML\n`, { mode: 0o755 });
  const page = path.join(dir, "index.md");
  fs.writeFileSync(
    page,
    "---\ntitle: Test\nmade-for-esphome: true\n---\n\n```yaml url=https://github.com/owner/repo/blob/main/config.yaml\n```\n"
  );
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) =>
    new URL(String(url)).hostname === "raw.githubusercontent.com"
      ? new Response(yaml.dump({ ota: [{ platform: "esphome" }] }), { status: 200 })
      : new Response(fs.readFileSync(tarball), { status: 200 })) as typeof fetch;
  const saved = process.env.MFE_OTA_MANIFEST;
  process.env.MFE_OTA_MANIFEST = "0";
  try {
    const r = await reviewPage(page, dir, bin, false);
    const row = r.checks.find((c) => c.item === ADOPTED_ITEM);
    assert.equal(row?.status, "OK", JSON.stringify(r.checks));
  } finally {
    globalThis.fetch = realFetch;
    if (saved === undefined) delete process.env.MFE_OTA_MANIFEST; else process.env.MFE_OTA_MANIFEST = saved;
  }
});

test("improv_ble is N/A when there is no wifi", () => {
  const cfg = { esphome: { name: "x" }, esp32: { board: "b" } };
  const checks = runChecklist(cfg, "", "x", "SKIPPED");
  const improv = checks.find((c) => c.item.startsWith(IMPROV_BLE_KEY));
  assert.equal(improv?.status, "N/A");
  assert.match(improv!.detail, /not applicable/);
});

// Two-phase `esp32_improv` -> `improv_ble` rename (ESPHome 2026.10.0, alias
// removed in 2027.4.0). Phase 1 accepts both keys; flipping
// LEGACY_IMPROV_BLE_KEY_ALLOWED to false starts failing the legacy one.
test("improv_ble: the current key passes", () => {
  const check = improvBleCheck({ [IMPROV_BLE_KEY]: {} }, true);
  assert.equal(check.status, "OK");
  assert.match(check.detail, /`improv_ble:` present/);
  // The current key is unaffected by the migration switch.
  assert.equal(improvBleCheck({ [IMPROV_BLE_KEY]: {} }, true, false).status, "OK");
});

test("improv_ble: the legacy key passes with a deprecation nudge while allowed", () => {
  const check = improvBleCheck({ [LEGACY_IMPROV_BLE_KEY]: {} }, true, true);
  assert.equal(check.status, "OK");
  assert.match(check.detail, /deprecated/);
  assert.match(check.detail, /rename it to `improv_ble:`/);
  assert.match(check.detail, /2027\.4\.0/);
});

test("improv_ble: the legacy key fails once the switch is flipped off", () => {
  const check = improvBleCheck({ [LEGACY_IMPROV_BLE_KEY]: {} }, true, false);
  assert.equal(check.status, "FAIL");
  assert.match(check.detail, /rename it to `improv_ble:`/);
});

test("improv_ble: neither key is MISSING", () => {
  const check = improvBleCheck({}, true);
  assert.equal(check.status, "MISSING");
  assert.match(check.detail, /no `improv_ble:` block/);
});

// The two tests above pin both phases explicitly. These last two follow
// whatever LEGACY_IMPROV_BLE_KEY_ALLOWED currently says, so flipping that one
// constant stays the whole of phase 2 - no test needs editing with it.
test("improv_ble: the legacy key follows the module-level switch by default", () => {
  const check = improvBleCheck({ [LEGACY_IMPROV_BLE_KEY]: {} }, true);
  assert.equal(check.status, LEGACY_IMPROV_BLE_KEY_ALLOWED ? "OK" : "FAIL");
  assert.match(check.detail, /rename it to `improv_ble:`/);
});

test("runChecklist routes the legacy improv key through the switch", () => {
  const cfg: Record<string, unknown> = {
    ...GOOD_CFG,
    [LEGACY_IMPROV_BLE_KEY]: {},
  };
  delete cfg[IMPROV_BLE_KEY];
  const checks = runChecklist(cfg, "wifi:\n  ap: {}\n", "Widget", "PASS");
  const improv = checks.find((c) => c.item.startsWith(IMPROV_BLE_KEY))!;
  assert.equal(improv.status, LEGACY_IMPROV_BLE_KEY_ALLOWED ? "OK" : "FAIL");
  assert.match(improv.detail, /rename it to `improv_ble:`/);
  // Nothing else about an otherwise-compliant config changes: the legacy key
  // is the only item the switch can turn red.
  assert.deepEqual(
    checks
      .filter((c) => c.status === "MISSING" || c.status === "FAIL")
      .map((c) => c.item),
    LEGACY_IMPROV_BLE_KEY_ALLOWED ? [] : [improv.item]
  );
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

// ---------------------------------------------------------------------------
// dashboard_import URL resolution
// ---------------------------------------------------------------------------

test("parseImportShorthand handles each host, ref and query", () => {
  assert.deepEqual(parseImportShorthand("github://o/r/dir/c.yaml@main"), {
    host: "github.com", owner: "o", repo: "r", filename: "dir/c.yaml", ref: "main", query: null,
  });
  assert.deepEqual(parseImportShorthand("codeberg://o/r.x_y/c.yaml"), {
    host: "codeberg.org", owner: "o", repo: "r.x_y", filename: "c.yaml", ref: null, query: null,
  });
  assert.deepEqual(parseImportShorthand("gitlab://o/r/c.yaml@v1.0/rc?next"), {
    host: "gitlab.com", owner: "o", repo: "r", filename: "c.yaml", ref: "v1.0/rc", query: "next",
  });
  assert.equal(parseImportShorthand("bitbucket://o/r/c.yaml"), null);
  assert.equal(parseImportShorthand("not a url"), null);
  assert.equal(parseImportShorthand("github://o/r"), null);
  assert.equal(parseImportShorthand("github://o/r/c.yaml@main junk"), null);
});

test("importRawUrl builds the raw URL per host and falls back to HEAD", () => {
  const base = { owner: "o", repo: "r", filename: "d/c.yaml", query: null };
  assert.equal(
    importRawUrl({ ...base, host: "github.com", ref: "main" }),
    "https://raw.githubusercontent.com/o/r/main/d/c.yaml"
  );
  assert.equal(
    importRawUrl({ ...base, host: "codeberg.org", ref: "v1" }),
    "https://codeberg.org/o/r/raw/commit/v1/d/c.yaml"
  );
  assert.equal(
    importRawUrl({ ...base, host: "gitlab.com", ref: null }),
    "https://gitlab.com/o/r/-/raw/HEAD/d/c.yaml"
  );
  assert.equal(
    importRawUrl({ ...base, host: "github.com", ref: null }),
    "https://raw.githubusercontent.com/o/r/HEAD/d/c.yaml"
  );
});

function makeTree(files: string[]): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-ci-"));
  for (const f of files) {
    const abs = path.join(root, f);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, "x");
  }
  return root;
}

test("findCaseInsensitivePath resolves case-differing paths", () => {
  const root = makeTree(["Mini/config.yaml", "Mini/Sub/File.YAML", "Other/a.yaml", "other/b.yaml"]);
  assert.equal(findCaseInsensitivePath(root, "Mini/config.yaml"), "Mini/config.yaml");
  assert.equal(findCaseInsensitivePath(root, "mini/CONFIG.yaml"), "Mini/config.yaml");
  assert.equal(findCaseInsensitivePath(root, "mini/sub/file.yaml"), "Mini/Sub/File.YAML");
  // Exact match wins when both `Other` and `other` exist.
  assert.equal(findCaseInsensitivePath(root, "other/b.yaml"), "other/b.yaml");
  assert.equal(findCaseInsensitivePath(root, "Other/a.yaml"), "Other/a.yaml");
  // Not found, directory rather than file, empty path, file used as a dir.
  assert.equal(findCaseInsensitivePath(root, "Mini/nope.yaml"), null);
  assert.equal(findCaseInsensitivePath(root, "mini"), null);
  assert.equal(findCaseInsensitivePath(root, ""), null);
  assert.equal(findCaseInsensitivePath(root, "Mini/config.yaml/deeper.yaml"), null);
  assert.equal(findCaseInsensitivePath(root, "../x.yaml"), null);
});

const UP = {
  host: "github.com", scheme: "github", owner: "Owner", repo: "Repo", ref: "main", filePath: "Mini/config.yaml",
} as const;
const cfgWith = (url: unknown): Record<string, unknown> => ({ dashboard_import: { package_import_url: url } });
const respond = (status: number) => async (): Promise<Response> => new Response(null, { status });

test("checkDashboardImport returns null when there is no URL to check", async () => {
  assert.equal(await checkDashboardImport({}, UP, "/nonexistent", respond(200)), null);
  assert.equal(await checkDashboardImport({ dashboard_import: "x" }, UP, "/nonexistent", respond(200)), null);
  assert.equal(await checkDashboardImport({ dashboard_import: {} }, UP, "/nonexistent", respond(200)), null);
  assert.equal(await checkDashboardImport(cfgWith(5), UP, "/nonexistent", respond(200)), null);
});

test("checkDashboardImport fails an unparsable shorthand", async () => {
  const r = await checkDashboardImport(cfgWith("https://example.com/x.yaml"), UP, "/nonexistent", respond(200));
  assert.equal(r?.status, "FAIL");
  assert.ok(r?.detail.includes("github://owner/repo/path/file.yaml@ref"));
});

test("checkDashboardImport OK on 200 and requests the raw URL", async () => {
  const seen: string[] = [];
  const r = await checkDashboardImport(cfgWith("github://Owner/Repo/Mini/config.yaml@main"), UP, "/nonexistent", async (u) => {
    seen.push(u);
    return new Response("body", { status: 200 });
  });
  assert.equal(r?.item, "dashboard_import URL resolves");
  assert.equal(r?.status, "OK");
  assert.deepEqual(seen, ["https://raw.githubusercontent.com/Owner/Repo/main/Mini/config.yaml"]);
  assert.ok(r?.detail.includes(seen[0]));
});

test("checkDashboardImport 404 adds a case hint for the reviewed repo", async () => {
  const root = makeTree(["Mini/config.yaml"]);
  const r = await checkDashboardImport(cfgWith("github://owner/repo/mini/config.yaml@main"), UP, root, respond(404));
  assert.equal(r?.status, "FAIL");
  assert.ok(r?.detail.includes("cannot import the config"));
  assert.ok(r?.detail.includes("`Mini/config.yaml` exists in the reviewed tree"));
  assert.ok(r?.detail.includes("case-sensitive"));
});

test("checkDashboardImport 404 gives no hint for other repos or no match", async () => {
  const root = makeTree(["Mini/config.yaml"]);
  // Different repo.
  let r = await checkDashboardImport(cfgWith("github://owner/other/mini/config.yaml@main"), UP, root, respond(404));
  assert.equal(r?.status, "FAIL");
  assert.ok(!r?.detail.includes("exists in the reviewed tree"));
  // Different owner.
  r = await checkDashboardImport(cfgWith("github://someone/repo/mini/config.yaml@main"), UP, root, respond(404));
  assert.ok(!r?.detail.includes("exists in the reviewed tree"));
  // Different host.
  r = await checkDashboardImport(cfgWith("gitlab://owner/repo/mini/config.yaml@main"), UP, root, respond(404));
  assert.ok(!r?.detail.includes("exists in the reviewed tree"));
  // Same repo but no such file at all.
  r = await checkDashboardImport(cfgWith("github://owner/repo/missing.yaml@main"), UP, root, respond(404));
  assert.equal(r?.status, "FAIL");
  assert.ok(!r?.detail.includes("exists in the reviewed tree"));
  // Same repo, exact path present in the tree (remote still 404s).
  r = await checkDashboardImport(cfgWith("github://owner/repo/Mini/config.yaml@main"), UP, root, respond(404));
  assert.equal(r?.status, "FAIL");
  assert.ok(!r?.detail.includes("exists in the reviewed tree"));
});

test("checkDashboardImport is inconclusive on other statuses and network errors", async () => {
  const url = "github://owner/repo/Mini/config.yaml@main";
  let r = await checkDashboardImport(cfgWith(url), UP, "/nonexistent", respond(500));
  assert.equal(r?.status, "NEEDS-HUMAN-CHECK");
  assert.ok(r?.detail.includes("HTTP 500"));
  r = await checkDashboardImport(cfgWith(url), UP, "/nonexistent", async () => {
    throw new Error("boom");
  });
  assert.equal(r?.status, "NEEDS-HUMAN-CHECK");
  assert.ok(r?.detail.includes("boom"));
});

test("a FAIL dashboard_import row blocks the page", () => {
  const page: PageResult = {
    page: "p", url: null, fenceMissing: false, fatalError: null, configOk: true,
    configInconclusive: false, configError: null, compile: "PASS", compileLog: null,
    checks: [{ item: "dashboard_import URL resolves", status: "FAIL", detail: "d" }],
  };
  assert.equal(pageBlocks(page), true);
});

LIVE("live: real fetcher resolves a correct-case import URL and rejects a wrong-case one", async () => {
  const up = { host: "github.com", scheme: "github", owner: "zuidwijk", repo: "slimmelezer", ref: "main", filePath: "Mini/config.yaml" } as const;
  const ok = await checkDashboardImport(cfgWith("github://zuidwijk/slimmelezer/Mini/config.yaml@main"), up, "/nonexistent");
  assert.equal(ok?.status, "OK", JSON.stringify(ok));
  const bad = await checkDashboardImport(cfgWith("github://zuidwijk/slimmelezer/mini/config.yaml@main"), up, "/nonexistent");
  assert.equal(bad?.status, "FAIL", JSON.stringify(bad));
});

LIVE("live: reviewPage flags a wrong-case package_import_url end to end", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-rp-"));
  const bin = path.join(dir, "fake-esphome");
  const canned = yaml.dump({
    esphome: { name: "x" },
    dashboard_import: { package_import_url: "github://zuidwijk/slimmelezer/mini/config.yaml@main" },
  });
  fs.writeFileSync(bin, `#!/bin/sh\ncat <<'EOF_YAML'\n${canned}EOF_YAML\n`, { mode: 0o755 });
  const page = path.join(dir, "index.md");
  fs.writeFileSync(
    page,
    "---\ntitle: Test\nmade-for-esphome: true\n---\n\n```yaml url=https://github.com/zuidwijk/SlimmeLezer/blob/main/Mini/config.yaml\n```\n"
  );
  const saved = { ota: process.env.MFE_OTA_MANIFEST, di: process.env.MFE_DASHBOARD_IMPORT_CHECK };
  process.env.MFE_OTA_MANIFEST = "0";
  delete process.env.MFE_DASHBOARD_IMPORT_CHECK;
  try {
    const r = await reviewPage(page, dir, bin, false);
    const row = r.checks.find((c) => c.item === "dashboard_import URL resolves");
    assert.equal(row?.status, "FAIL", JSON.stringify(r));
    assert.ok(row?.detail.includes("`Mini/config.yaml` exists in the reviewed tree"), row?.detail);
    assert.equal(pageBlocks(r), true);

    // Disabled via the env switch: no row.
    process.env.MFE_DASHBOARD_IMPORT_CHECK = "0";
    const off = await reviewPage(page, dir, bin, false);
    assert.ok(!off.checks.some((c) => c.item === "dashboard_import URL resolves"));
  } finally {
    if (saved.ota === undefined) delete process.env.MFE_OTA_MANIFEST; else process.env.MFE_OTA_MANIFEST = saved.ota;
    if (saved.di === undefined) delete process.env.MFE_DASHBOARD_IMPORT_CHECK; else process.env.MFE_DASHBOARD_IMPORT_CHECK = saved.di;
  }
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

// ---------------------------------------------------------------------------
// min_version handling
// ---------------------------------------------------------------------------

const V = (s: string) => parseEsphomeVersion(s)!;

test("parseEsphomeVersion handles ESPHome and PyPI spellings", () => {
  assert.deepEqual(V("2026.11.0"), { major: 2026, minor: 11, patch: 0, extra: "" });
  assert.deepEqual(V("2026.11"), { major: 2026, minor: 11, patch: 0, extra: "" });
  assert.deepEqual(V("2026.11.0b2"), { major: 2026, minor: 11, patch: 0, extra: "b2" });
  assert.deepEqual(V("2026.11.0-dev"), { major: 2026, minor: 11, patch: 0, extra: "dev" });
  assert.equal(parseEsphomeVersion("latest"), null);
});

test("compareEsphomeVersions orders like ESPHome (beta satisfies its own release)", () => {
  assert.equal(compareEsphomeVersions(V("2026.10.2"), V("2026.11.0")), -1);
  assert.equal(compareEsphomeVersions(V("2026.11.1"), V("2026.11.0")), 1);
  assert.equal(compareEsphomeVersions(V("2026.12.0"), V("2026.11.9")), 1);
  assert.equal(compareEsphomeVersions(V("2027.1.0"), V("2026.11.0")), 1);
  assert.equal(compareEsphomeVersions(V("2026.11.0"), V("2026.11.0")), 0);
  assert.equal(compareEsphomeVersions(V("2026.11.0b1"), V("2026.11.0")), 1);
  assert.equal(compareEsphomeVersions(V("2026.11.0"), V("2026.11.0b1")), -1);
});

test("minVersionFromConfigError reads ESPHome's too-old validation error", () => {
  const msg = (v: string) => `Failed config\n\nesphome: None\n  \n  Your ESPHome version is too old. Please update to at least ${v}.\n`;
  assert.equal(minVersionFromConfigError(msg("2026.11.0")), "2026.11.0");
  assert.equal(minVersionFromConfigError(msg("2026.11.0-b2")), "2026.11.0-b2");
  // Colour codes around the message are ignored.
  assert.equal(minVersionFromConfigError("\x1b[31mYour ESPHome version is too old. Please update to at least 2026.11.0\x1b[0m"), "2026.11.0");
  // Other config errors do not match.
  assert.equal(minVersionFromConfigError("Component not found: bogus\n"), null);
  assert.equal(minVersionFromConfigError(""), null);
});

test("pickEsphomeRelease prefers stable, falls back to the newest beta", () => {
  const releases = ["2026.9.0", "2026.10.2", "2026.11.0b1", "2026.11.0b10", "2026.11.0b2", "2026.12.0b1", "2026.11.0rc1", "junk"];
  // A stable release already satisfies the minimum: newest stable wins.
  assert.equal(pickEsphomeRelease(V("2026.10.0"), releases), "2026.10.2");
  // 2026.11.0 not out yet: newest beta of that release (numeric, so b10 > b2).
  assert.equal(pickEsphomeRelease(V("2026.11.0"), releases.filter((r) => r !== "2026.12.0b1")), "2026.11.0b10");
  // A newer beta base beats an older base.
  assert.equal(pickEsphomeRelease(V("2026.11.0"), releases), "2026.12.0b1");
  // Older base listed after the newest one does not displace it.
  assert.equal(pickEsphomeRelease(V("2026.11.0"), ["2026.12.0b1", "2026.11.0b4"]), "2026.12.0b1");
  // Stable in a list where a later stable is older.
  assert.equal(pickEsphomeRelease(V("2026.9.0"), ["2026.10.2", "2026.9.0"]), "2026.10.2");
  // Nothing satisfies it.
  assert.equal(pickEsphomeRelease(V("2027.1.0"), releases), null);
});

function fakeEsphome(version: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-ens-"));
  const bin = path.join(dir, "esphome");
  fs.writeFileSync(bin, `#!/bin/sh\necho "Version: ${version}"\n`, { mode: 0o755 });
  return bin;
}

function pypiResponse(releases: Record<string, boolean>): Response {
  const body: Record<string, { yanked: boolean }[]> = {};
  for (const [name, yanked] of Object.entries(releases)) body[name] = [{ yanked }];
  body["0.0.1"] = [];
  return new Response(JSON.stringify({ releases: body }), { status: 200 });
}

test("ensureEsphomeVersion leaves a new-enough or unknown install alone", async () => {
  const deps = {
    fetcher: async () => { throw new Error("must not fetch"); },
    install: () => { throw new Error("must not install"); },
  };
  assert.deepEqual(await ensureEsphomeVersion(fakeEsphome("2026.10.2"), "2026.10.0", deps), { ok: true });
  assert.deepEqual(await ensureEsphomeVersion(fakeEsphome("2026.11.0b1"), "2026.11.0", deps), { ok: true });
  // Unparseable min_version: ESPHome reports it.
  assert.deepEqual(await ensureEsphomeVersion(fakeEsphome("2026.10.2"), "soon", deps), { ok: true });
  // Binary that does not print a version.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-ens-"));
  const odd = path.join(dir, "esphome");
  fs.writeFileSync(odd, "#!/bin/sh\necho hello\n", { mode: 0o755 });
  assert.deepEqual(await ensureEsphomeVersion(odd, "2026.11.0", deps), { ok: true });
  // Binary that does not exist / fails.
  assert.deepEqual(await ensureEsphomeVersion(path.join(dir, "nope"), "2026.11.0", deps), { ok: true });
});

test("ensureEsphomeVersion installs the stable release when it is out", async () => {
  const installed: string[] = [];
  const r = await ensureEsphomeVersion(fakeEsphome("2026.10.2"), "2026.11.0", {
    fetcher: async () => pypiResponse({ "2026.10.2": false, "2026.11.0": false, "2026.11.0b1": false }),
    install: (rel) => (installed.push(rel), { ok: true, output: "" }),
  });
  assert.deepEqual(r, { ok: true });
  assert.deepEqual(installed, ["2026.11.0"]);
});

test("ensureEsphomeVersion falls back to a beta and skips yanked releases", async () => {
  const installed: string[] = [];
  const r = await ensureEsphomeVersion(fakeEsphome("2026.10.2"), "2026.11.0", {
    fetcher: async () => pypiResponse({ "2026.10.2": false, "2026.11.0b1": false, "2026.11.0b2": true }),
    install: (rel) => (installed.push(rel), { ok: true, output: "" }),
  });
  assert.deepEqual(r, { ok: true });
  assert.deepEqual(installed, ["2026.11.0b1"]);
});

test("ensureEsphomeVersion reports failures instead of throwing", async () => {
  const bin = fakeEsphome("2026.10.2");
  const install = () => { throw new Error("must not install"); };
  // No release satisfies the minimum.
  let r = await ensureEsphomeVersion(bin, "2099.1.0", { fetcher: async () => pypiResponse({ "2026.10.2": false }), install });
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.message.includes("newer than any ESPHome stable or beta release"));
  // PyPI returns a payload without releases.
  r = await ensureEsphomeVersion(bin, "2026.11.0", {
    fetcher: async () => new Response("{}", { status: 200 }),
    install,
  });
  assert.equal(r.ok, false);
  // PyPI HTTP error.
  r = await ensureEsphomeVersion(bin, "2026.11.0", { fetcher: async () => new Response("", { status: 503 }), install });
  assert.ok(!r.ok && r.message.includes("HTTP 503"));
  // PyPI unreachable.
  r = await ensureEsphomeVersion(bin, "2026.11.0", { fetcher: async () => { throw new Error("offline"); }, install });
  assert.ok(!r.ok && r.message.includes("offline"));
  // pip fails.
  r = await ensureEsphomeVersion(bin, "2026.11.0", {
    fetcher: async () => pypiResponse({ "2026.11.0": false }),
    install: () => ({ ok: false, output: "no network" }),
  });
  assert.ok(!r.ok && r.message.includes("installing esphome==2026.11.0") && r.message.includes("no network"));
});

test("ensureEsphomeVersion default deps hit PyPI and pip (stubbed endpoints)", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-ens-"));
  const log = path.join(dir, "pip.log");
  const okPip = path.join(dir, "pip-ok");
  const badPip = path.join(dir, "pip-bad");
  fs.writeFileSync(okPip, `#!/bin/sh\necho "$@" > ${log}\n`, { mode: 0o755 });
  fs.writeFileSync(badPip, "#!/bin/sh\nexit 1\n", { mode: 0o755 });
  const server = http.createServer((_req, res) => {
    res.end(JSON.stringify({ releases: { "2026.11.0b1": [{ yanked: false }] } }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  const saved = { pip: process.env.MFE_PIP, url: process.env.MFE_PYPI_URL };
  process.env.MFE_PYPI_URL = `http://127.0.0.1:${port}/`;
  try {
    process.env.MFE_PIP = okPip;
    assert.deepEqual(await ensureEsphomeVersion(fakeEsphome("2026.10.2"), "2026.11.0"), { ok: true });
    assert.equal(fs.readFileSync(log, "utf8").trim(), "install --upgrade esphome==2026.11.0b1");
    process.env.MFE_PIP = badPip;
    const r = await ensureEsphomeVersion(fakeEsphome("2026.10.2"), "2026.11.0");
    assert.equal(r.ok, false);
  } finally {
    server.close();
    if (saved.pip === undefined) delete process.env.MFE_PIP; else process.env.MFE_PIP = saved.pip;
    if (saved.url === undefined) delete process.env.MFE_PYPI_URL; else process.env.MFE_PYPI_URL = saved.url;
  }
});

test("reviewPage upgrades ESPHome when config fails on a too-old min_version", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-rp-mv-"));
  const repo = path.join(dir, "src", "repo-main");
  fs.mkdirSync(repo, { recursive: true });
  fs.writeFileSync(path.join(repo, "config.yaml"), "esphome:\n  name: x\n");
  const tarball = path.join(dir, "repo.tar.gz");
  execFileSync("tar", ["czf", tarball, "-C", path.join(dir, "src"), "repo-main"]);
  const marker = path.join(dir, "upgraded");
  // Behaves like an ESPHome that is too old until the marker file exists.
  const makeBin = (name: string, failure: string) => {
    const bin = path.join(dir, name);
    fs.writeFileSync(
      bin,
      `#!/bin/sh\nif [ -f ${marker} ]; then\ncat <<'EOF_YAML'\n${yaml.dump({ esphome: { name: "x" } })}EOF_YAML\nelse\necho "${failure}"\nexit 2\nfi\n`,
      { mode: 0o755 }
    );
    return bin;
  };
  const oldBin = makeBin("old-esphome", "Your ESPHome version is too old. Please update to at least 2026.11.0.");
  const brokenBin = makeBin("broken-esphome", "Component not found: bogus");
  const page = path.join(dir, "index.md");
  fs.writeFileSync(
    page,
    "---\ntitle: Test\nmade-for-esphome: true\n---\n\n```yaml url=https://github.com/owner/repo/blob/main/config.yaml\n```\n"
  );

  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(fs.readFileSync(tarball), { status: 200 })) as typeof fetch;
  const saved = { ota: process.env.MFE_OTA_MANIFEST, di: process.env.MFE_DASHBOARD_IMPORT_CHECK };
  process.env.MFE_OTA_MANIFEST = "0";
  process.env.MFE_DASHBOARD_IMPORT_CHECK = "0";
  try {
    const seen: string[] = [];
    const upgrade = async (_bin: string, min: string) => {
      seen.push(min);
      fs.writeFileSync(marker, "");
      return { ok: true } as const;
    };

    // Too old: ensured with the minimum ESPHome asked for, then config runs again and passes.
    let r = await reviewPage(page, dir, oldBin, false, upgrade);
    assert.deepEqual(seen, ["2026.11.0"]);
    assert.equal(r.configOk, true);
    assert.equal(r.configInconclusive, false);

    // Cannot be satisfied: inconclusive (not blocking), no second config run.
    fs.rmSync(marker);
    r = await reviewPage(page, dir, oldBin, false, async () => ({ ok: false, message: "not released" }));
    assert.equal(r.configInconclusive, true);
    assert.equal(r.configError, "not released");
    assert.equal(r.configOk, null);
    assert.equal(pageBlocks(r), false);

    // An ordinary config failure never triggers an upgrade.
    seen.length = 0;
    r = await reviewPage(page, dir, brokenBin, false, upgrade);
    assert.deepEqual(seen, []);
    assert.equal(r.configOk, false);

    // A config that already works never triggers one either.
    fs.writeFileSync(marker, "");
    r = await reviewPage(page, dir, oldBin, false, upgrade);
    assert.deepEqual(seen, []);
    assert.equal(r.configOk, true);
  } finally {
    globalThis.fetch = realFetch;
    if (saved.ota === undefined) delete process.env.MFE_OTA_MANIFEST; else process.env.MFE_OTA_MANIFEST = saved.ota;
    if (saved.di === undefined) delete process.env.MFE_DASHBOARD_IMPORT_CHECK; else process.env.MFE_DASHBOARD_IMPORT_CHECK = saved.di;
  }
});

// Run `fn` with console.log captured, returning the lines it printed.
async function captureLog(fn: () => Promise<void>): Promise<string[]> {
  const lines: string[] = [];
  const real = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.join(" "));
  };
  try {
    await fn();
  } finally {
    console.log = real;
  }
  return lines;
}

const LIMITS = { captureLimit: 1024 * 1024, keepTail: true };

test("stamp is an mm:ss elapsed-time prefix", () => {
  assert.match(stamp(), /^\[\d{2,}:\d{2}\]$/);
});

test("runStreaming captures output and echoes complete lines live", async () => {
  let res: Awaited<ReturnType<typeof runStreaming>> | undefined;
  const lines = await captureLog(async () => {
    res = await runStreaming("sh", ["-c", "printf 'one\\n\\ntwo\\n'; printf 'err\\n' >&2; printf 'tail'"], {
      timeoutMs: 10000,
      stream: true,
      label: "test",
      ...LIMITS,
    });
  });
  assert.equal(res?.ok, true);
  assert.equal(res?.timedOut, false);
  assert.equal(res?.stdout, "one\n\ntwo\ntail");
  assert.equal(res?.stderr, "err\n");
  // Blank lines are skipped, the unterminated tail is flushed on exit.
  assert.deepEqual(lines.sort(), ["    | err", "    | one", "    | tail", "    | two"]);
});

test("runStreaming stays quiet when streaming is off and reports a non-zero exit", async () => {
  let res: Awaited<ReturnType<typeof runStreaming>> | undefined;
  const lines = await captureLog(async () => {
    res = await runStreaming("sh", ["-c", "echo hidden; exit 3"], { timeoutMs: 10000, stream: false, label: "test", ...LIMITS });
  });
  assert.deepEqual(lines, []);
  assert.equal(res?.ok, false);
  assert.equal(res?.timedOut, false);
  assert.equal(res?.stdout, "hidden\n");
});

test("runStreaming reports a command that cannot be spawned", async () => {
  const res = await runStreaming("/nonexistent/mfe-bin", [], { timeoutMs: 10000, stream: false, label: "test", ...LIMITS });
  assert.equal(res.ok, false);
  assert.match(res.stderr, /ENOENT/);
});

test("runStreaming kills a command at the timeout and prints a heartbeat while silent", async () => {
  let res: Awaited<ReturnType<typeof runStreaming>> | undefined;
  const lines = await captureLog(async () => {
    res = await runStreaming("sleep", ["5"], { timeoutMs: 700, stream: true, label: "sleeper", heartbeatMs: 100, ...LIMITS });
  });
  assert.equal(res?.ok, false);
  assert.equal(res?.timedOut, true);
  assert.ok(lines.some((l) => /sleeper still running \(\d+s, no new output\)/.test(l)), lines.join("\n"));
});

test("runStreaming bounds the pending line buffer and splits on carriage returns", async () => {
  let res: Awaited<ReturnType<typeof runStreaming>> | undefined;
  const lines = await captureLog(async () => {
    res = await runStreaming("sh", ["-c", "printf 'a\\rb\\rc'; printf 'xxxxxxxxxxxx'"], {
      timeoutMs: 10000,
      stream: true,
      label: "cr",
      maxLineChars: 5,
      ...LIMITS,
    });
  });
  assert.equal(res?.ok, true);
  // "a" and "b" end at carriage returns; the unterminated rest exceeds the
  // 5 character bound and is echoed instead of being held back.
  assert.deepEqual(lines, ["    | a", "    | b", "    | cxxxxxxxxxxxx"]);
});

test("runStreaming echoes a line while the child is still running", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-live-"));
  const release = path.join(dir, "release");
  const real = console.log;
  const lines: string[] = [];
  console.log = (...args: unknown[]) => {
    lines.push(args.join(" "));
  };
  try {
    const done = runStreaming(
      "sh",
      ["-c", `echo first; while [ ! -f ${release} ]; do sleep 0.05; done; echo last`],
      { timeoutMs: 30000, stream: true, label: "live", ...LIMITS }
    );
    // The child cannot exit until released, so seeing "first" proves it was
    // echoed before exit rather than buffered until the end.
    const deadline = Date.now() + 10000;
    while (!lines.includes("    | first") && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 20));
    }
    assert.ok(lines.includes("    | first"), "first line was not echoed while the child ran");
    assert.equal(lines.includes("    | last"), false);
    fs.writeFileSync(release, "");
    const res = await done;
    assert.equal(res.ok, true);
    assert.ok(lines.includes("    | last"));
  } finally {
    console.log = real;
  }
});

test("runStreaming timeout takes down the whole process tree", async () => {
  const started = Date.now();
  const res = await runStreaming("sh", ["-c", "sleep 30 & sleep 30"], {
    timeoutMs: 200,
    stream: false,
    label: "tree",
    graceMs: 20000,
    ...LIMITS,
  });
  assert.equal(res.timedOut, true);
  // Settled by the pipes closing after the group kill, not by the grace timer.
  assert.ok(Date.now() - started < 10000);
});

test("runStreaming settles after the grace period when a descendant escapes the group", async () => {
  const started = Date.now();
  const res = await runStreaming("sh", ["-c", "setsid sleep 4 & sleep 30"], {
    timeoutMs: 200,
    stream: false,
    label: "escape",
    graceMs: 200,
    ...LIMITS,
  });
  assert.equal(res.ok, false);
  assert.equal(res.timedOut, true);
  assert.ok(Date.now() - started < 3000, `took ${Date.now() - started}ms`);
});

test("runStreaming sweeps a SIGTERM-ignoring descendant when the direct child exits first", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-sweep-"));
  const pidFile = path.join(dir, "pid");
  // The descendant ignores SIGTERM and has its output redirected, so the pipes
  // close as soon as the direct child dies and the run settles before the grace
  // period; only the final group sweep can stop it.
  const res = await runStreaming(
    "sh",
    ["-c", `sh -c 'trap "" TERM; echo $$ > ${pidFile}; exec sleep 20' >/dev/null 2>&1 & sleep 30`],
    { timeoutMs: 500, stream: false, label: "sweep", graceMs: 20000, ...LIMITS }
  );
  assert.equal(res.timedOut, true);
  const pid = Number(fs.readFileSync(pidFile, "utf8"));
  const alive = (): boolean => {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  };
  const deadline = Date.now() + 5000;
  while (alive() && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 20));
  }
  assert.equal(alive(), false, "descendant survived the run");
});

test("runStreaming arms only one grace timer when a timeout follows an overflow", async () => {
  const started = Date.now();
  const res = await runStreaming("sh", ["-c", "setsid sleep 3 & yes x | head -c 100000; sleep 30"], {
    timeoutMs: 200,
    stream: false,
    label: "double",
    captureLimit: 100,
    keepTail: false,
    graceMs: 500,
  });
  assert.equal(res.ok, false);
  assert.match(res.stderr, /output exceeded 100 characters/);
  assert.ok(Date.now() - started < 2500);
});

test("runStreaming keeps only the tail when output exceeds the limit", async () => {
  const res = await runStreaming("sh", ["-c", "i=0; while [ $i -lt 500 ]; do echo line$i; i=$((i+1)); done"], {
    timeoutMs: 10000,
    stream: false,
    label: "tail",
    captureLimit: 100,
    keepTail: true,
  });
  assert.equal(res.ok, true);
  assert.ok(res.stdout.length <= 100);
  assert.ok(res.stdout.endsWith("line499\n"));
});

test("runStreaming fails and stops the child when whole output exceeds the limit", async () => {
  const res = await runStreaming("sh", ["-c", "yes x | head -c 100000; sleep 30"], {
    timeoutMs: 20000,
    stream: false,
    label: "overflow",
    captureLimit: 100,
    keepTail: false,
    graceMs: 200,
  });
  assert.equal(res.ok, false);
  assert.match(res.stderr, /output exceeded 100 characters/);
});

test("reviewPage streams the compile and maps its outcome", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-rp-compile-"));
  const repo = path.join(dir, "src", "repo-main");
  fs.mkdirSync(repo, { recursive: true });
  fs.writeFileSync(path.join(repo, "config.yaml"), "esphome:\n  name: x\n");
  const tarball = path.join(dir, "repo.tar.gz");
  execFileSync("tar", ["czf", tarball, "-C", path.join(dir, "src"), "repo-main"]);
  const bin = path.join(dir, "fake-esphome");
  fs.writeFileSync(
    bin,
    `#!/bin/sh
if [ "$1" = "config" ]; then
cat <<'EOF_YAML'
${yaml.dump({ esphome: { name: "x" } })}EOF_YAML
exit 0
fi
echo "Compiling app"
case "$MFE_TEST_COMPILE" in
  pass) exit 0 ;;
  fail) echo "boom" >&2; exit 1 ;;
  hang) sleep 5 ;;
esac
`,
    { mode: 0o755 }
  );
  const page = path.join(dir, "index.md");
  fs.writeFileSync(
    page,
    "---\ntitle: Test\nmade-for-esphome: true\n---\n\n```yaml url=https://github.com/owner/repo/blob/main/config.yaml\n```\n"
  );

  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(fs.readFileSync(tarball), { status: 200 })) as typeof fetch;
  const names = ["MFE_OTA_MANIFEST", "MFE_DASHBOARD_IMPORT_CHECK", "MFE_TEST_COMPILE", "COMPILE_TIMEOUT_MS"] as const;
  const saved = Object.fromEntries(names.map((n) => [n, process.env[n]]));
  process.env.MFE_OTA_MANIFEST = "0";
  process.env.MFE_DASHBOARD_IMPORT_CHECK = "0";
  try {
    const run = async (mode: string): Promise<{ r: PageResult; lines: string[] }> => {
      process.env.MFE_TEST_COMPILE = mode;
      let r: PageResult | undefined;
      const lines = await captureLog(async () => {
        r = await reviewPage(page, dir, bin, true);
      });
      return { r: r as PageResult, lines };
    };

    let out = await run("pass");
    assert.equal(out.r.compile, "PASS");
    assert.ok(out.lines.includes("    | Compiling app"));
    assert.ok(out.lines.some((l) => /compile result: PASS/.test(l)));
    assert.ok(out.lines.some((l) => /`esphome compile` ok in/.test(l)));

    out = await run("fail");
    assert.equal(out.r.compile, "FAIL");
    assert.match(out.r.compileLog ?? "", /boom/);
    assert.ok(out.lines.some((l) => /`esphome compile` FAILED in/.test(l)));

    process.env.COMPILE_TIMEOUT_MS = "300";
    out = await run("hang");
    assert.equal(out.r.compile, "INCONCLUSIVE");
    assert.ok(out.lines.some((l) => /`esphome compile` TIMED OUT in/.test(l)));

    // Compile off: the step is announced as skipped.
    const skipped = await captureLog(async () => {
      await reviewPage(page, dir, bin, false);
    });
    assert.ok(skipped.some((l) => /compile skipped/.test(l)));

    // OTA manifest check on (nothing to fetch for this config): the step is announced.
    delete process.env.MFE_OTA_MANIFEST;
    const withOta = await captureLog(async () => {
      await reviewPage(page, dir, bin, false);
    });
    assert.ok(withOta.some((l) => /7\/8 checking OTA update manifests/.test(l)));
  } finally {
    globalThis.fetch = realFetch;
    for (const n of names) {
      if (saved[n] === undefined) delete process.env[n]; else process.env[n] = saved[n];
    }
  }
});
