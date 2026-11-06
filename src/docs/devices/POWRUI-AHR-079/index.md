---
title: POWRUI AHR-079
date-published: 2020-09-29
type: plug
standard: us
board: esp8266
---

## GPIO Pinout

| Pin    | Function                              |
| ------ | ------------------------------------- |
| GPIO03 | Button 1 (Leftmost, closest to cable) |
| GPIO04 | Button 3                              |
| GPIO05 | Relay 1 (Leftmost, closest to cable)  |
| GPIO12 | Relay 3                               |
| GPIO13 | Button 4 (Rightmost, closest to USB)  |
| GPIO14 | Relay 2                               |
| GPIO15 | Relay 4 (Rightmost, closest to USB)   |
| GPIO16 | Button 2                              |

Pinout from [Powrui AHR-079 Power Strip Template for Tasmota](https://templates.blakadder.com/powrui_AHR-079.html)

## Basic Configuration

```yaml
substitutions:
  devicename: ahr_079
  friendlyname: POWRUI AHR-079

esphome:
  name: $devicename

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret iot_wifi_ssid
  password: !secret iot_wifi_password
  fast_connect: true

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${devicename} Fallback"
    password: !secret fallback_wifi_password

captive_portal:

# Enable logging
logger:
  baud_rate: 0

# Enable Home Assistant API
api:

ota:
  password: !secret ota_pw

# Buttons (not exposed in HA)
binary_sensor:
  - platform: gpio
    name: "${friendlyname} Button 1"
    id: button1
    internal: true
    pin:
      number: GPIO3
    on_press:
      then:
        - switch.toggle:
            id: relay1

  - platform: gpio
    name: "${friendlyname} Button 2"
    id: button2
    internal: true
    pin:
      number: GPIO16
    on_press:
      then:
        - switch.toggle:
            id: relay2

  - platform: gpio
    name: "${friendlyname} Button 3"
    id: button3
    internal: true
    pin:
      number: GPIO4
    on_press:
      then:
        - switch.toggle:
            id: relay3

  - platform: gpio
    name: "${friendlyname} Button 4"
    id: button4
    internal: true
    pin:
      number: GPIO13
    on_press:
      then:
        - switch.toggle:
            id: relay4

# Relays/Outlets
switch:
  - platform: gpio
    name: "${friendlyname} Outlet 1"
    icon: mdi:power-socket-us
    id: relay1
    pin:
      number: GPIO5
    restore_mode: RESTORE_DEFAULT_ON

  - platform: gpio
    name: "${friendlyname} Outlet 2"
    icon: mdi:power-socket-us
    id: relay2
    pin:
      number: GPIO14
    restore_mode: RESTORE_DEFAULT_ON

  - platform: gpio
    name: "${friendlyname} Outlet 3"
    icon: mdi:power-socket-us
    id: relay3
    pin:
      number: GPIO12
    restore_mode: RESTORE_DEFAULT_ON

  - platform: gpio
    name: "${friendlyname} Outlet 4"
    icon: mdi:power-socket-us
    id: relay4
    pin:
      number: GPIO15
    restore_mode: RESTORE_DEFAULT_ON
```
