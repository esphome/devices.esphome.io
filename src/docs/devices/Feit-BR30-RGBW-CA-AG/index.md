---
title: Feit BR30-RGBW-CA-AG
date-published: 2026-01-29
type: light
standard: us
board: bk72xx
difficulty: 2
---

This is a standard openbeken compatible bulb.
It works with [Tuya-Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter).
Just flash with ESPHome, and it should work.

```yml
substitutions:
  devicename: feit-bulb

esphome:
  name: $devicename
bk72xx:
  board: generic-bk7231n-qfn32-tuya
  framework:
    version: latest

# Enable logging
logger:

# Enable Home Assistant API
api:

web_server:
  port: 80

ota:
    platform: esphome
wifi:
  networks:
  ap:
    password: !secret captive_portal_ap_password

# Output pins
output:
  - platform: libretiny_pwm
    id: red_color
    pin: GPIO26
    inverted: False
  - platform: libretiny_pwm
    id: green_color
    pin: GPIO24
    inverted: False
  - platform: libretiny_pwm
    id: blue_color
    pin: GPIO06
    inverted: False
  - platform: libretiny_pwm
    id: cold_white
    pin: GPIO08
    inverted: False
    # max_power: 50%
  - platform: libretiny_pwm
    id: warm_white
    pin: GPIO07
    inverted: False
    # max_power: 50%

light:
  - platform: rgbww
    name: "$devicename 65W"
    id: "light_feitbulb_65W"
    red: red_color
    green: green_color
    blue: blue_color
    cold_white: cold_white
    warm_white: warm_white
    cold_white_color_temperature: 6536 K
    warm_white_color_temperature: 2000 K
    color_interlock: true
    restore_mode: ALWAYS_ON
    effects:
      - random:
      - pulse:
      - strobe:
      - flicker:
```
