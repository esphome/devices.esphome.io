<!-- DO NOT DELETE ANYTHING IN THIS TEMPLATE -->

# Brief description of the changes



## Type of changes

- [ ] New device (a single device only — one device per pull request)
- [ ] Update existing device
- [ ] Removing a device
- [ ] General cleanup
- [ ] Other


## Checklist:

The rules below are enforced in CI by `npm run validate-devices` and `npm run validate-yaml`. The full reference is at [Configuration YAML files](https://devices.esphome.io/devices/adding-devices#configuration-yaml-files).

- [ ] Adding a new device adds a single device only — one device per pull request.
- [ ] Each example yaml lives in its own `.yaml` file alongside `index.md` and is pulled into the page with a fenced block of the form `` ```yaml file=<name>.yaml `` — no inline yaml on added or modified pages.
- [ ] The first `file=` fence on the page references `config.yaml`.
- [ ] `config.yaml` is **hardware-only**: no top-level `api:`, `ota:`, `mqtt:`, `web_server:`, `web_server_idf:`, `improv_serial:`, `captive_portal:`, `bluetooth_proxy:`, or `dashboard_import:`, and no `platform: homeassistant`, `platform: mqtt`, or `platform: template` anywhere in the tree.
- [ ] If `config.yaml` has a `wifi:` block, it contains only radio tunables (`country`, `power_save_mode`, `output_power`, …) — no `ssid`, `password`, `networks`, `manual_ip`, `eap`, or `use_address`. An empty `ap:` block is allowed.
- [ ] No passwords (literal **or** `!secret`) on `password:`, `*_password:`, or `psk:` keys, and no `!secret` references anywhere in any example yaml.
- [ ] For pages with `made-for-esphome: true` in frontmatter: at least one `` ```yaml url=… `` fence points at a `.yaml` file in the manufacturer's GitHub repo (`github.com/<owner>/<repo>/(blob|raw)/<ref>/<path>.yaml` or the `raw.githubusercontent.com` equivalent) so the rendered page shows the upstream config live.

<!-- DO NOT DELETE ANYTHING IN THIS TEMPLATE -->
