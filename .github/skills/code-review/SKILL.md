---
name: code-review
description: Review pull requests on the ESPHome devices documentation site. Use this when reviewing any PR that adds, updates, or removes a device page under src/docs/devices, or changes example YAML configs, to check it against the repository's CI-enforced rules, the pull request template checklist, and the Made for ESPHome standard.
license: MIT
---

# Reviewing device documentation pull requests

This repository is the source for [devices.esphome.io](https://devices.esphome.io): one
folder per device under `src/docs/devices/<DeviceName>/`, each with an `index.md` page and
one or more example `.yaml` config files pulled into the page with fenced code blocks.

Review PRs against the rules below. They mirror what CI enforces (`npm run validate-devices`,
`npm run validate-yaml`, `npm run lint-frontmatter`, markdownlint, yamllint, and the external
link check) plus the pull request template checklist and the Made for ESPHome standard, so a
clean review here should mean a green CI run. Prefer citing the specific rule and file:line
when requesting a change.

## What to look at first

1. Read the PR description and confirm the "Type of changes" box matches the diff (new device,
   update, removal, general cleanup, other).
2. Confirm scope: a **new device PR adds exactly one device**. Multiple new devices belong in
   separate PRs. General code-quality changes may span several devices if related.
3. Identify every added or changed file. Only review what the diff touches. Do not flag
   pre-existing issues on untouched pages.

## Page structure and YAML fences

- New device pages live at `src/docs/devices/<DeviceName>/index.md`. The folder name may only
  contain `a-z A-Z 0-9 _ . - +` (no spaces); use dashes to separate words.
- Example YAML must live in its **own `.yaml` file** alongside `index.md` and be included with a
  fence of the form ` ```yaml file=<name>.yaml `. There must be **no inline YAML** in the fenced
  code blocks on added or modified pages.
- The **first `file=` fence on the page must reference `config.yaml`**.
- Every `file=` / `url=` fence must point at a file that actually exists (or, for `url=`, a valid
  upstream URL). Broken references fail validation.

## `config.yaml` must be hardware-only

The first config is the bare hardware definition a user starts from. In `config.yaml`:

- No top-level `api:`, `ota:`, `mqtt:`, `web_server:`, `web_server_idf:`, `improv_serial:`,
  `captive_portal:`, `bluetooth_proxy:`, or `dashboard_import:`.
- No `platform: homeassistant`, `platform: mqtt`, or `platform: template` anywhere in the tree.
- If there is a `wifi:` block, it may contain only radio tunables (`country`, `power_save_mode`,
  `output_power`, and similar). It must not contain `ssid`, `password`, `networks`, `manual_ip`,
  `eap`, or `use_address`. An empty `ap:` block is allowed.

Richer examples (automations, Home Assistant integration, extra components) belong in
**separate** `file=` config blocks later on the page, not in `config.yaml`.

## Secrets, passwords, and network config (all example YAML)

- No `!secret` references **anywhere** in any example YAML.
- No passwords, literal **or** `!secret`, on `password:`, `*_password:`, or `psk:` keys.
- No static/manual IP addresses in `wifi:` or `ethernet:` blocks.

## Frontmatter

Required keys: `title`, `date-published`, `type`, `standard`. Also check:

- `date-published` is `YYYY-MM-DD` with zero-padded month and day (e.g. `2025-07-04`), a valid
  date, and not in the future.
- `type` is one of the allowed device types, and `board` (if present) is an allowed board value
  (see `src/utils/validFrontmatter`).
- `difficulty`, if present, is an integer 1-5.
- Frontmatter YAML is clean: no trailing whitespace, no extra spaces after a colon, consistent
  indentation, no duplicate keys, canonical booleans. (This is what `lint-frontmatter` checks.)

## Markdown quality

- Consistent heading levels, valid `[text](url)` links, aligned tables, code blocks with a
  language specifier, image syntax `![alt](file "title")`.
- No trailing whitespace; file ends with a single newline; LF line endings only (no CRLF).
- A GPIO pinout table when applicable, a device description, and links to a source/purchase page
  and any relevant documentation.

## Made for ESPHome devices (`made-for-esphome: true` in frontmatter)

These represent the ESPHome quality standard. When the frontmatter has `made-for-esphome: true`,
check **every** item in [`.github/made-for-esphome-checklist.md`](../../made-for-esphome-checklist.md).
Key points:

- Powered by an ESP32 or a supported variant (C3, C6, S2, S3, and similar), running ESPHome
  firmware.
- The project name must not contain "ESPHome" unless it ends with "for ESPHome".
- The ESPHome configuration is open source. At least one ` ```yaml url=… ` fence points at a
  `.yaml` file in the manufacturer's GitHub, Codeberg, or GitLab repo so the rendered page shows
  the live upstream config.
- Wi-Fi devices include `esp32_improv:`, and `improv_serial:` when there is a USB port.
- The device can be "taken control" of via the ESPHome Builder: `dashboard_import:`, the
  `ota.esphome` component, serial flashing not disabled, and OTA updates via the
  `update.http_request` component.
- No secrets (not even `!secret wifi_ssid` / `!secret wifi_password`), no passwords, no static
  IPs. The config must be valid and compile and run **without any user changes** after taking
  control. Every entity/component must have an `id`.

Note: `made-for-esphome` PRs also run an automated checklist workflow that compiles the linked
config. Let that automation run; focus your review on the qualitative and documentation items it
cannot check.

## How to write the review

- Reference the exact rule and, where possible, the offending `file:line`.
- Group findings by the checklist section above so the author can act on them directly.
- If everything passes, say so plainly rather than inventing nits.

Full contributor reference: <https://devices.esphome.io/devices/adding-devices>. General review
guidance also lives in [`.github/copilot-instructions.md`](../../copilot-instructions.md).
