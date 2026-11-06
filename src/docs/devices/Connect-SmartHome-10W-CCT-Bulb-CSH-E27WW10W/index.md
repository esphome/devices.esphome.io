---
title: Connect SmartHome 10W CCT Smart White LED Bulb E27 (CSH-E27WW10W)
date-published: 2021-11-01
type: light
standard: au
board: esp8266
---

![Connect SmartHome 10W CCT Smart White LED Bulb](connect_smarthome_CSH-E27WW10W.jpg "Connect SmartHome 10W CCT Smart White LED Bulb")

## Device Info

This Connect Smart Bulb has an E27 Edison fitting.

SKU: CSH-E27WW10W

**Available from:**

- [Harvey Norman](https://www.harveynorman.com.au/)
- [Laser](https://www.laserco.com.au/)

**Manufacturer:**

- [Connect SmartHome](https://connectsmarthome.com.au/product/connect-10w-smart-white-bulb-e27/)

## GPIO Pinout

| Pin    | Function                     |
| ------ | ---------------------------- |
| GPIO5  | Cold white color temperature |
| GPIO13 | Warm white color temperature |

## Basic Configuration

```yaml
substitutions:
  device_name: "csh-e27ww10w"
  friendly_name: "Connect SmartHome CSH-E27WW10W"

esphome:
  name: ${device_name}
  comment: ${friendly_name}

esp8266:
  board: esp01_1m
  restore_from_flash: true

wifi:
  ssid: "ssid"
  password: "password"

  ap:
    ssid: ${device_name}
    password: "password"

captive_portal:

logger:

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: "password"

output:
  - platform: esp8266_pwm
    id: cw_color_temp
    pin: GPIO5
  - platform: esp8266_pwm
    id: ww_color_temp
    pin: GPIO13

light:
  - platform: cwww
    name: ${friendly_name}
    cold_white: cw_color_temp
    warm_white: ww_color_temp
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
    effects:
      - random:
      - pulse:
      - strobe:
      - flicker:
```
