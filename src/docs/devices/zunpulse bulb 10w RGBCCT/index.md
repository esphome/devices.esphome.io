---
title: Zunpulse bulb 10w RGBCCT
date-published: 2025-01-09
type: light
standard: in
board: bk72xx
difficulty: 4
---

## GPIO pinout

| Pin    | Function          |
|--------|-------------------|
| P26    | Red               |
| P6     | Green             |
| P24    | Blue              |
| P8     | Output cold       |
| P7     | Output warm       |

## Basic configuration

```yaml
esphome:
  name: zunpulse-light
  friendly_name: zunpulse light

bk72xx:
  board: cb2l

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: ""

ota:
  - platform: esphome
    password: ""

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "Zunpulse-Light1 Fallback Hotspot"
    password: ""

captive_portal:

web_server:
  port: 80

text_sensor:
  - platform: libretiny
    version:
      name: LibreTiny Version

output:
  - platform: libretiny_pwm
    id: output_red
    pin: P26
  - platform: libretiny_pwm
    id: output_green
    pin: P6
  - platform: libretiny_pwm
    id: output_blue
    pin: P24
  - platform: libretiny_pwm
    id: output_cold
    pin: P8
  - platform: libretiny_pwm
    id: output_warm
    pin: P7

light:
  - platform: rgbww
    id: light_rgbww
    name: Light
    color_interlock: true
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
    red: output_red
    green: output_green
    blue: output_blue
    cold_white: output_cold
    warm_white: output_warm
    restore_mode: RESTORE_AND_ON
