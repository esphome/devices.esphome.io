---
title: Hama WiFi LED Lamp GU10 400lm RGB 5.5W (176598)
date-published: 2025-09-28
type: light
standard: eu
board: bk72xx
---

Tuya SmartLife app recognizes the device as `176582 / 176598`.

Can be flashed with ESPHome Kickstart via `tuya-cloudcutter` using the profile `1.1.2 - BK7231T / oem_bk7231s_light_ty`
or `hama-176586-e14-white-candle-smart-bulb`.

## Basic Configuration

```yaml
substitutions:
  device_name: hama-gu10-rgb
  friendly_name: Hama-GU10-RGB
  
esphome:
  name: "${device_name}"
  friendly_name: "${friendly_name}"
  on_boot:
    priority: 600
    then:
      - light.turn_on:
          id: light_rgbww
          brightness: 100%
          color_temperature: 2700K

bk72xx:
  board: generic-bk7231t-qfn32-tuya

# Enable logging
#logger:
#  level: WARN

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
    ssid: "Hama-Gu10-RGB Fallback Hotspot"
    password: ""

captive_portal:

mdns:

web_server:
  version: 1

bp1658cj:
  data_pin: P24
  clock_pin: P26
  max_power_color_channels: 4
  max_power_white_channels: 6

output:
  - platform: bp1658cj
    id: output_warm
    channel: 3
  - platform: bp1658cj
    id: output_cold
    channel: 4
  - platform: bp1658cj
    id: output_red
    channel: 1
  - platform: bp1658cj
    id: output_green
    channel: 0
  - platform: bp1658cj
    id: output_blue
    channel: 2

light:
  - platform: rgbww
    id: light_rgbww
    name: "Light"
    color_interlock: true
    constant_brightness: false
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
    red: output_red
    green: output_green
    blue: output_blue
    cold_white: output_cold
    warm_white: output_warm
    default_transition_length: 0.1s
```
