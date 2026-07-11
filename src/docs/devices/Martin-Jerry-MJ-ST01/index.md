---
title: Martin Jerry MJ-ST01 3-Way Switch
date-published: 2026-03-18
type: switch
standard: us
board: esp8266
---

## Notes

This is the **smart** (master) unit in a 3-way switch pair. The companion (non-smart) switch
connects to the traveler wires as usual. The smart unit's physical paddle is momentary
(springs back after press), so only `on_press` is used for toggling.

GPIO14 function is unknown; it may be a second/companion switch input. It is left unconfigured.

## GPIO Pinout

| Pin    | Function                                                   |
| ------ | ---------------------------------------------------------- |
| GPIO4  | Blue status LED (active HIGH, on when relay on)            |
| GPIO5  | Red power LED (active HIGH, inverted — on when relay off)  |
| GPIO12 | Relay output (active HIGH)                                 |
| GPIO13 | Physical 3-way wall switch (active LOW, pull-up)           |
| GPIO14 | Unknown (possibly second switch input)                     |

## Basic Configuration

```yaml
substitutions:
  device_name: "martin-jerry-st01"

esphome:
  name: ${device_name}
  friendly_name: "Martin Jerry ST01 Switch"
  comment: "MJ-ST01 3-Way Smart Switch"
  name_add_mac_suffix: true
  project:
    name: MJ.ST01
    version: 1.0.0

esp8266:
  board: esp01_1m
  restore_from_flash: true

preferences:
  flash_write_interval: 1min

logger:

api:

time:
  - platform: homeassistant
    id: homeassistant_time

ota:
  - platform: esphome

wifi:
  ap: {}

captive_portal:

# GPIO Pin Mapping:
# GPIO4  - Blue status LED (on when relay is on)
# GPIO5  - Red power LED, inverted (on when relay is off)
# GPIO12 - Relay output, active HIGH
# GPIO13 - Physical 3-way wall switch, active LOW
# GPIO14 - Unknown function; possibly second/companion switch input

switch:
  - platform: gpio
    name: "Switch"
    id: relay
    pin:
      number: GPIO12
      inverted: false
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_on:
      - output.turn_on: blue_led
      - output.turn_off: red_led
    on_turn_off:
      - output.turn_off: blue_led
      - output.turn_on: red_led

binary_sensor:
  - platform: gpio
    name: "Wall Switch"
    internal: true
    pin:
      number: GPIO13
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      - switch.toggle: relay

output:
  - platform: gpio
    id: blue_led
    pin:
      number: GPIO4
      inverted: false
  - platform: gpio
    id: red_led
    pin:
      number: GPIO5
      inverted: false

button:
  - platform: restart
    id: restart_button
    name: "Restart"
  - platform: safe_mode
    id: restart_button_safe_mode
    name: "Restart (Safe Mode)"
  - platform: factory_reset
    id: factory_reset_button
    name: "Factory Reset"
    disabled_by_default: true
    entity_category: config
    icon: mdi:restart-alert

sensor:
  - platform: wifi_signal
    name: "WiFi Signal"
    update_interval: 60s
  - platform: uptime
    name: "Uptime"

text_sensor:
  - platform: version
    name: "ESPHome Version"
  - platform: wifi_info
    ip_address:
      name: "IP Address"
    mac_address:
      name: "MAC Address"
    ssid:
      name: "SSID Connected"
```
