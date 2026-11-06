---
title: Arlec Grid Connect Smart Plug In Socket With 2.1A USB Charger
date-published: 2023-04-12
type: plug
standard: au
board: esp8266
---

Arlec Grid Connect products are a Tuya-based smart devices
sold by Bunnings and Kmart respectively in Australia.

![image](./brilliant-mirabella-genio-smart-plugs.jpg)

## Basic Configuration

```yaml
substitutions:
  name: arlec_pc389ha_001
  friendly_name: Arlec Smart Plug

esphome:
  name: ${name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:

binary_sensor:
  - platform: gpio
    pin:
      number: 14
      mode:
        input: true
        pullup: true
      inverted: true
    name: "${friendly_name} Button"
    on_press:
      - switch.toggle: relay

switch:
  - platform: gpio
    id: blue_led
    pin:
      number: GPIO4
      inverted: true

  - platform: gpio
    id: red_led
    pin:
      number: GPIO13
      inverted: true

  - platform: gpio
    name: "${friendly_name} Power"
    pin: GPIO12
    id: relay
    on_turn_on:
      # Turn off blue LED to show blue when turned on
      - switch.turn_off: red_led
      - switch.turn_on: blue_led
    on_turn_off:
      # Turns on the blue LED once the plug is turned off
      - switch.turn_off: blue_led
      - switch.turn_on: red_led
```
