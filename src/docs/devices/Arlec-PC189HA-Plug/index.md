---
title: Arlec PC189HA Plug
date-published: 2021-01-04
type: plug
standard: au
board: esp8266
---

![Product Image](./Arlec-PC189HA-Plug.jpg "Product Image")

The Arlec PC189HA power plug is part of the [Grid Connect ecosystem](https://grid-connect.com.au/) and is sold at
Bunnings in Australia and New Zealand.

As at the time of writing, they can be flashed without disassembly or soldering [using tuya-convert](#tuya-convert).

## GPIO Pinout

| Pin    | Function                  |
| ------ | ------------------------- |
| GPIO04 | Blue LED (Inverted: true) |
| GPIO12 | Relay                     |
| GPIO14 | Button                    |

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
substitutions:
  device_name: "arlec_PC189HA_1"
  name: "ARLEC PC189HA 1"

esphome:
  name: ${device_name}
  comment: ${name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

logger:

api:
  pencryption:
    key: !secret api_encryption_key

ota:
  password: "ota_password"

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO14
      inverted: True
      mode: INPUT_PULLUP
    name: ${name} button
    filters:
      delayed_on_off: 100ms # Debouncing
    on_press:
      then:
        - switch.toggle: relay

switch:
  - platform: gpio
    pin: GPIO12
    name: "${name}"
    id: relay
    restore_mode: always off
    icon: mdi:power-socket-au
    on_turn_on:
      then:
        - output.turn_on: button_led
    on_turn_off:
      then:
        - output.turn_off: button_led

output:
  - platform: gpio
    id: button_led
    pin:
      number: GPIO4
      inverted: yes
```
