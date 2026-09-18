---
title: Martin Jerry US-SS01
date-published: 2023-09-27
type: switch
standard: us
board: esp8266
---

[Amazon Link](https://www.amazon.com/dp/B09C1R7PDK)

[Device on Martin Jerry](https://www.martinjerry.com/us-ss01-support)

## GPIO Pinout

| Pin    | Function |
| ------ | -------- |
| GPIO3  | button   |
| GPIO5  | relay    |
| GPIO12 | red LED  |
| GPIO14 | blue LED |

## Basic Configuration

```yaml
esphome:
  name: ${device_name}
  friendly_name: ${friendly_name}

substitutions:
  device_name: martin-jerry-ss01
  friendly_name: Martin Jerry SS01

esp8266:
  board: esp8285

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key:

ota:
  password:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: ${friendly_name}_AP
    password: !secret wifi_password

captive_portal:

switch:
  # relay output
  - platform: gpio
    id: relay
    name: Relay
    pin: GPIO05

    on_turn_on:
      - switch.turn_on: blue_led
      - switch.turn_off: red_led

    on_turn_off:
      - switch.turn_on: blue_led
      - switch.turn_on: red_led

  - platform: gpio
    pin: GPIO12
    id: red_led
    name: Red LED
    inverted: true

  - platform: gpio
    pin: GPIO14
    id: blue_led
    name: Blue LED
    inverted: true

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO03
      mode: INPUT_PULLUP
      inverted: true
    name: Main Button
    on_press:
      - switch.toggle: relay

button:
  - platform: restart
    id: restart_button
    name: Restart
    entity_category: diagnostic
```
