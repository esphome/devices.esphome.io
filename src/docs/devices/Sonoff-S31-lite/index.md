---
title: Sonoff S31-lite
date-published: 2023-06-12
type: plug
standard: us
board: esp8266
---

## Initial Install

This device cannot be converted to ESPHome using tuya-convert.

You must [remove the cover and use the serial header](https://www.adventurousway.com/blog/sonoff-s31) for first upload.
Hold down the button while powering on the device to put it into bootloader mode.

## GPIO Pinout

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO0  | Push Button (HIGH = off, LOW = on) |
| GPIO12 | Relay and its status LED           |
| GPIO13 | Green LED (HIGH = off, LOW = on)   |
| GPIO1  | RX pin (for external sensors)      |
| GPIO3  | TX pin (for external sensors)      |

## Basic Configuration

```yaml
esphome:
  name: SonoffS31lite
  friendly_name: SONOFF S31 Lite

esp8266:
  board: esp01_1m
  framework:
    version: recommended

# Enable Home Assistant API
api:
  encryption:
    key: ""

ota:
  password: ""

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:
  baud_rate: 0 # (UART logging interferes with cse7766)

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "Sonoff S31-lite  Fallback Hotspot"
    password: ""

captive_portal:

uart:
  rx_pin: RX
  baud_rate: 4800

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    name: "Sonoff S31-lite Button"
    on_press:
      - switch.toggle: relay
  - platform: status
    name: "Sonoff S31-lite Status"

sensor:
  - platform: wifi_signal
    name: "Sonoff S31-lite WiFi Signal"
    update_interval: 60s

switch:
  - platform: gpio
    name: "Sonoff S31-lite Relay"
    pin: GPIO12
    id: relay
    restore_mode: ALWAYS_ON

time:
  - platform: sntp
    id: my_time

status_led:
  pin:
    number: GPIO13
    inverted: True
```
