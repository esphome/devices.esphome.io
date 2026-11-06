---
title: Mirabella Genio Wi-Fi SES LED Candle
date-published: 2019-12-06
type: light
standard: au
board: esp8266
---

## General Notes

This is for [Mirabella Genio Wi-Fi SES LED Candle](https://mirabellagenio.net.au/ses-led-candle).

![Genio Wi-Fi SES LED Candle](./mirabella-genio-wi-fi-ses-led-candle.jpg "Genio Wi-Fi SES LED Candle")

## GPIO Pinout

| Pin    | Function           |
| ------ | ------------------ |
| GPIO12 | Light - Warm White |
| GPIO12 | Light - Cool White |

## Basic Configuration

```yaml
# Basic Config
# https://mirabellagenio.net.au/ses-led-candle
esphome:
  name: mirabella_1
  on_boot:
    priority: 100 # Highest priority, ensures light turns on without delay.
    then:
      - light.turn_on: light

esp8266:
  board: esp01_1m
wifi:
  ssid: "sid"
  password: "wifi_password"
  ap:
    ssid: "mirabella1"
    password: "ap_password"
  domain: ".mydomain.com"

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

ota:
  password: "ota_password"

web_server:
  port: 80

sensor:
  - platform: wifi_signal
    name: "Mirabella LED Candle WiFi Signal"
    update_interval: 60s

mqtt:
  broker: MQTT_SERVER_IP
  discovery: false

output:
  - platform: esp8266_pwm
    id: output_warm_white
    pin: GPIO12
  - platform: esp8266_pwm
    id: output_daylight
    pin: GPIO14

light:
  - platform: cwww
    name: "LED Candle"
    cold_white: output_daylight
    warm_white: output_warm_white
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K

    # Ensure the light turns on by default if the physical switch is actuated.
    restore_mode: ALWAYS_ON
```
