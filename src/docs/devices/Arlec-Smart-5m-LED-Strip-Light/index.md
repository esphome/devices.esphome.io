---
title: Arlec Smart 2m/5m LED Strip Light
date-published: 2020-01-21
type: light
standard: au
board: esp8266
---

## General Notes

This configuration is for the [Arlec Smart 2m LED Strip Light](https://www.bunnings.com.au/arlec-2m-led-white-smart-colour-changing-strip-light-with-grid-connect_p0099707)
and [Arlec Smart 5m LED Strip Light](https://www.bunnings.com.au/arlec-smart-5m-colour-changing-plus-white-led-strip-light-with-grid-connect_p0099708)
which comes as a colour changing LED strip with controller and transformer.

![Arlec Smart 5m LED Strip Light](./Arlec-Smart-5m-LED-Strip-Light.jpg "Arlec Smart 5m LED Strip Light")

## GPIO Pinout

| Pin    | Function      |
| ------ | ------------- |
| GPIO4  | Red Channel   |
| GPIO12 | Green Channel |
| GPIO14 | Blue Channel  |
| GPIO5  | White Channel |

## Basic Configuration

```yaml
esphome:
  name: led_strip

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

logger:

web_server:

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: "ota_password"

light:
  - platform: rgbw
    name: "LED Strip"
    red: output_red
    green: output_green
    blue: output_blue
    white: output_white
    restore_mode: RESTORE_DEFAULT_OFF

output:
  - platform: esp8266_pwm
    id: output_red
    pin: GPIO4
  - platform: esp8266_pwm
    id: output_green
    pin: GPIO12
  - platform: esp8266_pwm
    id: output_blue
    pin: GPIO14
  - platform: esp8266_pwm
    id: output_white
    pin: GPIO5
```
