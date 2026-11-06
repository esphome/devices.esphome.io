---
title: Mirabella Genio Wi-Fi Dimmable Warm White ES 9W LED GLS Bulb
date-published: 2023-04-30
type: light
standard: au
board: esp8266
---

## GPIO Pinout

| Pin        | Function |
| ---------- | -------- |
| GPIO14 PWM | Light    |

## Basic Configuration

```yaml
# Basic Config
# https://www.mirabellagenio.com.au/product-range/mirabella-genio-wi-fi-dimmable-9w-led-gls-bulb/
esphome:
  name: genio22
  on_boot:
    priority: 100 # Highest priority, ensures light turns on without delay.
    then:
      - light.turn_on: genio22

esp8266:
  board: esp01_1m
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "genio22 Fallback Hotspot"
    password: !secret wifi_password

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret ha_encrypt_password

ota:
  password: !secret esp_ota_password

web_server:
  port: 80
sensor:
  - platform: wifi_signal
    name: "genio22 WiFi Signal"
    update_interval: 60s

switch:
  - platform: restart
    name: "genio22 Restart"

output:
  - platform: esp8266_pwm
    pin: 14
    frequency: 1000 Hz
    id: pwm_output

light:
  - platform: monochromatic
    name: "genio22 Light"
    output: pwm_output
    id: genio22
```
