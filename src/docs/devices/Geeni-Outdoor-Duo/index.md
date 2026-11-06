---
title: Geeni Outdoor Duo
date-published: 2024-01-24
type: plug
standard: us
board: esp8266
---

[Amazon Link](https://www.amazon.com/dp/B07SQB5PKQ)

[Manufacturer Link](https://mygeeni.com/products/outdoor-duo-dual-outlet-smart-wi-fi-plug-grey)

## Product Image

![Geeni Outdoor Duo](image.jpg)

## Description

This device has two plugs, a green LED, a blue LED, and a button. The LEDs and button sit directly under a translucent
rubber cap.

The plug is based on the Tuya WB3S module which is pin compatable with the ESP12 series of ESP8266 modules.
The factory WB3S can be converted using [tuya convert](https://devices.esphome.io/devices/tuya-convert) (untested on this
model), but it is equally possible to replace the WB3S with an ESP12 with some basic hot air rework.

The control board is completely seperate from the relay board and can be removed easily for soldering.

If the module is going to be replaced with an ESP12 it is recommended to program the module using a USB board burning
fixture, however it is still fairly straightforward to program the board using the using any 3.3v USB to Serial cable.

There are no pin headers broken out onto the board. First time programming connections will have to be made by soldering
or spring pins.

## GPIO Pinout

| Pin    | Function                        |
| ------ | ------------------------------- |
| GPIO0  | Button (inverted)               |
| GPIO5  | Green LED (inverted)            |
| GPIO13 | Blue LED (inverted)             |
| GPIO14 | Left (when facing device) plug  |
| GPIO16 | Right (when facing device) plug |

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: geeni_outdoor
  friendly_name:
    geeni
    # Change board to 'esp12e' if the original Tuya WB3S has been desoldered and replaced with an ESP12

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:

api:
  encryption:
    key:
      !secret encryption_key
      # Or copy the encription key from the "Add Device" menu of ESPHome

ota:
  password: !secret ota_password

#web_server:
#  port: 80
# Running the web server may cause issues on lower memory modules

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    name: "Button"
    on_multi_click:
      # Support a single or double click to switch on each relay
      - timing:
          - ON for at most 1s
          - OFF for at least 0.5s
        then:
          - switch.toggle: relay_left
      - timing:
          - ON for at most 1s
          - OFF for at most 1s
          - ON for at most 1s
          - OFF for at least 0.2s
        then:
          - switch.toggle: relay_right

switch:
  - platform: gpio
    name: "Left plug"
    pin: GPIO14
    id: relay_left
    on_turn_on:
      - light.turn_on: blue_led
    on_turn_off:
      - light.turn_off: blue_led
  - platform: gpio
    name: "Right plug"
    pin: GPIO16
    id: relay_right
    on_turn_on:
      - light.turn_on: green_led
    on_turn_off:
      - light.turn_off: green_led

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
