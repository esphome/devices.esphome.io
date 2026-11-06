---
title: Tuya Smart Socket USB
date-published: 2024-07-11
type: plug
standard: global
board: bk72xx
---

## General Notes

A smart WIFI GPO relay with UBS B & C ports.

The USB ports are not switched and are always powered.

These devices are sold under many brands on Aliexpress.

Contains CB2S BK7231n module.

![PXL_20250113_171351012~2](https://github.com/user-attachments/assets/c5659178-4992-4de6-a82c-7eb932f1feab)


## GPIO Pinout

| Pin | Function            |
| --- | ------------------- |
| P6  | Red Status LED (H)  |
| P8  | Button INPUT_PULLUP |
| P24 | Relay (H)           |

## Configuration

```yaml
## -----------------------##
## Substitution Variables ##
## -----------------------##
substitutions:
  device_friendly_name: WIFI Switch
  device_icon: "mdi:power"
## --------------------##
## Board Configuration ##
## --------------------##
esphome:
  name: ${device_internal_name}
  friendly_name: ${device_friendly_name}

bk72xx:
  board: generic-bk7231n-qfn32-tuya
## ---------------- ##
##    Status LED    ##
## ---------------- ##
status_led:
  pin:
    number: P6
    inverted: true
## ---------------- ##
##  Binary Sensors  ##
## ---------------- ##
# Button 1
  - platform: gpio
    name: "${device_friendly_name} Switch"
    pin:
      number: P8
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - switch.toggle: relay
    filters:
      - delayed_on_off: 50ms
## ---------------- ##
##      Switch      ##
## ---------------- ##
switch:
#Relay
  - platform: gpio
    pin: P24
    name: ${device_friendly_name}
    id: relay
    restore_mode: always off   # default when power is turned on
    icon: mdi:power-socket-au
```
