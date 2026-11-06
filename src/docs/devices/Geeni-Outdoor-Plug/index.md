---
title: Geeni Outdoor Plug
date-published: 2020-07-03
type: plug
standard: us
board: esp8266
---

## GPIO Pinout

| Pin    | Function             |
| ------ | -------------------- |
| GPIO0  | Button (inverted)    |
| GPIO5  | Green LED (inverted) |
| GPIO13 | Blue LED (inverted)  |
| GPIO14 | Plug                 |

## Basic Configuration

```yaml
esphome:
  name: geeni_outdoor_plug

esp8266:
  board: esp01_1m

  wifi:
    ssid: "wifi"
    password: !secret wifi_password

    ap:
      ssid: "Fallback Hotspot"
      password: !secret local_ap_password

  captive_portal:

  logger:

  api:

  ota:

  web_server:

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    name: "Button"
    on_press:
      then:
        - switch.toggle: relay

switch:
  - platform: gpio
    name: "Plug"
    pin: GPIO14
    id: relay
    on_turn_on:
      - light.turn_on: blue_led
    on_turn_off:
      - light.turn_off: blue_led

output:
  - platform: gpio
    pin: GPIO5
    inverted: True
    id: green_led_gpio
  - platform: gpio
    pin: GPIO13
    inverted: True
    id: blue_led_gpio

light:
  - platform: binary
    name: "Green LED"
    id: green_led
    output: green_led_gpio
  - platform: binary
    name: "Blue LED"
    id: blue_led
    output: blue_led_gpio
```
