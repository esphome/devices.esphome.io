---
title: Treatlife esp01_1m 2/3-Way Wall-Switch
date-published: 2020-11-29
type: switch
standard: global
board: esp8266
---

## Notes

* push button wall switch
* 2 way bought here: [https://www.amazon.com/dp/B07WWYQJFR](https://www.amazon.com/dp/B07WWYQJFR)
* 3 way bought here: [https://www.amazon.com/dp/B07V3XB1QG](https://www.amazon.com/dp/B07V3XB1QG)
* this dude shows how to flash it: [https://www.digiblur.com/2020/01/tuya-convert-23-update-flash-tuya.html](https://www.digiblur.com/2020/01/tuya-convert-23-update-flash-tuya.html)
* unlike the 3 way switch, the 2 way switch does not have a power sense pin. To solve this issue, and allow the smart
  switch to be smart, this code turns the White LED on when the light is off and, led off when the light is on. This
  allows the LEDs pin state to be used as a power sense, to determine whether to turn the relay on or off.

## GPIO Pinout

### 2-Way Version

| Pin     | Function                              |
|---------|---------------------------------------|
| GPIO04  | White LED (Power Sensor)              |
| GPIO5   | Status LED                            |
| GPIO12  | Relay 1                               |
| GPIO13  | Button 1                              |

### 3-Way Version

| Pin     | Function                              |
|---------|---------------------------------------|
| GPIO04  | White LED                             |
| GPIO5   | Status LED                            |
| GPIO12  | Relay 1                               |
| GPIO13  | Button 1                              |
| GPIO14  | Power Sensor                          |

## Basic Configuration (2-Way)

```yaml
substitutions:
  device_name: light_switch #change
  friendly_name: Light Switch #change
  icon: "mdi:light-switch"

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m

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

output:
  - platform: gpio
    pin: GPIO12
    id: switch_output

  - platform: gpio
    pin:
      number: GPIO4
    id: white_led_output

light:
  - platform: binary
    name: ${friendly_name}
    id: ${device_name}
    output: switch_output
    on_turn_on:
      - light.turn_on: white_led
    on_turn_off:
      - light.turn_off: white_led

  - platform: binary
    id: white_led
    output: white_led_output

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
    id: ${device_name}_button
    name: ${friendly_name} Button
    on_press:
      - light.toggle: ${device_name}

status_led:
  # Red LED
  pin:
    number: GPIO5
    inverted: yes
```

## Basic Configuration (3-Way)

```yaml
substitutions:
  device_name: 3_way_light_switch #change
  friendly_name: 3 Way Light Switch #change
  icon: "mdi:light-switch"

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: true

  ap:
    ssid: ${device_name}
    password: !secret esphome_ap_password

captive_portal:
logger:
api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret esphome_ota_password
status_led:
  pin:
    number: GPIO5   # Red LED
    inverted: True
binary_sensor:
  - platform: gpio
    id: power_sensor
    pin:
      number: GPIO14
      inverted: True
    filters:
      - delayed_off: 50ms
    on_press:
      - light.turn_off: white_led
    on_release:
      - light.turn_on: white_led
    internal: True
  - platform: gpio
    pin:
      number: GPIO13
      inverted: True
    id: button
    on_press:
      then:
      - switch.toggle: ${device_name}
    internal: True
light:
  - platform: binary
    id: white_led
    output: led_1
    restore_mode: RESTORE_DEFAULT_ON
    internal: True
output:
  - platform: gpio
    id: led_1
    pin:
      number: GPIO4
      inverted: True
switch:
  - platform: gpio
    id: red_led
    pin:
      number: GPIO5
      inverted: True
    internal: True

  - platform: gpio
    pin: GPIO12
    id: relay
    restore_mode: RESTORE_DEFAULT_OFF
    internal: True

  - platform: template
    name: ${friendly_name}
    id: ${device_name}
    icon: ${icon}
    lambda: |-
      if (id(power_sensor).state) {
        return true;
      } else {
        return false;
      }
    turn_on_action:
    - if:
        condition:
          - binary_sensor.is_off: power_sensor
        then:
          - switch.toggle: relay
    turn_off_action:
    - if:
        condition:
          - binary_sensor.is_on: power_sensor
        then:
          - switch.toggle: relay
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
