---
title: Hama WLAN Power Strip 00176574
date-published: 2022-12-05
type: plug
standard: eu
board: esp8266
---

## Product Images

![Product Image](index.png "Product Image")

## GPIO Pinout

| Function | GPIO-Pin |
| -------- | -------- |
| Plug 1   | 5        |
| Plug 2   | 12       |
| Plug 3   | 13       |
| Plug 4   | 4        |
| Plug USB | 14       |
| LED      | 1        |
| Button   | 3        |

## Basic Configuration

```yaml
# BASICS
esphome:
  name: powerstrip #hama-wlan-power-strip-00176574
esp8266:
  board: esp01_1m
  restore_from_flash: True
logger:
api:
ota:
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    password: !secret wifi_password
captive_portal:

switch:
  # RELAYS
  - platform: gpio
    pin: 5
    id: powerstrip_relay_1
  - platform: gpio
    pin: 12
    id: powerstrip_relay_3
  - platform: gpio
    pin: 13
    id: powerstrip_relay_4
  - platform: gpio
    pin: 4
    id: powerstrip_relay_2
  - platform: gpio
    pin: 14
    id: powerstrip_relay_5
  # LED (MAINSWITCH)
  - platform: gpio
    pin:
      number: 1
      inverted: true
    id: powerstrip_switch_main
    name: "POWERSTRIP: Switch Main"
    on_turn_on: # If all relays are off > Turn on relays with enabled switch
      if:
        condition:
          not:
            - switch.is_on: powerstrip_relay_1
            - switch.is_on: powerstrip_relay_2
            - switch.is_on: powerstrip_relay_3
            - switch.is_on: powerstrip_relay_4
            - switch.is_on: powerstrip_relay_5
        then:
          - if:
              condition:
                switch.is_on: powerstrip_switch_1
              then:
                switch.turn_on: powerstrip_relay_1
          - if:
              condition:
                switch.is_on: powerstrip_switch_2
              then:
                switch.turn_on: powerstrip_relay_2
          - if:
              condition:
                switch.is_on: powerstrip_switch_3
              then:
                switch.turn_on: powerstrip_relay_3
          - if:
              condition:
                switch.is_on: powerstrip_switch_4
              then:
                switch.turn_on: powerstrip_relay_4
          - if:
              condition:
                switch.is_on: powerstrip_switch_5
              then:
                switch.turn_on: powerstrip_relay_5
    on_turn_off: # Turn off all relays
      - switch.turn_off: powerstrip_relay_1
      - switch.turn_off: powerstrip_relay_2
      - switch.turn_off: powerstrip_relay_3
      - switch.turn_off: powerstrip_relay_4
      - switch.turn_off: powerstrip_relay_5

  # SWITCH 1
  - platform: template
    id: powerstrip_switch_1
    name: "POWERSTRIP: Switch 1"
    optimistic: True
    restore_mode: RESTORE_DEFAULT_OFF
    turn_on_action: # If mainswitch is on > turn on corresponding relay
      - if:
          condition:
            - switch.is_on: powerstrip_switch_main
          then:
            - switch.turn_on: powerstrip_relay_1
    turn_off_action: # If mainswitch is on > turn off corresponding relay
      - if:
          condition:
            - switch.is_on: powerstrip_switch_main
          then:
            - switch.turn_off: powerstrip_relay_1
  # SWITCH 2
  - platform: template
    id: powerstrip_switch_2
    name: "POWERSTRIP: Switch 2"
    optimistic: True
    restore_mode: RESTORE_DEFAULT_OFF
    turn_on_action:
      - if:
          condition:
            - switch.is_on: powerstrip_switch_main
          then:
            - switch.turn_on: powerstrip_relay_2
    turn_off_action:
      - if:
          condition:
            - switch.is_on: powerstrip_switch_main
          then:
            - switch.turn_off: powerstrip_relay_2
  # SWITCH 3
  - platform: template
    id: powerstrip_switch_3
    name: "POWERSTRIP: Switch 3"
    optimistic: True
    restore_mode: RESTORE_DEFAULT_OFF
    turn_on_action:
      - if:
          condition:
            - switch.is_on: powerstrip_switch_main
          then:
            - switch.turn_on: powerstrip_relay_3
    turn_off_action:
      - if:
          condition:
            - switch.is_on: powerstrip_switch_main
          then:
            - switch.turn_off: powerstrip_relay_3
  # SWITCH 4
  - platform: template
    id: powerstrip_switch_4
    name: "POWERSTRIP: Switch 4"
    optimistic: True
    restore_mode: RESTORE_DEFAULT_OFF
    turn_on_action:
      - if:
          condition:
            - switch.is_on: powerstrip_switch_main
          then:
            - switch.turn_on: powerstrip_relay_4
    turn_off_action:
      - if:
          condition:
            - switch.is_on: powerstrip_switch_main
          then:
            - switch.turn_off: powerstrip_relay_4
  # SWITCH 5
  - platform: template
    id: powerstrip_switch_5
    name: "POWERSTRIP: Switch 5"
    optimistic: True
    restore_mode: RESTORE_DEFAULT_OFF
    turn_on_action:
      - if:
          condition:
            - switch.is_on: powerstrip_switch_main
          then:
            - switch.turn_on: powerstrip_relay_5
    turn_off_action:
      - if:
          condition:
            - switch.is_on: powerstrip_switch_main
          then:
            - switch.turn_off: powerstrip_relay_5

binary_sensor:
  # BUTTON
  - platform: gpio
    pin:
      number: 3
      inverted: true
    id: powerstrip_button
    internal: true
    on_click:
      - max_length: 2000ms # Short press toggles mainswitch
        then:
          - switch.toggle: powerstrip_switch_main
      - min_length: 2001ms # Long press turns on all switches
        max_length: 20000ms
        then:
          - switch.turn_on: powerstrip_switch_main
          - switch.turn_on: powerstrip_switch_1
          - switch.turn_on: powerstrip_switch_2
          - switch.turn_on: powerstrip_switch_3
          - switch.turn_on: powerstrip_switch_4
          - switch.turn_on: powerstrip_switch_5
```
