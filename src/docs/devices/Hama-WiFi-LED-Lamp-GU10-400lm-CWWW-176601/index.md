---
title: Hama WiFi LED Lamp GU10 400lm CWWW 5.5W (176601)
date-published: 2025-09-28
type: light
standard: eu
board: bk72xx
---

Tuya SmartLife app recognizes the device as `176585 / 176601`.

Can be flashed with ESPHome Kickstart via `tuya-cloudcutter` using the profile `1.1.2 - BK7231T / oem_bk7231s_light_ty`
or `hama-176586-e14-white-candle-smart-bulb`.

## Basic Configuration

```yaml
substitutions:
  device_name: hama-gu10
  friendly_name: Hama-GU10
  
esphome:
  name: "${device_name}"
  friendly_name: "${friendly_name}"
  on_boot:
    priority: 600
    then:
      - light.turn_on:
          id: light_cwww
          brightness: 100%
          color_temperature: 2700K

bk72xx:
  board: generic-bk7231t-qfn32-tuya

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
    ssid: "Hama-GU10 Fallback Hotspot"
    password: ""

captive_portal:

mdns:

web_server:

output:
  - platform: libretiny_pwm
    id: output_cold
    pin: P26
  - platform: libretiny_pwm
    id: output_warm
    pin: P24

light:
  - platform: cwww
    id: light_cwww
    name: "Light"
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
    cold_white: output_cold
    warm_white: output_warm
    constant_brightness: false
```
