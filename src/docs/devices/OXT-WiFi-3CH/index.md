---
title: OXT Wi-Fi 3CH
date-published: 2024-09-25
type: relay
standard: global
board: bk72xx
difficulty: 4
---

## General Notes

This is Polish brand based on a other Chinese product. Based on Tuya CB3S Board.

## Product Images

![main view](./device.jpg "DEVICE")
![pcb](./pcb.jpg "PCB")

## Programming

Solder USB TTL wires like below

![soldering](./soldering.jpg "soldering")

To enter bootloader mode, ground CEN pin and power device. I used
[https://github.com/libretiny-eu/ltchiptool](https://github.com/libretiny-eu/ltchiptool) to
program it

## GPIO Pinout

### OXT Wi-Fi 3CH - PCB ZH-Z02-A REV:C

| Pin | Function   |
| --- | ---------- |
| P7  | Relay #1   |
| P8  | Relay #2   |
| P9  | Relay #3   |
| P14 | Status LED |

## Basic Configuration

```yaml
substitutions:
  device_name: oxt-3ch

esphome:
  name: ${device_name}
  friendly_name: ${device_name}

bk72xx:
  board: cb3s

logger:

captive_portal:

status_led:
  pin:
    number: GPIO9
    inverted: true

switch:
  - platform: gpio
    pin: P7
    id: relay1
  - platform: gpio
    pin: P8
    id: relay2
  - platform: gpio
    pin: P9
    id: relay3

binary_sensor:
  - platform: gpio
    pin:
      number: P6
      mode: INPUT_PULLUP
      inverted: True
    name: ${device_name} switch 1
    on_press:
      - light.toggle: relay1
    on_release:
      - light.toggle: relay1
  - platform: gpio
    pin:
      number: P24
      mode: INPUT_PULLUP
      inverted: True
    name: ${device_name} switch 2
    on_press:
      - light.toggle: relay2
    on_release:
      - light.toggle: relay2
  - platform: gpio
    pin:
      number: P26
      mode: INPUT_PULLUP
      inverted: True
    name: ${device_name} switch 3
    on_press:
      - light.toggle: relay3
    on_release:
      - light.toggle: relay3
```
