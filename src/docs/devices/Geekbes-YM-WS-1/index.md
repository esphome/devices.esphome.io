---
title: Geekbes YM-WS-1 Plug
date-published: 2024-12-10
type: plug
standard: us
board: esp8266
---

![alt text](geekbes_YM-WS-1.png "Geekbes YM-WS-1 Plug")

The GPIO pinout was learned from [Blakadder Tasmota](https://templates.blakadder.com/geekbes_YM-WS-1.html) documentation
and adapted through trial and error.

## GPIO Pinout

| Pin    | Function |
| ------ | -------- |
| GPIO12 | LedLink  |
| GPIO13 | Button   |
| GPIO15 | Relay    |

## Basic Configuration

```yaml
substitutions:
  name: geekbes-ym-ws-1
  friendly_name: Geekbes YM-WS-1 Plug

esphome:
  name: ${name}
  friendly_name: ${friendly_name}

esp8266:
  board: esp01_1m

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:
  - platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

binary_sensor:
  # Connected to HA
  - platform: status
    name: "Status"

  # the on off button
  - platform: gpio
    pin: GPIO13
    filters:
      - invert:
      - delayed_on: 100ms
      - delayed_off: 100ms
      - delayed_on_off: 100ms
    name: "${friendly_name} Button"
    on_press:
      - switch.toggle: relay

switch:
  # the relay that controls the output power
  - platform: gpio
    pin: GPIO15
    name: "${friendly_name}"
    id: relay
    on_turn_on:
      - switch.turn_on: blue_led
    on_turn_off:
      - switch.turn_off: blue_led

  # the indicator led in the on off button
  - platform: gpio
    pin:
      number: GPIO12
      inverted: true
    id: blue_led
```
