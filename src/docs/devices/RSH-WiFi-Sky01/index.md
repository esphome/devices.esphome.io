---
title: Tuya Galaxy / Laser Star Projector (RSH-WiFi-Sky01)
date-published: 2023-01-23
type: light
standard: global
board: esp8266
---

Manufacturer: [tuya](https://expo.tuya.com/smart/lighting/ambient-lighting/star-projector/CT9cn91vklm6mj-CT9cn98zo9cbv5-CTatr28ahrby2u)

![Product Image](./Sky01.jpg "Product Image")

- Original hardware mod: [3ATIVE VFX Studio](https://www.youtube.com/watch?v=YwHWbcuztuY&ab_channel=3ATIVEVFXStudio)
  - [Github](https://github.com/3ative/nebula-Light)
- Modified YAML by [kireque](https://github.com/kireque/esphome_nebula_light)
- [Custom firmware flash instructions and esphome config for Tuya SK20 nebula light (no disassembly / soldering required)](https://github.com/M4GNV5/esphome-SK20-Nebula-Light)

## Hardware

[replacing WB3S chip with ESP12](https://github.com/kireque/esphome_nebula_light#tuya-wb3s)

## GPIO Pinout

| Pin    | Function            |
| ------ | ------------------- |
| GPIO0  | LED outside case #1 |
| GPIO4  | Red Output          |
| GPIO5  | Laser Output        |
| GPIO12 | Green Output        |
| GPIO13 | Motor Output        |
| GPIO14 | Blue Output         |
| GPIO15 | LED outside case #2 |
| GPIO16 | Button              |

## Basic Configuration

```yaml
# Basic Config

substitutions:
  device_description: "RSH Tuya Smart Star Projector WiFi Laser Starry Projector Waving Led Colorful Home Atmosphere Light Wireless Control"
  friendly_name: "Galaxy"
  device_name: esp-galaxy
  node_name: esp_galaxy

esphome:
  name: $device_name
  comment: $device_description
  project:
    name: "tuya.galaxy"
    version: "RSH-WiFi-Sky01"

esp8266:
  board: esp12e
  restore_from_flash: true

globals:
  - id: dim
    type: bool
    restore_value: no
    initial_value: "false"

api:

ota:

web_server:

wifi:
  ap: {} # This spawns an AP with the device name and mac address with no password.

captive_portal:

logger:
  logs:
    light: none

light:
  - platform: rgb
    name: ${friendly_name} Light
    icon: mdi:star-shooting
    id: rgb_light
    red: red
    green: green
    blue: blue
    restore_mode: RESTORE_DEFAULT_OFF
    default_transition_length: 2s
    effects:
      - random:
          name: Random
          transition_length: 5s
          update_interval: 5s
      - random:
          name: Random Slow
          transition_length: 10s
          update_interval: 5s
    on_turn_on:
      then:
        - light.turn_on: btn_led
    on_turn_off:
      then:
        - light.turn_off: btn_led

  - platform: monochromatic
    name: ${friendly_name} Laser
    icon: mdi:laser-pointer
    id: laser
    output: laser_pwm
    restore_mode: ALWAYS_OFF
    default_transition_length: 3s

  - platform: status_led
    name: ${friendly_name} Status Led
    icon: mdi:led-outline
    entity_category: diagnostic
    id: ${node_name}_status_led
    pin: GPIO0
    internal: true

  - platform: monochromatic
    name: ${friendly_name} Button Led
    icon: mdi:led-outline
    entity_category: diagnostic
    id: btn_led
    output: btn_led_pwm
    restore_mode: ALWAYS_OFF

fan:
  platform: speed
  name: ${friendly_name} Motor
  icon: mdi:play-speed
  id: motor
  output: motor_pwm
  restore_mode: ALWAYS_OFF

output:
  - platform: esp8266_pwm
    id: red
    pin: GPIO4
    inverted: true

  - platform: esp8266_pwm
    id: green
    pin: GPIO12
    inverted: true

  - platform: esp8266_pwm
    id: blue
    pin: GPIO14
    inverted: true

  - platform: esp8266_pwm
    id: laser_pwm
    pin: GPIO5
    inverted: true

  - platform: esp8266_pwm
    id: motor_pwm
    pin: GPIO13
    min_power: 15%

  - platform: esp8266_pwm
    id: btn_led_pwm
    pin: GPIO15
    inverted: true

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO16
      mode: INPUT_PULLDOWN_16
      inverted: true
    name: ${friendly_name} Button
    id: ${node_name}_button
    on_multi_click:
      # single click
      - timing:
          - ON for at most 1s
          - OFF for at least 0.350s
        then:
          - light.toggle: rgb_light
      # double click
      - timing:
          - ON for at most 1s
          - OFF for at most 0.35s
          - ON for at most 1s
          - OFF for at least 0.35s
        then:
          - light.toggle: laser
    # hold
    on_press:
      then:
        - if:
            condition:
              lambda: |-
                return id(dim);
            then:
              - delay: 0.1s
              - while:
                  condition:
                    binary_sensor.is_on: ${node_name}_button
                  then:
                    - light.dim_relative:
                        id: rgb_light
                        relative_brightness: 5%
                    - delay: 0.1s
              - lambda: |-
                  id(dim) = (false);
            else:
              - delay: 0.1s
              - while:
                  condition:
                    binary_sensor.is_on: ${node_name}_button
                  then:
                    - light.dim_relative:
                        id: rgb_light
                        relative_brightness: 5%
                    - delay: 0.1s
              - lambda: |-
                  id(dim) = (true);
```
