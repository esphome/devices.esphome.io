---
title: Westek In-Wall Smart Switch
date-published: 2026-03-18
type: switch
standard: us
board: esp8266
---

## Notes

GPIO4 is used as a status LED — the same GPIO used for status LEDs across similar MJ S01/ST01 devices.
If the LED state appears inverted, toggle `inverted: true` on the status LED output.

This switch has two paddle buttons (upper and lower), both of which toggle the relay.

## GPIO Pinout

| Pin    | Function                                        |
| ------ | ----------------------------------------------- |
| GPIO4  | Status LED (active HIGH — adjust if inverted)   |
| GPIO12 | Relay output (active HIGH)                      |
| GPIO13 | Upper paddle button (active LOW, pull-up)        |
| GPIO14 | Lower paddle button (active LOW, pull-up)        |

## Basic Configuration

```yaml
substitutions:
  device_name: "westek-in-wall"

esphome:
  name: ${device_name}
  friendly_name: "Westek In-Wall Switch"
  comment: "Westek In-Wall Smart Switch"
  name_add_mac_suffix: true
  project:
    name: Westek.InWall
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
# GPIO4  - Status LED (active HIGH; toggle inverted if LED is on when it should be off)
# GPIO12 - Relay output, active HIGH
# GPIO13 - Upper paddle button, active LOW
# GPIO14 - Lower paddle button, active LOW

switch:
  - platform: gpio
    name: "Switch"
    id: relay
    pin:
      number: GPIO12
      inverted: false
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_on:
      - output.turn_on: status_led
    on_turn_off:
      - output.turn_off: status_led

binary_sensor:
  - platform: gpio
    name: "Upper Paddle"
    internal: true
    pin:
      number: GPIO13
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      - switch.toggle: relay

  - platform: gpio
    name: "Lower Paddle"
    internal: true
    pin:
      number: GPIO14
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      - switch.toggle: relay

output:
  - platform: gpio
    id: status_led
    pin:
      number: GPIO4
      inverted: false  # Toggle to true if LED is on when it should be off

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
