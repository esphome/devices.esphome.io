---
title: DETA Grid Connect Smart Inline Switch 6000HA
date-published: 2021-06-13
type: plug

standard: au
board: esp8266
---

## General Notes

The DETA [Smart Inline Switch](https://www.bunnings.com.au/deta-grid-connect-smart-inline-switch_p0098816) are made by
Arlec as part of the [Grid Connect ecosystem](https://grid-connect.com.au/), and are sold at Bunnings in Australia and
New Zealand. They can be flashed without disassembly or soldering [using tuya-convert](#tuya-convert) if still old
stock, newer stock with updated Tuya firmware require dissassembly, soldering and flashing via serial.

## GPIO Pinout

| Pin    | Function |
| ------ | -------- |
| GPIO1  | Button   |
| GPIO13 | Blue LED |
| GPIO14 | Relay    |

## Getting it up and running

### Tuya Convert

These switches are Tuya devices, so if you don't want to open them up to flash directly, you can
[use tuya-convert to initially get ESPHome onto them](/devices/tuya-convert). After that, you can use ESPHome's OTA
functionality to make any further changes.

- Put the switch into "smartconfig" / "autoconfig" / pairing mode by holding any button for about 5 seconds.
- The status LED blinks rapidly to confirm that it has entered pairing mode.

## Basic Configuration

```yaml
# Basic Config
# https://www.bunnings.com.au/deta-grid-connect-smart-inline-switch_p0098816
substitutions:
  device_name: "deta_smart_inline_switch_1"
  name: "Deta Smart Inline Switch 1"

esphome:
  name: ${device_name}
  comment: ${name}

esp8266:
  board: esp01_1m
  board_flash_mode: dout
  restore_from_flash: true

wifi:
  networks:
    - ssid: SSID
      password: Password
    - ssid: SSID Secondary
      password: Password
  ap:
    ssid: ${device_name} Hotspot
    password: "Password"

captive_portal:

logger:
  #level: VERBOSE

api:

ota:

web_server:
  port: 80

time:
  - platform: homeassistant
    id: homeassistant_time

output:
  - platform: esp8266_pwm
    id: blue_led_output
    pin:
      number: GPIO13
      inverted: True

light:
  - platform: monochromatic
    name: ${device_name} Blue LED
    output: blue_led_output
    id: blue_led
    internal: True

sensor:
  - platform: uptime
    name: ${device_name} Uptime

  - platform: wifi_signal
    name: ${device_name} Wifi Signal
    update_interval: 60s

text_sensor:
  - platform: version
    name: ${device_name} ESPHome Version
  - platform: wifi_info
    ip_address:
      name: ${device_name} IP

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO1
      inverted: True
    id: button
    name: ${device_name} Button
    on_press:
      - switch.toggle: relay_template
    internal: True

switch:
  - platform: gpio
    pin: GPIO14
    id: relay

  # tie the led & relay operation together and report status based on relay state
  - platform: template
    name: ${device_name} Relay
    id: relay_template
    lambda: |-
      if (id(relay).state) {
        return true;
      } else {
        return false;
      }
    turn_on_action:
      - light.turn_on: blue_led
      - switch.turn_on: relay
    turn_off_action:
      - light.turn_off: blue_led
      - switch.turn_off: relay
```
