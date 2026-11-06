---
title: Arlec Grid Connect Smart GU10 LED 420lm RGB CCT Colour Mode 5.5W Globe (GLD381HA)
date-published: 2024-06-13
type: light
standard: au
board: bk72xx
difficulty: 4
---

Sold at Bunnings in Australia as
[Model number GLD381HA](https://www.bunnings.com.au/arlec-grid-connect-smart-gu10-led-420lm-rgb-cct-colour-mode-5-5w-globe_p0329569).

This device uses a CBLC9 module (BK7231N MCU), and can be flashed with the `kickstart-bk7231n.uf2`
[Kickstart](https://github.com/libretiny-eu/esphome-kickstart) firmware using
[ltchiptool](https://github.com/libretiny-eu/ltchiptool).

The board for this device cannot be accessed easily without destroying the housing to some degree. However, once the
GU10 connectors are carefully pulled out and the front diffuser has been removed, the TX/RX pins can be accessed.

## GPIO Pinout CBLC9

| Pin    | Function     |
| ------ | ------------ |
| GPIO07 | SM2135 Data  |
| GPIO09 | SM2135 Clock |

## Basic Configuration

```yaml
substitutions:
  device_name: "alrec-gld381ha"

esphome:
  name: ${device_name}
  friendly_name: "Arlec GLD381HA"

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

sm2135:
  clock_pin: P9
  data_pin: P7
  rgb_current: 20mA
  cw_current: 25mA

# Individual outputs
output:
  - platform: sm2135
    id: output_red
    channel: 0
  - platform: sm2135
    id: output_green
    channel: 2
  - platform: sm2135
    id: output_blue
    channel: 1
  - platform: sm2135
    id: output_cold
    channel: 4
  - platform: sm2135
    id: output_warm
    channel: 3

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
```
