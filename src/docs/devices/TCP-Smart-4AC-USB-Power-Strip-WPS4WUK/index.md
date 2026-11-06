---
title: TCP Smart 4AC+USB Power Strip WPS4WUK
date-published: 2020-06-12
type: plug
standard: uk
board: esp8266
---

## Manufacturer

[Tcpsmart.eu](https://www.tcpsmart.eu/)

## Available from

[Screwfix.com](https://www.screwfix.com/p/tcp-wps4wuk-13a-4-gang-switched-smart-extension-lead-5-1a-4-outlet-usb-charger-white-1-8m/606hp)

## GPIO Pinout

| Pin    | Function                      |
| ------ | ----------------------------- |
| GPIO1  | LED (inverted)                |
| GPIO3  | Button                        |
| GPIO4  | Relay - Socket 3              |
| GPIO5  | Relay - Socket 4 (Right Most) |
| GPIO12 | Relay - Socket 2              |
| GPIO13 | Relay - Socket 1 (Left Most)  |
| GPIO14 | Relay - USB                   |

## Basic Configuration

```yaml
# TCP Smart 4AC+USB Power Strip WPS4WUK

# Substitutions
substitutions:
  # Device Names
  device_name: "plugstrip01"
  friendly_name: "plugstrip01"
  # Icon
  main_icon: "power-socket-uk"
  # Default Relay State
  # Aka: `restore_mode` in documentation
  # Options: `RESTORE_DEFAULT_OFF`, `RESTORE_DEFAULT_ON`, `ALWAYS_ON` & `ALWAYS_OFF`
  default_state: "RESTORE_DEFAULT_OFF"

# Basic Config
esphome:
  name: "${device_name}"

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${device_name} Fallback Hotspot"
    password: !secret hotspot_wifi_password

captive_portal:

logger:
api:
ota:

time:
  - platform: sntp
    id: sntp_time

# Device Specific Config
binary_sensor:
  # Push Button (Toggles All Relays When Pressed)
  - platform: gpio
    pin:
      number: GPIO3
      mode: INPUT_PULLUP
      inverted: true
    name: "${friendly_name} Button"
    on_press:
      if:
        condition:
          light.is_on: led
        then:
          - switch.turn_off: relay_socket_1
          - switch.turn_off: relay_socket_2
          - switch.turn_off: relay_socket_3
          - switch.turn_off: relay_socket_4
          - switch.turn_off: relay_usb
          - light.turn_off:
              id: led
              transition_length: 0s
        else:
          - switch.turn_on: relay_socket_1
          - switch.turn_on: relay_socket_2
          - switch.turn_on: relay_socket_3
          - switch.turn_on: relay_socket_4
          - switch.turn_on: relay_usb
          - light.turn_on:
              id: led
              brightness: 100%
              transition_length: 0s
  - platform: status
    name: "${friendly_name} Server Status"

switch:
  # Relay - Socket 1 (As Switch)
  - platform: gpio
    name: "${friendly_name} socket 1"
    icon: "mdi:${main_icon}"
    pin: GPIO13
    id: relay_socket_1
    restore_mode: "${default_state}"
    on_turn_on:
      - light.turn_on:
          id: led
          brightness: 100%
          transition_length: 0s
    on_turn_off:
      if:
        condition:
          and:
            - switch.is_off: relay_socket_1
            - switch.is_off: relay_socket_2
            - switch.is_off: relay_socket_3
            - switch.is_off: relay_socket_4
            - switch.is_off: relay_usb
        then:
          - light.turn_off:
              id: led
              transition_length: 0s

  # Relay - Socket 2 (As Switch)
  - platform: gpio
    name: "${friendly_name} socket 2"
    icon: "mdi:${main_icon}"
    pin: GPIO12
    id: relay_socket_2
    restore_mode: "${default_state}"
    on_turn_on:
      - light.turn_on:
          id: led
          brightness: 100%
          transition_length: 0s
    on_turn_off:
      if:
        condition:
          and:
            - switch.is_off: relay_socket_1
            - switch.is_off: relay_socket_2
            - switch.is_off: relay_socket_3
            - switch.is_off: relay_socket_4
            - switch.is_off: relay_usb
        then:
          - light.turn_off:
              id: led
              transition_length: 0s

  # Relay - Socket 3 (As Switch)
  - platform: gpio
    name: "${friendly_name} socket 3"
    icon: "mdi:${main_icon}"
    pin: GPIO4
    id: relay_socket_3
    restore_mode: "${default_state}"
    on_turn_on:
      - light.turn_on:
          id: led
          brightness: 100%
          transition_length: 0s
    on_turn_off:
      if:
        condition:
          and:
            - switch.is_off: relay_socket_1
            - switch.is_off: relay_socket_2
            - switch.is_off: relay_socket_3
            - switch.is_off: relay_socket_4
            - switch.is_off: relay_usb
        then:
          - light.turn_off:
              id: led
              transition_length: 0s

  # Relay - Socket 4 (As Switch)
  - platform: gpio
    name: "${friendly_name} socket 4"
    icon: "mdi:${main_icon}"
    pin: GPIO5
    id: relay_socket_4
    restore_mode: "${default_state}"
    on_turn_on:
      - light.turn_on:
          id: led
          brightness: 100%
          transition_length: 0s
    on_turn_off:
      if:
        condition:
          and:
            - switch.is_off: relay_socket_1
            - switch.is_off: relay_socket_2
            - switch.is_off: relay_socket_3
            - switch.is_off: relay_socket_4
            - switch.is_off: relay_usb
        then:
          - light.turn_off:
              id: led
              transition_length: 0s

  # Relay - USB (As Switch)
  - platform: gpio
    name: "${friendly_name} USB"
    icon: "mdi:${main_icon}"
    pin: GPIO14
    id: relay_usb
    restore_mode: "${default_state}"
    on_turn_on:
      - light.turn_on:
          id: led
          brightness: 100%
          transition_length: 0s
    on_turn_off:
      if:
        condition:
          and:
            - switch.is_off: relay_socket_1
            - switch.is_off: relay_socket_2
            - switch.is_off: relay_socket_3
            - switch.is_off: relay_socket_4
            - switch.is_off: relay_usb
        then:
          - light.turn_off:
              id: led
              transition_length: 0s

sensor:
  # WiFi Signal Sensor
  - platform: wifi_signal
    name: "${friendly_name} WiFi Status"
    update_interval: 60s

# Relay State LED
output:
  - platform: esp8266_pwm
    id: state_led
    pin:
      number: GPIO1
      inverted: true

light:
  - platform: monochromatic
    output: state_led
    id: led
```
