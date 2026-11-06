---
title: AGL Switch 2, 3 gang variants
date-published: 2024-01-15
type: switch
standard: br
board: esp8266
difficulty: 3
---

The AGL Switch is available in Brazil.
[AGL](https://www.aglbrasil.com/smarthome)

## General Notes

This config was created based on the 2 gang switch that I had.

## Product Images

Front of 2 gang switch
![alt text](./agl_1106062.png "Front of 2 gang switch")

Back of 2 gang switch
![alt text](./back.jpg "Back of 2 gang switch")

## GPIO Pinout

### 2-Gang Version

PCB
![alt text](./open.jpg "PCB")

| Pin    | Function                        |
| ------ | ------------------------------- |
| GPIO2  | Status LED                      |
| GPIO16 | Button 1 (HIGH = off, LOW = on) |
| GPIO5  | Button 2 (HIGH = off, LOW = on) |
| GPIO13 | Relay 1                         |
| GPIO12 | Relay 2                         |

### 3-Gang Version

| Pin    | Function                        |
| ------ | ------------------------------- |
| GPIO2  | Status LED                      |
| GPIO16 | Button 1 (HIGH = off, LOW = on) |
| GPIO5  | Button 2 (HIGH = off, LOW = on) |
| GPIO4  | Button 3 (HIGH = off, LOW = on) |
| GPIO13 | Relay 1                         |
| GPIO12 | Relay 2                         |
| GPIO14 | Relay 3                         |

## Basic Configuration (2-Gang)

```yaml
esphome:
  name: agl-2-gang-switch
  friendly_name: AGL 2 Gang Switch

esp8266:
  board: esp01_1m

# Enable logging
logger:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

api:
  reboot_timeout: 15min
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret ota_password

sensor:
  - platform: uptime
    name: AGL 2 Gang Uptime
    update_interval: 60s

text_sensor:
  - platform: version
    name: AGL 2 Gang Version

binary_sensor:
  - platform: status
    name: AGL 2 Gang Status
  - platform: gpio
    pin:
      number: GPIO16
      inverted: True
    name: AGL 2 Gang Button 1
    on_press:
      - switch.toggle: relay_1
  - platform: gpio
    pin:
      number: GPIO5
      mode: INPUT_PULLUP
      inverted: True
    name: "AGL 2 Gang Button 2"
    on_press:
      - switch.toggle: relay_2

switch:
  - platform: restart
    name: AGL 2 Gang Restart
  - platform: gpio
    name: "AGL 2 Gang Switch 1"
    pin: GPIO13
    id: relay_1
  - platform: gpio
    name: "AGL 2 Gang Switch 2"
    pin: GPIO12
    id: relay_2

light:
  - platform: status_led
    id: blue_led
    restore_mode: ALWAYS_ON
    pin:
      number: GPIO2
      inverted: true
    internal: true
```
