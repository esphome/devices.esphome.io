---
title: OXT Wi-Fi 4CH
date-published: 2023-12-19
type: relay
standard: global
board: bk72xx
difficulty: 4
---

## General Notes

This is Polish brand based on a other Chinese product. Based on Tuya CBU Board.
Other device could be found as WSM16-4-WIFI

## Product Images

![main view](./device_main.jpg "FRONT")
![pcb](./pcb_front.jpg "PCB")

## Programming

Solder USB TTL wires like below

![soldering](./soldering.jpg "soldering")

To enter bootloader mode, ground CEN pin and power device. I used
[https://github.com/libretiny-eu/ltchiptool](https://github.com/libretiny-eu/ltchiptool) to
program it

## GPIO Pinout

### OXT Wi-Fi 4CH - PCB ZH-Z10 REV 03

| Pin    | Function    |
| ------ | ----------- |
| GPIO24 | Push Button |
| GPIO20 | Relay #1    |
| GPIO28 | Relay #2    |
| GPIO17 | Relay #3    |
| GPIO16 | Relay #4    |
| GPIO9  | Status LED  |

## Basic Configuration

```yaml
substitutions:
  device_name: oxt-4ch

esphome:
  name: oxt-4ch
  friendly_name: oxt-4ch

bk72xx:
  board: cbu

logger:

captive_portal:

status_led:
  pin:
    number: GPIO9
    inverted: true

output:
  - platform: gpio
    pin: GPIO20
    id: relay1
  - platform: gpio
    pin: GPIO28
    id: relay2
  - platform: gpio
    pin: GPIO17
    id: relay3
  - platform: gpio
    pin: GPIO16
    id: relay4

light:
  - platform: binary
    name: ${device_name} relay 1
    output: relay1
    id: sw1
  - platform: binary
    name: ${device_name} relay 2
    output: relay2
    id: sw2
  - platform: binary
    name: ${device_name} relay 3
    output: relay3
    id: sw3
  - platform: binary
    name: ${device_name} relay 4
    output: relay4
    id: sw4

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO24
      mode: INPUT_PULLUP
      inverted: True
    name: ${device_name} button
  - platform: gpio
    pin:
      number: GPIO8
      mode: INPUT_PULLUP
      inverted: True
    name: ${device_name} switch 1
    on_press:
      - light.toggle: sw1
    on_release:
      - light.toggle: sw1
  - platform: gpio
    pin:
      number: GPIO7
      mode: INPUT_PULLUP
      inverted: True
    name: ${device_name} switch 2
    on_press:
      - light.toggle: sw2
    on_release:
      - light.toggle: sw2
  - platform: gpio
    pin:
      number: GPIO6
      mode: INPUT_PULLUP
      inverted: True
    name: ${device_name} switch 3
    on_press:
      - light.toggle: sw3
    on_release:
      - light.toggle: sw3
  - platform: gpio
    pin:
      number: GPIO26
      mode: INPUT_PULLUP
      inverted: True
    name: ${device_name} switch 4
    on_press:
      - light.toggle: sw4
    on_release:
      - light.toggle: sw4
```
