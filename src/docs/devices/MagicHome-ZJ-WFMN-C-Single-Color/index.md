---
title: MagicHome-ZJ-WFMN-C-Single Color V1.1 LED Controller
date-published: 2023-07-30
type: light
standard: global
board: esp8266
difficulty: 4
---

## General Notes

MagicHome LED controller too be used with an monochromatic LED strip.

**information_source** Please note that MagicHome began to produce devices with BL602 chip instead of ESP. ESPHome is
not compatible with BL602. Before buying make sure a controller is using the right chip.

![alt text](magichome_single_color.png "MagicHome LED strip controller")

## GPIO Pinout

| Pin    | Function |
| ------ | -------- |
| GPIO12 | PWM      |

## Basic Configuration

```yaml
# Basic Config

substitutions:
  device_name: led-strip
  device_description: RGB LED Strip Controller.
  friendly_name: LED Controller

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

# Enable Home Assistant API
api:

ota:

# Enable web server
web_server:
  port: 80

output:
  - platform: esp8266_pwm
    id: LED_controller
    pin: GPIO12

light:
  - platform: monochromatic
    name: "LED"
    output: LED_controller
```
