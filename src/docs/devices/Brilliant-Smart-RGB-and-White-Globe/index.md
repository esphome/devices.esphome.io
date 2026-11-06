---
title: Brilliant Smart RGB and White Globe
date-published: 2020-05-25
type: light
standard: au
board: esp8266
---

## General Notes

[https://www.officeworks.com.au/shop/officeworks/p/brilliant-smart-rgb-and-white-globe-b22-bl20877](https://www.officeworks.com.au/shop/officeworks/p/brilliant-smart-rgb-and-white-globe-b22-bl20877)

## GPIO Pinout

| Pin     | Function                           |
|---------|------------------------------------|
| GPIO4   | SM16716 Data Pin                   |
| GPIO5   | SM16716 Clock Pin                  |
| GPIO12  | PWM Light - White                  |
| GPIO13  | SM16716 Power Supply               |

## Basic Configuration

```yaml
esphome:
  name: "Brilliant Smart RGBW"

esp8266:
  board: esp01_1m

wifi:
  ssid: <YOUR_SSID>
  password: <YOUR_WIFI_PASSPHRASE>

api:

logger:

ota:

sm16716:
  data_pin: GPIO4
  clock_pin: GPIO5
  num_channels: 3
  num_chips: 1

output:
  - platform: sm16716
    id: output_red
    channel: 2
    power_supply: rgb_power
  - platform: sm16716
    id: output_green
    channel: 1
    power_supply: rgb_power
  - platform: sm16716
    id: output_blue
    channel: 0
    power_supply: rgb_power
  - platform: esp8266_pwm
    id: output_white
    pin: GPIO12

power_supply:
  - id: rgb_power
    pin: GPIO13

light:
  - platform: rgbw
    name: "brilliant_smart_rgbw"
    id: light_1
    red: output_red
    green: output_green
    blue: output_blue
    white: output_white
    restore_mode: ALWAYS_ON
```
