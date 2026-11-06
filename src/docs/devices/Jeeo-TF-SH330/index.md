---
title: Jeeo TF-SH330
date-published: 2021-12-10
type: plug
standard: us
board: esp8266
---

## Product Images

![alt text](./TF-SH330.jpg "Profile picture of device")

Inspired by the Tasmota template: [https://templates.blakadder.com/jeeo_TF-SH330.html](https://templates.blakadder.com/jeeo_TF-SH330.html)

## GPIO Pinout

| Pin    | Function        |
| ------ | --------------- |
| GPIO0  | Blue Status LED |
| GPIO13 | Switch Input    |
| GPIO15 | Mains Relay     |

## Basic Configuration

```yaml
esphome:
  name: jeeoa

esp8266:
  board: esp01_1m

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:
  password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  ap:
    ssid: "Jeeo Fallback Hotspot"
    password: !secret fallback_wifi_password

captive_portal:

binary_sensor:
  - platform: gpio
    id: button
    internal: true
    pin:
      number: 13
      mode: INPUT
      inverted: true
    on_press:
      - then:
          - switch.toggle:
              id: socket_relay
    name: button

switch:
  - platform: gpio
    name: Socket
    id: socket_relay
    pin:
      number: 15
      mode: OUTPUT
      inverted: false
    on_turn_on:
      - then:
          - light.turn_on:
              id: status_led
              state: true
    on_turn_off:
      - then:
          - light.turn_off:
              id: status_led
              state: false
    restore_mode: RESTORE_DEFAULT_OFF
    interlock_wait_time: 0ms

output:
  - platform: gpio
    id: led
    pin:
      number: 0
      inverted: true
      mode: OUTPUT

light:
  - platform: binary
    name: Status LED
    id: status_led
    internal: true
    output: led
    restore_mode: RESTORE_DEFAULT_OFF
```
