---
title: Arlec Grid Connect Smart E27 LED 830lm RGB CCT Colour Mode 10W Globe (GLD322HA)
date-published: 2023-12-11
type: light
standard: au
board: esp8266
difficulty: 5
---

Sold at Bunnings in Australia as
[Model number GLD322HA](https://www.bunnings.com.au/arlec-grid-connect-smart-e27-led-830lm-rgb-cct-colour-mode-10w-globe_p0321374).

This device uses WB2L module which needs to be replaced with ESP-M3, DMP-L1, ESP8685-WROOM-05, DT-ESP-C05 or
ESP8684-WROOM-05. Read more about module replacement in a
[detailed guide](https://blakadder.com/replace-tuya-cb2l-wb2l-bw2l/).

If replaced with ESP-M3, then the following is the pinout:

## GPIO Pinout ESP-M3

| Pin    | Function     |
| ------ | ------------ |
| GPIO01 | SM2135 Data  |
| GPIO03 | SM2135 Clock |

## Basic Configuration

```yaml
substitutions:
  device_name: "alrec-gld322ha"
  friendly_name: "Arlec GLD322HA"

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m

# Enable logging
logger:

# Enable Home Assistant API
api:
  password: !secret ota_password

ota:
  password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

web_server:
  port: 80

sm2135:
  data_pin: GPIO01
  clock_pin: GPIO03
  rgb_current: 25mA
  cw_current: 25mA

# Individual outputs
output:
  - platform: sm2135
    id: output_blue
    channel: 0
    max_power: 1
  - platform: sm2135
    id: output_green
    channel: 1
    max_power: 1
  - platform: sm2135
    id: output_red
    channel: 2
    max_power: 1
  - platform: sm2135
    id: output_white
    channel: 3
    max_power: 1
  - platform: sm2135
    id: output_warmwhite
    channel: 4
    max_power: 1

light:
  - platform: rgbww
    name: ${friendly_name}
    red: output_red
    green: output_green
    blue: output_blue
    cold_white: output_white
    warm_white: output_warmwhite
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 3000 K
    color_interlock: true
```
