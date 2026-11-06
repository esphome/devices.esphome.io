---
title: Wyze Plug (Pre-2021)
date-published: 2026-01-06
type: plug
standard: us
board: esp8266
---

## General Notes

This configuration is for Pre-2021 versions of the Wyze Smart Plug. Unlike newer versions, it features an ESP8266.
The model number is WLPP1 (note: no suffix).

## Initial Install

This device is glued together pretty tightly, but can be opened with the application of hot air and prying. It must be
opened for the first upload.

## GPIO Pinout

| Pin    | Function  |
| ------ | --------- |
| GPIO14 | Button    |
| GPIO12 | Relay     |
| GPIO5  | Relay LED |

## Basic Configuration

```yaml
substitutions:
  device_name: wyze-plug-wlpp1
  friendly_name: "Wyze Plug"

esphome:
  name: ${device_name}
  friendly_name: ${friendly_name}

esp8266:
  board: esp01_1m

# Enable logging
logger:

# Enable Home Assistant API
api:

# Allow Over-The-Air updates
ota:
  - platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  min_auth_mode: WPA2
  ap:
    ssid: "${friendly_name} Recovery"

captive_portal:

web_server:
  port: 80

# -------------------------
# Relay (GPIO12)
# -------------------------
switch:
  - platform: gpio
    name: "${friendly_name} Relay"
    id: relay
    pin: GPIO12
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_on:
      - output.turn_on: led_output
    on_turn_off:
      - output.turn_off: led_output

# -------------------------
# Physical Button (GPIO14)
# -------------------------
binary_sensor:
  - platform: gpio
    name: "${friendly_name} Button"
    pin:
      number: GPIO14
      mode: INPUT_PULLUP
      inverted: true
    on_press:
      - switch.toggle: relay

# -------------------------
# Blue Status LED (GPIO5, active-low)
# -------------------------
output:
  - platform: gpio
    id: led_output
    pin: GPIO5
    inverted: true
```
