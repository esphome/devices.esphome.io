---
title: Arlec 6000HA inline switch
date-published: 2023-01-04
type: switch
standard: au
board: esp8266
---

The Arlec 6000HA power plug is part of the [Grid Connect ecosystem](https://grid-connect.com.au/) and is sold at
Bunnings in Australia and New Zealand.

As at the time of writing, they can be flashed without disassembly or soldering [using tuya-convert](#tuya-convert).

## GPIO Pinout

| Pin    | Function                  |
| ------ | ------------------------- |
| GPIO01 | Blue LED (Inverted: true) |
| GPIO13 | Relay                     |
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
  encryption:
    key: !secret api_encryption_key

ota:
  password: "ota_password"

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO01
      inverted: True
      mode: INPUT_PULLUP
    name: ${name}
    filters:
      delayed_on_off: 100ms
    on_press:
      then:
        - switch.toggle: relay

switch:
  - platform: gpio
    pin: GPIO14
    name: ${name}
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
      number: GPIO13
      inverted: yes
```
