---
title: Teckin SS42
date-published: 2023-11-08
type: plug
standard: eu
board: esp8266
---

![image](teckin-ss42.webp)

## GPIO Pinout

| Pin    | Function    |
| ------ | ----------- |
| GPIO04 | Status LED1 |
| GPIO05 | Status LED2 |
| GPIO13 | Push Button |
| GPIO12 | Relay 1     |
| GPIO14 | Relay 2     |

## Basic Configuration

```yaml
# Basic Config
---
esphome:
  name: outdoor_ss42

esp8266:
  board: esp8285
    
# OTA flashing
ota:
  - platform: esphome

wifi: # Your Wifi network details
  
# Enable fallback hotspot in case wifi connection fails  
  ap:

# Enabling the logging component
logger:

# Enable Home Assistant API
api:

# Enable the captive portal
captive_portal:

sensor:

  - platform: uptime
    name: "Outdoor SS42 uptime"

switch:
  - platform: gpio
    name: "Relay 1"
    pin: GPIO12
    id: relay1
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_off:
      if:
        condition:
          - switch.is_on: led1
        then:
          - switch.turn_off: led1
    on_turn_on:
      if:
        condition:
          - switch.is_off: led1
        then:
          - switch.turn_on: led1
  - platform: gpio
    name: "Relay 2"
    pin: GPIO14
    id: relay2
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_off:
      if:
        condition:
          - switch.is_on: led2
        then:
          - switch.turn_off: led2
    on_turn_on:
      if:
        condition:
          - switch.is_off: led2
        then:
          - switch.turn_on: led2
  - platform: gpio
    id: led1
    pin:
      number: GPIO4
      inverted: True
  - platform: gpio
    id: led2
    pin:
      number: GPIO5
      inverted: True

binary_sensor:
  - platform: gpio
    name: "Teckin SS42 Button"
    pin:
      number: GPIO13
      mode: INPUT_PULLUP
      inverted: true
    internal: true
    on_press:
      # Prevents unintended LED lit states.
      if:
        condition:
          - switch.is_off: relay1
        then:
          - switch.turn_on: led1
          - switch.turn_on: relay1
        else:
          - switch.turn_off: relay1
    on_double_click:
      if:
        condition:
          - switch.is_off: relay2
        then:
          - switch.turn_on: led2
          - switch.turn_on: relay2
        else:
          - switch.turn_off: relay2
  - platform: status
    name: "Outdoor SS42 Status"
```
