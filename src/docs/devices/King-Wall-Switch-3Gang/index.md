---
title: King Smartlife 3-Way Wall Switch
date-published: 2024-04-07
type: switch
standard: global
board: bk72xx
---

## Notes

Silkscreen has King Smart Switch Tuya Panel V2021.10

This is a oem 'smartlife' branded switch. They come in 1-4 gang varieties. Moren than 4 gang is supplied on two modules
mounted side by side.
The 6 gang is actually 2x3 switches.
Purchased from AliExpress.

## Flashing

Use cloud-cutter. Pick 2 `By Firmware Vesion and Name` at the time of writing search by firmware/vesion and use
`1.1.0 - BK7231N / oem_bk7231n_dctrl_switch`

These are 'touch' buttons on this module. however i suspect there are a few different varieties.

## GPIO Pinout

### 3-Way Version

| Pin     | Function                              |
|---------|---------------------------------------|
| GPIO17  | Relay 1                               |
| GPIO6   | Button 1                              |
| GPIO26  | Relay 2                               |
| GPIO7   | Button 2                              |
| GPIO24  | Relay 3                               |
| GPIO8   | Button 3                              |
| GPIO28  | Status LED                            |

## Basic Configuration (3-Way)

```yaml
substitutions:
  device_name: light_switch #change
  friendly_name: Light Switch #change
  icon: "mdi:light-switch"

esphome:
  name: ${device_name}
  comment: ${friendly_name}

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: true
  ap:
    ssid: ${device_name}
    password: !secret esphome_ap_password

logger:

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret esphome_ota_password

switch:
  - platform: gpio
    name: $name Switch 1
    pin: GPIO17
    id: relay_1

  - platform: gpio
    name: $name Switch 2
    pin: GPIO26
    id: relay_2
  #    restore_mode: ALWAYS_ON

  - platform: gpio
    name: $name Switch 3
    pin: GPIO24
    id: relay_3

binary_sensor:
  - platform: status
    name: $device_name Status

  - platform: gpio
    pin:
      number: GPIO6
      mode: INPUT_PULLUP
      inverted: True
    name: $name Button 1
    on_press:
      - switch.toggle: relay_1

  - platform: gpio
    pin:
      number: GPIO7
      mode: INPUT_PULLUP
      inverted: True
    name: $name Button 2
    on_press:
      - switch.toggle: relay_2

  - platform: gpio
    pin:
      number: GPIO8
      mode: INPUT_PULLUP
      inverted: True
    name: $name Button 3
    on_press:
      - switch.toggle: relay_3

status_led:
  pin:
    number: GPIO28
    inverted: True

```

## Button manipulation (Adds Double Click and Long Press event triggers)

```yaml
  - platform: gpio
    pin:
      number: GPIO13
      inverted: True
    id: button
    name: ${friendly_name} Button
    on_multi_click:
   # Single Click:
    - timing:
      - ON for at most 1s
      - OFF for at least 0.3s
      then:
        - switch.toggle: ${device_name}
        - logger.log: "Single Click"
        - homeassistant.event:
            event: esphome.${device_name}
            data:
              title: single_click
   # Double Click:
    - timing:
      - ON for at most 1s
      - OFF for at most 1s
      - ON for at most 1s
      - OFF for at least 0.2s
      then:
        - logger.log: "Double Clicked"
        - homeassistant.event:
            event: esphome.${device_name}
            data:
              title: double_click
    # Long Press:
    - timing:
      - ON for 1s to 2s
      - OFF for at least 0.3s
      then:
        - logger.log: "Single Long Press"
        - homeassistant.event:
            event: esphome.${device_name}
            data:
              title: long_press
    - timing:
      - ON for at least 2.2s
      then:
        - logger.log: "Press and Hold"
        - homeassistant.event:
            event: esphome.${device_name}
            data:
              title: hold
    internal: True
```

## Home Assistant light entity (Converts it from a switch to a Light Entity)

```yaml
light:
  - platform: switch
    name: Light Switch
    entity_id: switch.light_switch
```

## Home Assistant example automation that uses the event triggers stated above

This assumes that you have defined all_lights using platform: group.

```yaml
automation:
- alias: long_press_on
  trigger:
  - platform: event
    event_data:
      title: long_press
    event_type: esphome.light_switch
  condition: []
  action:
  - service: light.turn_on
    target:
      entity_id: light.all_lights
  mode: single
  
- alias: double_click_off
  trigger:
  - platform: event
    event_data:
      title: double_click
    event_type: esphome.light_switch
  condition: []
  action:
  - service: light.turn_off
    target:
      entity_id: light.all_lights
  mode: single
```
