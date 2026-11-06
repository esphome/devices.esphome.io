---
title: Teckin SP23
date-published: 2023-11-11
type: plug
standard: uk
board: rtl87xx
difficulty: 4
---

Uses T112_v1 module. CPU is the Realtek W302 (RTL8710BN).

## GPIO Pinout

| Pin  | Function   |
| ---- | ---------- |
| PA12 | Relay      |
| PA14 | Button     |
| PA15 | Status LED |

## Basic Configuration

```yaml
esphome:
  name: teckin-sp23
  friendly_name: Teckin SP23

rtl87xx:
  board: generic-rtl8710bn-2mb-788k

# Enable logging
logger:

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret esp_ota_pass

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "SP23 AP"
    password: !secret ap_pass

captive_portal:

switch:
  - platform: gpio
    name: "None"
    pin: PA12
    id: relay
    device_class: "outlet"
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_on:
      - if:
          condition:
            switch.is_on: status_led_config
          then:
            - light.turn_on: blue_led
    on_turn_off:
      - light.turn_off: blue_led
  - platform: template
    name: "Status LED"
    id: status_led_config
    optimistic: true
    entity_category: "config"
    restore_mode: RESTORE_DEFAULT_OFF
    turn_on_action:
      - if:
          condition:
            switch.is_on: relay
          then:
            - light.turn_on: blue_led
    turn_off_action:
      - light.turn_off: blue_led

light:
  - platform: status_led
    id: blue_led
    pin:
      number: PA15
      inverted: true

binary_sensor:
  - platform: gpio
    pin:
      number: PA14
    id: button_1
    on_press:
      then:
        - switch.toggle: relay
```
