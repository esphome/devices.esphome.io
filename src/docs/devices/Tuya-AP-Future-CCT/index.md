---
title: Tuya AP Future CCT LED Controller
date-published: 2021-11-02
type: light
standard: global
board: esp8266
---

## General Notes

Tuya AP Future CCT LED Controller with a tywe3s chip.

Available on [aliexpress](https://www.aliexpress.com/item/4000080534824.html) from multiple vendors.

Other versions of this controller are available that do RGB, RGBW, RGBCW.

Flashed using the [Digiblur Clamp method](https://www.digiblur.com/2020/07/free-your-smart-devices-from-cloud.html)

![alt text](./Tuya-AP-Future-CCT.png "Tuya AP Future CCT LED Controller")

## GPIO Pinout

| Pin    | Function           |
| ------ | ------------------ |
| GPIO5  | Cold White Channel |
| CPIO13 | Warm White Channel |

## Basic Configuration

```yaml
# Basic Config

substitutions:
  device_name: led_strip
  device_description: CCT LED Strip.
  friendly_name: CCT LED strip

esphome:
  name: ${device_name}
  comment: ${device_description}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  ap: #since we listed an SSID above, this AP mode will only enable if no WiFi connection could be made
    ssid: ${friendly_name}_AP
    password: !secret wifi_password

captive_portal:

# Enable logging
logger:
  baudrate: 0 #Disable UART logging

# Enable Home Assistant API
api:

ota:

# Enable web server
web_server:
  port: 80

# Device Specific Config

light:
  - platform: cwww
    name: "CCT Lights"
    cold_white: cold_white_channel
    warm_white: warm_white_channel
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K

output:
  - platform: esp8266_pwm
    id: warm_white_channel
    pin: GPIO13
  - platform: esp8266_pwm
    id: cold_white_channel
    pin: GPIO5
```
