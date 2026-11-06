---
title: Generic Glass Touch Switch with 1, 2, 3 pole variants
date-published: 2019-12-30
type: switch
standard: us
board: esp8266
---

## General Notes

This config was created based on the 3 pole switch that I had. I'm not sure what the pins for the 4 pole variant would
be, but it would not be hard to figure it out if you have the unit.

There is another variant to these switches with LEDs on the buttons. These are called out below.

_I labeled the switch as Top/Middle/Bottom as the L1-L4 ports on the rear are actually inverted when installed (L4 on
top, L1 on bottom)._

## Product Images

Front of 3 pole switch
![alt text](./front.png "Front of 3 pole switch")

Rear of 3 pole switch
![alt text](./rear.jpg "Rear of 3 pole switch")

Wiring of switch
![alt text](./wiring.jpg "Wiring of switch")

## GPIO Pinout (Per top to bottom when installed)

| Pin    | Function                                  |
| ------ | ----------------------------------------- |
| GPIO3  | Button, Top                               |
| GPIO4  | Relay, Top _(Labeled L4)_                 |
| GPIO5  | Button, Middle                            |
| GPIO12 | Button, Bottom                            |
| GPIO13 | Relay, Bottom _(Labeled L2)_              |
| GPIO15 | Relay, Middle _(Labeled L3)_              |
| GPIO16 | Status LED                                |
| GPIO0  | Status LED _(alternative, some switches)_ |
| GPIO14 | LED, Top _(some switches)_                |
| GPIO1  | LED, Middle _(some switches)_             |
| GPIO14 | LED, Bottom _(some switches)_             |

## Basic Configuration

```yaml
substitutions:
  platform: ESP8266
  board: esp01_1m
  device_name: esphome_dining_room_switch
  friendly_name: "Dining Room Switch"
  reboot_timeout_wifi: 900s
  reboot_timeout_api: 1800s
  output_power: 17dB

#################################

esphome:
  platform: ${platform}
  board: ${board}
  name: ${device_name}
  esp8266_restore_from_flash: true

wifi:
  ssid: !secret wifi_iot_ssid
  password: !secret wifi_iot_pwd
  fast_connect: on
  reboot_timeout: ${reboot_timeout_wifi}
  output_power: ${output_power}
  ap:
    ssid: "AP_${friendly_name}"
    password: !secret wifi_backup_pwd

api:
  reboot_timeout: ${reboot_timeout_api}

ota:

web_server:
  port: 80

logger:

#################################

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO14
      inverted: True
    name: "${friendly_name} Top Button"
    id: button_top
    on_press:
      then:
        - if:
            condition:
              light.is_on: light_top
            then:
              - light.turn_off: light_top
            else:
              - light.turn_on: light_top
  - platform: gpio
    pin:
      number: GPIO5
      inverted: True
    name: "${friendly_name} Middle Button"
    id: button_middle
    on_press:
      then:
        - if:
            condition:
              light.is_on: light_middle
            then:
              - light.turn_off: light_middle
            else:
              - light.turn_on: light_middle
  - platform: gpio
    pin:
      number: GPIO12
      inverted: True
    name: "${friendly_name} Bottom Button"
    id: button_bottom
    on_press:
      then:
        - if:
            condition:
              light.is_on: light_bottom
            then:
              - light.turn_off: light_bottom
            else:
              - light.turn_on: light_bottom

output:
  - platform: gpio
    id: relay_top
    pin: GPIO4
  - platform: gpio
    id: relay_middle
    pin: GPIO15
  - platform: gpio
    id: relay_bottom
    pin: GPIO13
  - platform: esp8266_pwm
    id: status_led
    pin:
      number: GPIO16
      inverted: True

switch:
  - platform: restart
    name: "Front Door REBOOT"

light:
  - platform: binary
    output: relay_top
    id: light_top
    restore_mode: ALWAYS_OFF
    name: "${friendly_name} Top"
  - platform: binary
    output: relay_middle
    id: light_middle
    restore_mode: ALWAYS_OFF
    name: "${friendly_name} Middle"
  - platform: binary
    output: relay_bottom
    id: light_bottom
    restore_mode: ALWAYS_OFF
    name: "${friendly_name} Bottom"
    # icon: "mdi:ceiling-light"

  - platform: monochromatic
    name: "${friendly_name} Status LED"
    output: status_led
```

## Config for alternative variant

```yaml
substitutions:
  platform: ESP8266
  board: esp01_1m
  device_name: esphome_dining_room_switch
  friendly_name: "Living Room Switch"
  reboot_timeout_wifi: 900s
  reboot_timeout_api: 1800s
  output_power: 17dB

#################################

esphome:
  platform: ${platform}
  board: ${board}
  name: ${device_name}
  esp8266_restore_from_flash: true

wifi:
  ssid: !secret wifi_iot_ssid
  password: !secret wifi_iot_pwd
  fast_connect: on
  reboot_timeout: ${reboot_timeout_wifi}
  output_power: ${output_power}
  ap:
    ssid: "AP_${friendly_name}"
    password: !secret wifi_backup_pwd

api:
  reboot_timeout: ${reboot_timeout_api}

ota:

web_server:
  port: 80

logger:

#################################

status_led:
  pin:
    number: GPIO0
    inverted: true

binary_sensor:
  - platform: gpio
    pin: GPIO12
    name: "l1 switch"
    id: switch_1
    internal: true
    filters:
      - invert:
    on_press:
      - light.toggle:
          id: lightsw_1

  - platform: gpio
    pin: GPIO05
    name: "l2 switch"
    id: switch_2
    internal: true
    filters:
      - invert:
    on_press:
      - light.toggle:
          id: lightsw_2

  - platform: gpio
    pin: GPIO3
    name: "l3 switch"
    id: switch_3
    internal: true
    filters:
      - invert:
    on_press:
      - light.toggle:
          id: lightsw_3

output:
  - platform: gpio
    pin: GPIO13
    id: relay_1
  - platform: gpio
    pin: GPIO15
    id: relay_2
  - platform: gpio
    pin: GPIO04
    id: relay_3

  - platform: gpio
    pin: GPIO16
    id: led_1
    inverted: true
  - platform: gpio
    pin: GPIO01
    id: led_2
    inverted: true
  - platform: gpio
    pin: GPIO14
    id: led_3
    inverted: true

light:
  - platform: binary
    name: "${friendly_name} Top"
    id: lightsw_1
    output: relay_1
  - platform: binary
    name: "${friendly_name} Middle"
    id: lightsw_2
    output: relay_2
  - platform: binary
    name: "${friendly_name} Bottom"
    id: lightsw_3
    output: relay_3
```
