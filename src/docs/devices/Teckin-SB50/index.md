---
title: Teckin SB50
date-published: 2022-06-02
type: light
standard: us
board: esp8266
---

## General Notes

On older firmwares this bulb can [use tuya-convert to flash ESPHome](/devices/tuya-convert).

## GPIO Pinout

| Pin    | Function      |
| ------ | ------------- |
| GPIO14 | Red Channel   |
| GPIO12 | Green Channel |
| GPIO13 | Blue Channel  |
| GPIO4  | White Channel |

## Basic Configuration

```yaml
esphome:
  name: teckin_sb50

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

# Enable logging to ESPHome
logger:
  # Disable logging to serial
  baud_rate: 0

# Enable Home Assistant API
api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: "ota_password"

# Define output pins
output:
  - platform: esp8266_pwm
    id: output_red
    pin: GPIO14
  - platform: esp8266_pwm
    id: output_green
    pin: GPIO12
  - platform: esp8266_pwm
    id: output_blue
    pin: GPIO13
  - platform: esp8266_pwm
    id: output_white
    pin: GPIO4

# Define a light entity
light:
  - platform: rgbw
    name: $devicename
    id: $devicename
    red: output_red
    green: output_green
    blue: output_blue
    white: output_white
```
