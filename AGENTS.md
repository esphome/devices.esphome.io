# Notes for AI agents

This repository is the source of [devices.esphome.io](https://devices.esphome.io), a catalog of devices that run
ESPHome firmware. It is an [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/) site. Each
device is one folder under `src/docs/devices/<DeviceName>/` holding an `index.md` page plus the example `.yaml`
configs the page pulls in.

The rules below are what CI enforces (`npm run validate-devices`, `npm run validate-yaml`,
`npm run lint-frontmatter`, markdownlint, yamllint, the CRLF check and the external link check), plus the pull
request template and the Made for ESPHome standard. If a document ever disagrees with CI, the validator scripts
in `scripts/` win; fix the document. The same rules are repeated for other tools in
`.github/copilot-instructions.md` and `.github/skills/code-review/SKILL.md`, so keep those in step when a rule
changes.

The full contributor guide is [`src/docs/devices/adding-devices.mdx`](src/docs/devices/adding-devices.mdx)
(rendered at <https://devices.esphome.io/devices/adding-devices>).

## Commands

Node 22.12 or newer.

```bash
npm install
npm run validate-devices    # folder names, frontmatter, aliases, then validate-yaml
npm run validate-yaml       # the example-config rules below
npm run lint-frontmatter    # yamllint on the frontmatter of changed .md/.mdx (needs yamllint on PATH)
npm run check-links         # external links in changed markdown
npm test                    # script unit tests and workflow-script syntax checks
npm run dev                 # local site on http://localhost:4321/
npm run extract-yaml -- <path>   # move inline yaml fences into .yaml files
npm run wrap-markdown -- <file>  # wrap prose to the 120-column limit
```

Run `validate-devices` and `lint-frontmatter` before pushing any change under `src/docs/devices/`.

## Pull requests

- **One new device per PR.** An update PR touches one device, unless it is a related cleanup across several
  devices.
- Title: `Add <Device Name>` for a new device, `Update <Device Name> - <what changed>` for an update. No generic
  titles such as "Update device" or "Fix docs".
- Keep `.github/PULL_REQUEST_TEMPLATE.md` intact (it says "DO NOT DELETE ANYTHING"). Tick the one matching
  "Type of changes" box and the checklist items that apply; a bot labels the PR from those boxes.
- A PR that can't merge into `main` gets the `has-conflicts` label and a failing "Merge conflicts" check until
  main is merged or rebased in. A merge to `main` rechecks every open PR's label.
- Copilot reviews a PR when it opens, and again when a draft is marked ready for review (the review drafter often
  drafts a PR right after opening, before that first review starts).
- Only review and change what the diff touches; don't flag pre-existing problems on untouched pages. Validation
  scope differs from review scope, though. `validate-devices` and most of `validate-yaml` (YAML parsing, secrets
  and passwords, hardware-only `config.yaml`, first-`file=` ordering, missing `file=` targets) run on the whole
  catalog, so a broken untouched page can still fail CI. Only the no-inline-yaml rule, the Made for ESPHome
  `url=` requirement, `lint-frontmatter` and `check-links` are limited to pages the PR changes.

## Device folder and page

- Path: `src/docs/devices/<DeviceName>/index.md`. A folder holds exactly one markdown file.
- The folder name may only contain `a-z A-Z 0-9 _ . - +`: no spaces. Use dashes between words.
- A page needs a device description, a GPIO pinout table when there are pins to document, and links to the
  product or source page and any relevant documentation.

## Frontmatter

```yaml
---
title: Sonoff S20
date-published: 2019-10-11
type: plug
standard: uk, us
---
```

- Required: `title`, `date-published`, `type`, `standard`.
- `date-published`: `YYYY-MM-DD` with a zero-padded month and day (`2025-07-04`); an optional
  `HH:MM:SS +/-TTTT` may follow. It must be a valid date and must not be in the future.
- `type`: one of `dimmer`, `light`, `misc`, `plug`, `relay`, `sensor`, `switch`.
- `standard`: one or more of `au`, `br`, `eu`, `global`, `in`, `uk`, `us`.
- `board` (optional, needed to appear on the Boards page): one or more of `bk72xx`, `esp32`, `esp8266`,
  `ln882x`, `rp2040`, `rtl87xx`.
- `difficulty` (optional): an integer 1-5 (1 comes with ESPHome, 2 plug-n-flash, 3 disassembly, 4 soldering,
  5 chip replacement).
- `project-url` (optional): the product page, or the repo or page holding the yaml.
- `made-for-esphome` (optional): `true` only for manufacturer-certified devices; see below.
- `alias` (optional): other names or old URLs for the same device. An entry is `title` + `slug`, or a bare string
  for a redirect-only slug. A slug follows the folder-name rules, must not match an existing device folder, and
  two pages cannot claim the same alias. Add an alias instead of duplicating a page, and never hand-edit
  `public/_redirects`.
- The allowed value sets live in `src/utils/validFrontmatter.ts`. Change them there, not in docs.
- The frontmatter must be clean YAML: no trailing whitespace, no extra spaces after a colon, consistent
  indentation, no duplicate keys, canonical booleans.

## Example configuration YAML

Every example config in the repo lives in its own `.yaml` file next to `index.md` and is pulled into the page with
an empty fence. A page may instead (or also) show a config straight from an upstream repo with a `url=` fence,
which needs no local copy:

````md
```yaml file=config.yaml
```
````

- No inline yaml in fenced blocks on added or modified pages. The only exception is a fence marked `inline` for a
  two- or three-line snippet that is not a runnable config. `inline` is not a way around the rules below.
- The **first `file=` fence on a page must reference `config.yaml`**. `url=` fences may appear anywhere and do not
  count towards that ordering. A page with only `url=` fences and no `file=` fence is valid; `file=config.yaml` is
  still the standard form outside Made for ESPHome.
- Every `file=` must point at a file that exists. A `url=` must use an allowlisted host and shape (see Made for
  ESPHome below); anything else is dropped from the build with a warning.
- Every yaml file must parse.

### `config.yaml` is hardware-only

It is the bare hardware definition a user starts from:

- No top-level `api:`, `ota:`, `mqtt:`, `web_server:`, `web_server_idf:`, `improv_serial:`, `captive_portal:`,
  `bluetooth_proxy:` or `dashboard_import:`.
- No `platform: homeassistant`, `platform: mqtt` or `platform: template` anywhere in the tree.
- `wifi:` may hold only radio tunables (`country`, `power_save_mode`, `output_power`, ...). It must not contain
  `ssid`, `password`, `networks`, `manual_ip`, `eap` or `use_address`. An empty `ap:` block is allowed and
  recommended, so a freshly flashed device boots into a fallback hotspot.

Automations, Home Assistant integration and extra components go in separate, descriptively named yaml files
(`voice-assistant.yaml`, `battery-percentage.yaml`) referenced by later `file=` fences.

### All example yaml

- No `!secret` references anywhere, including `!secret wifi_ssid` / `!secret wifi_password`.
- No passwords on `password:`, `*_password:` or `psk:` keys, neither literal nor `!secret`. Leave the key out.
- No static IP addresses (`manual_ip`) in `wifi:` or `ethernet:` blocks.
- Do not include `web_server:` in any config on a device page.

## Markdown style

- Lines wrap at 120 columns (markdownlint MD013; code blocks, tables and headings are exempt). yamllint uses the
  same limit for yaml files.
- The only HTML allowed in markdown is `<details>` and `<summary>`.
- Consistent heading levels, `[text](url)` links, aligned tables, a language on every code fence.
- No trailing whitespace, a single trailing newline, and LF line endings only (CI rejects CRLF).

## Images

- Store images in the device folder, not hotlinked from external sites, and embed them with a title:
  `![IoTiX Adam](adam.webp "IoTiX Adam")`.
- Keep files small; there is no hard limit, but the catalog's median image is about 120 KB. Use JPG for photos,
  WebP when the image needs transparency, and PNG only for screenshots or diagrams that compress well. Resize
  anything much wider than the page renders (about 1200 px) and compress before committing.

## Made for ESPHome (`made-for-esphome: true`)

These pages represent the ESPHome quality standard. Adding the flag triggers an automated workflow: it labels the
PR `made-for-esphome`, converts it to a draft, runs the checklist and compiles the linked config on every push,
requests changes with a report when a check fails, and marks the PR ready with the `made-for-esphome-pending`
label once everything passes. Let that automation run, and review what it cannot check.

Every item in [`.github/made-for-esphome-checklist.md`](.github/made-for-esphome-checklist.md) must hold:

- The device is an ESP32 or a supported variant (C3, C6, S2, S3, ...), running ESPHome firmware.
- The project name does not contain "ESPHome", except as the ending "for ESPHome".
- The configuration is open source. The page has at least one `url=` fence pointing at a `.yaml` / `.yml` file in
  the manufacturer's repo, in one of these shapes:
  - `https://github.com/<owner>/<repo>/(blob|raw)/<ref>/<path>.yaml`
  - `https://raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>.yaml`
  - `https://codeberg.org/<owner>/<repo>/(src|raw)/(branch|tag|commit)/<ref>/<path>.yaml`
  - `https://gitlab.com/<owner>/<repo>/-/(blob|raw)/<ref>/<path>.yaml`

  A bare repo URL, a tree URL or a non-yaml file does not count. `url=` content is not validated by
  `validate-yaml`; pinning to a commit SHA keeps the page from drifting.
- Wi-Fi devices include `improv_ble:` (the legacy `esp32_improv:` spelling is a deprecated alias), plus
  `improv_serial:` when there is a USB port.
- The user can take control in the ESPHome Builder:
  - `dashboard_import:` is present, and its `package_import_url` resolves to the config file (paths are
    case-sensitive).
  - The `ota` `esphome` platform is present (`ota: [ { platform: esphome } ]`).
  - Serial flashing is not disabled.
  - OTA updates are provided through `update:` with `platform: http_request`, and its manifest and binaries are
    reachable.
- The shipped config has no `!secret` at all, no passwords (an empty `password: ""` is fine), and no static IPs.
- The config compiles and runs without any user changes after taking control.
- Every entity and component has an `id:`. List-of-platform and automation blocks that cannot carry one (`ota:`,
  `interval:`, `external_components:`) are exempt.
