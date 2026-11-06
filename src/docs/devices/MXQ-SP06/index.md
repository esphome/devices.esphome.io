---
title: MXQ SP06 Smart Plug with Night Light
date-published: 2019-12-12
type: plug
standard: us
board: esp8266
---

## Description

MXQ SP06 Smart Plug with Night Light is a small 10A 110-240V plug with built-in night light. It is based on Tuya
hardware, and the initial firmware can be flashed using the "tuya-convert" technique.

## GPIO Pinout

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO5  | Push Button (HIGH = off, LOW = on) |
| GPIO14 | Relay                              |
| GPIO4  | Blue LED (HIGH = off, LOW = on)    |
| GPIO13 | Red LED (HIGH = off, LOW = on)     |
| GPIO12 | Night light LEDs (PWM)             |

## Basic Configuration

```yaml
# Basic Config
substitutions:
  display_name: "Hallway"

esphome:
  name: mxq_night_light_01

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

captive_portal:
logger:
api:
ota:

# Device Specific Config
light:
  - platform: monochromatic
    id: night_light
    name: "${display_name} Night Light"
    output: pwm_output
  - platform: binary
    id: blue_led
    name: "${display_name} Blue LED"
    output: blue_led_output
    internal: True

output:
  - platform: esp8266_pwm
    id: pwm_output
    pin: GPIO12
    frequency: 1000 Hz
  - platform: esp8266_pwm
    id: blue_led_output
    pin:
      number: GPIO4
      inverted: True

binary_sensor:
  - platform: gpio
    id: button
    pin:
      number: GPIO5
      mode: INPUT_PULLUP
      inverted: True
    on_multi_click:
      # Single Press
      - timing:
          - ON for at most 1s
          - OFF for at least 0.5s
        then:
          - switch.toggle: fake_button
      # Long Press
      - timing:
          - ON for at least 2s
        then:
          - light.toggle: night_light
    internal: True

switch:
  - platform: gpio
    id: relay
    pin: GPIO14
  - platform: template
    id: fake_button
    name: "${display_name} Switch"
    optimistic: True
    turn_on_action:
      - switch.turn_on: relay
      - light.turn_on: blue_led
    turn_off_action:
      - switch.turn_off: relay
      - light.turn_off: blue_led

status_led:
  id: red_status_led
  pin:
    number: GPIO13
    inverted: True
```
