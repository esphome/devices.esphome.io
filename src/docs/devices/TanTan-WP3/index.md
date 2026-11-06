---
title: TanTan WP3 Plug
date-published: 2024-12-11
type: plug
standard: us
board: esp8266
---

![alt text](tantan-wp3-plug.jpg "TanTan WP3 Plug")

The GPIO pinout was learned from [Blakadder Tasmota](https://templates.blakadder.com/tantan_WP3.html) documentation and
adapted through trial and error.

## GPIO Pinout

| Pin    | Function            |
| ------ | ------------------- |
| GPIO04 | Button              |
| GPIO12 | Red LED (inverted)  |
| GPIO13 | Blue LED (inverted) |
| GPIO14 | Relay               |

## Basic Configuration

```yaml
substitutions:
  name: tantan-wp3-plug
  friendly_name: TanTan WP3 Plug

esphome:
  name: ${name}
  friendly_name: ${friendly_name}
  on_boot:
    then:
      - switch.turn_on: red_led
      - delay: 5s
      - switch.turn_off: red_led

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
    pin: GPIO04
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
    pin: GPIO14
    name: "${friendly_name}"
    id: relay
    on_turn_on:
      - switch.turn_on: blue_led
    on_turn_off:
      - switch.turn_off: blue_led

  # the indicator leds in the on off button
  - platform: gpio
    pin:
      number: GPIO12
      inverted: true
    id: red_led

  - platform: gpio
    pin:
      number: GPIO13
      inverted: true
    id: blue_led
```
