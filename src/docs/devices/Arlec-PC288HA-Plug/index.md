---
title: Arlec PC288HA Twin Plug
date-published: 2020-01-04
type: plug
standard: au
board: esp8266
---

## GPIO Pinout

| Pin    | Function                  |
| ------ | ------------------------- |
| GPIO1  | Button (Inverted: true)   |
| GPIO03 | Relay 2                   |
| GPIO13 | Blue LED (Inverted: true) |
| GPIO14 | Relay 1                   |

## Basic Configuration

```yaml
# Basic Config
substitutions:
  device_name: "arlec_PC288HA_1"
  name: "ARLEC PC288HA 1"

esphome:
  name: ${device_name}
  comment: ${name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

logger:

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: "ota_password"

sensor:
  - platform: uptime
    name: ${name} Uptime

  - platform: wifi_signal
    name: ${name} Signal
    update_interval: 300s

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO1
      inverted: True
    name: ${name} button
    on_multi_click:
      # Support a single or double click to switch on each relay
      - timing:
          - ON for at most 1s
          - OFF for at least 0.5s
        then:
          - switch.toggle: relay_a

      - timing:
          - ON for at most 1s
          - OFF for at most 1s
          - ON for at most 1s
          - OFF for at least 0.2s
        then:
          - switch.toggle: relay_b

switch:
  - platform: gpio
    pin: GPIO14
    name: "${name} - A"
    id: relay_a
    restore_mode: always off
    icon: mdi:power-socket-au
    on_turn_on:
      - light.dim_relative:
          id: led
          relative_brightness: 50%
    on_turn_off:
      - light.dim_relative:
          id: led
          relative_brightness: -50%

  - platform: gpio
    pin: GPIO03
    name: "${name} - B"
    id: relay_b
    restore_mode: always off
    icon: mdi:power-socket-au
    on_turn_on:
      - light.dim_relative:
          id: led
          relative_brightness: 50%
    on_turn_off:
      - light.dim_relative:
          id: led
          relative_brightness: -50%

# Use PWM controlled LED to indicate state
light:
  - platform: monochromatic
    name: "${name} - LED"
    id: led
    internal: True
    output: gpio13
    restore_mode: always off

output:
  - platform: esp8266_pwm
    id: gpio13
    pin:
      number: GPIO13
      inverted: True
```
