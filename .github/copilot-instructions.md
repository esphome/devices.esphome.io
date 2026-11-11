# GitHub Copilot Instructions for ESPHome Devices Repository

## Overview

This repository contains device documentation for ESPHome-compatible devices. When reviewing pull requests, you should pay special attention to devices marked with `made-for-esphome: true` in their frontmatter, as these require additional validation against specific standards.

## Pull Request Review Guidelines

### General Review Points (All PRs)

1. **Pull Request Title**

   - ✅ Should clearly describe what device is being added/updated
   - ✅ Take the device name from the page's frontmatter `title`
   - ✅ Format: "Add [Device Name]" for new devices
   - ✅ Format: "Update [Device Name] - [brief description]" for updates
   - ✅ Format: "Remove [Device Name]" for removals
   - ✅ Cross-device cleanup: an imperative summary naming the change, e.g. "Fix broken datasheet links on Tuya pages"
   - ✅ Use proper capitalization and spelling
   - ❌ Avoid generic titles like "Update device" or "Fix docs"
   - ❌ Never a file name ("index.md", "config.yaml"), a branch name, "new device", or a title that doesn't name the device
   - When a title breaks these rules, suggest a conforming one from the device folder and frontmatter `title`; a bad title alone doesn't block a merge

2. **Pull Request Scope**

   - ✅ One PR should include only a single new device page
   - ✅ One PR should include only a single device update unless it's a general code quality update
   - ✅ General code quality updates can be grouped across multiple devices if related
   - ❌ Multiple new devices should be submitted in separate PRs

