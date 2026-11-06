---
title: Aubess Mini Smart Switch
date-published: 2025-10-01
type: switch
standard: global
board: bk72xx
---

![Product Image](./aubess_mini_smart_switch_photo.jpg "Product Image")

Maker: [https://aubess.net/](https://aubess.net/)

Also on Aliexpress.

## GPIO Pinout

| Pin | Function        |
| --- | --------------- |
| P8  | Button          |
| P14 | External Switch |
| P15 | Relay           |
| P6  | Status Led      |

## Internals

![Internals Image](./aubess-mini-smart-switch-internals.jpg "Internals Image")

## UART Pinout

![Uart Pinout](./aubess-mini-smart-switch-uart-pinout.jpg "UART PINOUT")

## Basic Configuration

```yaml
esphome:
  name: aubessMini01
  friendly_name: Aubessm01

bk72xx:
  board: generic-bk7231n-qfn32-tuya

logger:
api:
captive_portal:
ota:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

binary_sensor:
  - platform: gpio
    pin:
      number: P8
      mode:
        input: true
        pullup: true
    id: "AubessMini01_button"
    on_press:
      - switch.toggle: aubesMini01
  - platform: gpio
    pin:
      number: P14
      mode:
        input: true
        pullup: True
    id: "AubessMini01_switch"
    on_press:
      - switch.toggle: aubesMini01
    on_release:
      - switch.toggle: aubesMini01

button:
  - platform: restart
    name: "Restart"

switch:
  - platform: gpio
    name: "Relay"
    pin: P26
    id: aubesMini01

status_led:
  pin:
    number: P6
    inverted: yes
```
