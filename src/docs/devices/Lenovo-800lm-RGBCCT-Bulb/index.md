---
title: Lenovo 800lm RGBCCT Bulb
date-published: 2022-11-19
type: light
standard: global
board: esp8266
---

![Lenovo bulb packaging view](lenovo_ZG38C02978.webp "Lenovo 800 lumens RGB + CCT bulb")
[Lenovo 800 lumen RGB + CCT bulb](https://www.lenovo.com/es/es/smart-bulb/).

## Flashing

This plug can be converted using [tuya-convert to flash ESPHome](/devices/tuya-convert) (as of June 2020).

## Temperature

Range temperature from 2700 Kelvin to 6500 Kelvin. Information extracted from product description.

## GPIO Pinout

| Pin    | Function          |
|--------|-------------------|
| GPIO04 | Red               |
| GPIO12 | Green             |
| GPIO14 | Blue              |
| GPIO05 | White Brightness  |
| GPIO13 | White Temperature |

## Basic Configuration

```yaml
substitutions:
  device_name: "lenovo-800lm-rgbcct"
  friendly_name: "Lenovo 800lm RGBCCT"

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:
  password: !secret "ota_password"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: !secret "ap-ssid"
    password: !secret "ap-pass"

captive_portal:

sensor:
  - platform: uptime
    name: ${friendly_name} Uptime

  - platform: wifi_signal
    name: ${friendly_name} Signal Strength

output:
  - platform: esp8266_pwm
    id: output_r
    pin: GPIO4
  - platform: esp8266_pwm
    pin: GPIO12
    id: output_g
  - platform: esp8266_pwm
    pin: GPIO14
    id: output_b
  - platform: esp8266_pwm
    id: output_brightness
    pin: GPIO5
  - platform: esp8266_pwm
    pin:
      number: GPIO13
      inverted: true
    id: output_temp

light:
  - platform: rgbct
    color_interlock: true
    name: ${friendly_name}
    red: output_r
    green: output_g
    blue: output_b
    white_brightness: output_brightness
    color_temperature: output_temp
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
```
