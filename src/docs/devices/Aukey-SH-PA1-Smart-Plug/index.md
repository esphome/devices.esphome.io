---
title: Aukey SH-PA1 Wi-Fi Smart Plug
date-published: 2020-04-11
type: plug
standard: us
board: esp8266
---

![alt text](./aukey-plug.jpg "Aukey SH-PA1 Smart WiFi Plug")

## GPIO Pinout

| Pin    | Function            |
| ------ | ------------------- |
| GPIO0  | Red LED (inverted)  |
| GPIO2  | Blue LED (inverted) |
| GPIO13 | Push Button         |
| GPIO15 | Relay               |

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: mini_tree

esp8266:
  board: esp01_1m
  platformio_options:
    upload_speed: 115200

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: "ota_password"

output:
  - platform: gpio
    pin: GPIO15
    id: plug_outlet

  - platform: gpio
    pin:
      number: GPIO2
      inverted: yes
    id: blue_led_output

light:
  - platform: binary
    name: "Mini Tree"
    id: mini_tree
    output: plug_outlet
    on_turn_on:
      - light.turn_on: blue_led
    on_turn_off:
      - light.turn_off: blue_led
  - platform: binary
    id: blue_led
    output: blue_led_output

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
    id: mini_tree_button
    on_press:
      light.toggle: mini_tree

status_led:
  # Red LED
  pin:
    number: GPIO0
    inverted: yes
```