3. **Markdown Syntax**

   - ✅ Proper frontmatter formatting with correct YAML syntax
   - ✅ Consistent heading levels (# ## ### ####)
   - ✅ Proper table formatting with aligned columns
   - ✅ Valid markdown links `[text](url)` format
   - ✅ Consistent code block formatting with language specifiers
   - ✅ Proper image syntax `![alt text](image.jpg "title")`
   - ✅ No trailing whitespace
   - ✅ Files should end with a single newline

4. **Security & Privacy**

   - ❌ No `!secret` references anywhere in any example yaml, including `!secret wifi_ssid` / `!secret wifi_password`
   - ❌ No passwords on `password:`, `*_password:` or `psk:` keys, neither literal nor `!secret`
   - ❌ No static/manual IP addresses in wifi or ethernet blocks
   - ❌ No hardcoded credentials or sensitive information

5. **Configuration Structure**

   - ✅ Each example config in the repo lives in its own `.yaml` file next to `index.md`, pulled in with `` ```yaml file=<name>.yaml ``; no inline yaml on added or modified pages (a fence marked `inline` may hold a short non-runnable snippet)
   - ✅ A page may instead show an upstream config with a `` ```yaml url=… `` fence, which needs no local copy; a page with only `url=` fences is valid
   - ✅ **CRITICAL: when a page has `file=` fences, the first one references `config.yaml`, and `config.yaml` is hardware-only** - This is non-negotiable and enforced by `npm run validate-yaml`
   - ❌ No top-level `api:`, `ota:`, `mqtt:`, `web_server:`, `web_server_idf:`, `improv_serial:`, `captive_portal:`, `bluetooth_proxy:` or `dashboard_import:` in `config.yaml`
   - ❌ No `platform: homeassistant`, `platform: mqtt` or `platform: template` anywhere in `config.yaml`
   - ✅ `wifi:` in `config.yaml` may hold only radio tunables (`country`, `power_save_mode`, `output_power`, ...) and an empty `ap:`; no `ssid`, `password`, `networks`, `manual_ip`, `eap` or `use_address`
   - ❌ `web_server:` component should NOT be included in any configurations on device pages
   - ✅ More complex examples go in separate yaml files referenced by later `file=` fences
   - ✅ Each `file=` yaml passes `esphome config` (an add-on file without `esphome: name:` is checked merged onto `config.yaml`), and the page must import into the ESPHome Device Builder; the check prints why not. (`npm run validate-esphome`)
   - ✅ Proper YAML formatting and indentation

6. **Documentation Quality**
   - ✅ Clear device description and features
   - ✅ Proper GPIO pinout tables when applicable
   - ✅ Links to purchase/source and documentation
   - ✅ Installation/setup instructions

7. **File path for device pages**
   - ✅ All devices pages should be created at `src/docs/devices/{DeviceName}/index.md`
   - ✅ The device name in the path must not contain spaces and should use dashes as a seperator

8. **Markdown frontmatter**
   - ✅ The `title`, `date-published`, `type`, and `standard` data are required to be specified in the frontmatter
   - ✅ `type`, `standard` and `board` values must come from `src/utils/validFrontmatter.ts`, and `date-published` must not be in the future
   - ✅ Check the `date-published` markdown frontmatter and make sure it's in the format of `YYYY-MM-DD`.  If the month or day values are 1-9, it should be prefixed with a 0, for example: `2025-07-04`

### Made for ESPHome Devices (made-for-esphome: true)

When a device has `made-for-esphome: true` in its frontmatter, it must meet ALL of the following requirements:

#### Hardware Requirements

- ✅ **ESP32 or supported variant** (C3, C6, S2, S3, etc.)
- ✅ **ESPHome firmware** is being used
- ✅ **Project name** cannot contain "ESPHome" except when ending with "for ESPHome"

#### Open Source Requirements

- ✅ **ESPHome configuration is open source** and available for users to modify/update
- ✅ **At least one `` ```yaml url=… `` fence** points at a `.yaml` file in the manufacturer's GitHub, Codeberg or GitLab repo, so the page shows the upstream config live

#### Wi-Fi Device Requirements (if applicable)

- ✅ **`improv_ble:` component** must be included in configuration (`esp32_improv:` is the deprecated spelling)
- ✅ **`improv_serial:` component** must be included if device has USB port

#### User Control & Updates

The device must allow users to "take control" via ESPHome Builder:

- ✅ **`dashboard_import:` component** included to facilitate adoption, with a `package_import_url` that resolves to the config file (paths are case-sensitive)
- ✅ **`ota.esphome` component** included for OTA updates
  - Exception: devices with signed firmware and no network OTA endpoint may omit it if the configuration enables
    `esp32: framework: advanced: signed_ota_verification:` and has `improv_serial:`, and the device can be
    flashed over USB with no keys and no disassembly (confirm this by hand). The package that taking control
    imports must still contain `ota.esphome`
  - Example:
    ```yaml
    ota:
      - platform: esphome
    ```
- ✅ **Serial flashing NOT disabled**
- ✅ **No secrets references** in the configuration, not even `!secret wifi_ssid` / `!secret wifi_password`
- ✅ **No passwords** in the configuration, neither literal nor `!secret` (an empty `password: ""` is fine)
- ✅ **No static IP addresses** in the configuration
- ✅ **Configuration must compile and run successfully** without any user changes after taking control
- ✅ **Every entity/component** (sensor, switch, etc.) must have an `id` defined (`ota:`, `interval:` and `external_components:` entries are exempt)
- ✅ **`update.http_request` component** included for OTA updates
  - Example:
    ```yaml
    update:
      - platform: http_request
        source: "https://example.com/manifest.json"
    ```

## Review Process

### For Regular Device PRs

1. Check basic security and formatting requirements
2. Verify documentation completeness
3. Test configuration validity if possible
4. Request changes if requirements not met

### For Made for ESPHome Device PRs

1. **First, verify the device qualifies** for "Made for ESPHome" status
2. **Check ALL items** in the Made for ESPHome checklist above
3. **Request specific changes** for any missing requirements, referencing the exact checklist item
4. **Be thorough** - these devices represent the ESPHome standard and quality

## Example Review Comments

### For Missing Requirements

```
This device is marked as `made-for-esphome: true` but is missing some required components:

- [ ] Missing `improv_ble:` component - required for Wi-Fi devices ([documentation](https://esphome.io/components/improv_ble/))
- [ ] Missing `dashboard_import:` component - required for user adoption ([documentation](https://esphome.io/components/esphome.html#adding-the-mac-address-as-a-suffix-to-the-device-name))
- [ ] Some entities are missing `id` definitions (e.g., line 45 sensor)

Please update the configuration to meet the Made for ESPHome standards.
```

### For Configuration Issues

```
The configuration contains secrets references which violates Made for ESPHome requirements:
- Line 23: `password: !secret api_password` should be removed
- Line 31: Static IP `192.168.1.100` should be removed

Made for ESPHome devices must work without any user changes after the user chooses to "take control".
```

### For Qualification Issues

```
This device appears to be based on ESP8266, but Made for ESPHome devices must use ESP32 or supported variants (C3, C6, S2, S3, etc.). Please either:
1. Update to ESP32 hardware, or
2. Remove the `made-for-esphome: true` flag if staying with ESP8266
```

### For Configuration Structure Issues

```
The configuration contains components that should not be in `config.yaml`:
- Line 25: `web_server:` component should be removed - not allowed on device pages
- Line 28: `api:` and `ota:` belong in a separate yaml file, not `config.yaml`
- Line 30: `platform: template` sensor should move to a separate yaml file

**`config.yaml` must be hardware-only** (for example `esphome:`, `esp32:`, `logger:`, hardware `sensor:` / `switch:` / `output:` entries, and a `wifi:` block with only radio tunables and an empty `ap:`). Please remove web_server entirely and move the other components to a second yaml file referenced by a later `file=` fence.
```

## Workflow Integration

The repository has automated workflows that:

1. Detect when `made-for-esphome: true` is added to device frontmatter
2. Add the `made-for-esphome` label and convert the PR to a draft while the automation runs
3. Run the Made for ESPHome checklist as automated checks on every push, compiling the linked configuration
4. Request changes with a report when a check fails
5. Mark the PR ready for review and add the `made-for-esphome-pending` label once every automated check passes, which is the signal that a human reviewer should pick it up

As a reviewer, ensure all checklist items are satisfied before approving Made for ESPHome devices.
