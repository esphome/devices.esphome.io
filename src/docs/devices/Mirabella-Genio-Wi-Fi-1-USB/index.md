---
title: Mirabella Genio Wi-Fi 1 USB Adaptor
date-published: 2023-04-12
type: plug
standard: au
board: esp8266
---

Mirabella Genio Smart Plugs are a Tuya-based smart plugs
sold by Bunnings and Kmart respectively in Australia.

![mirabella-genio-smart](./brilliant-mirabella-genio-smart-plugs.jpg)

## Basic Configuration

``` yaml
substitutions:
  name: mirabella_genio_smart_plug
  friendly_name: Mirabella Genio Smart Plug

esphome:
  name: ${name}

esp8266:
  board: esp01_1m

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
      mode:
        input: true
        pullup: true
      inverted: true
    name: "${friendly_name} Button"
    on_press:
      - switch.toggle: relay

switch:
  - platform: gpio
    id: red_led
    pin:
      number: GPIO4
      inverted: true

  - platform: gpio
    name: "${friendly_name}"
    pin: GPIO12
    id: relay

    # Turn on red LED
    on_turn_on:
      - switch.turn_on: red_led

    # Turns off red LED
    on_turn_off:
      - switch.turn_off: red_led
```
