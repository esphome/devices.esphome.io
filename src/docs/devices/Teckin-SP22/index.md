---
title: Teckin SP22
date-published: 2023-03-12
type: plug
standard: eu
board: esp8266
---

## GPIO Pinout

Based on information from [Tasmota](https://templates.blakadder.com/teckin_SP22.html).

| Pin    | Function          |
| ------ | ----------------- |
| GPIO01 | Button            |
| GPIO03 | Status LED - Red  |
| GPIO04 | cf_pin bl0937     |
| GPIO05 | cf1_pin bl0937    |
| GPIO12 | sel_pin bl0937    |
| GPIO13 | Status LED - Blue |
| GPIO14 | Relay             |

## Basic Configuration

The sample provided below is a minimal config which should get you up and running.

You will need to calibrate the power monitoring sensors in order to have accurate power monitoring.

```yaml
esphome:
  name: sp22
  friendly_name: Teckin SP22

esp8266:
  board: esp01_1m

# Enable logging
logger:

api:
  encryption:
    key: !secret api_encryption_key

web_server:
  port: 80

ota:
  password: !secret esp_ota_pass

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  ap:
    ssid: SP22_AP
    password: "Hotspot password here"

captive_portal:

switch:
  - id: relay
    platform: gpio
    name: "Relay"
    pin: GPIO14
    on_turn_on:
      - output.turn_on: relay_status
    on_turn_off:
      - output.turn_off: relay_status

binary_sensor:
  - platform: gpio
    id: button
    internal: true
    pin:
      number: GPIO01
    on_press:
      - switch.toggle: relay
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms

status_led:
  pin:
    number: GPIO13
    inverted: true

light:
  - platform: binary
    internal: true
    name: "Relay Status"
    output: relay_status

output:
  - id: relay_status
    platform: gpio
    pin:
      number: GPIO03
      inverted: true

sensor:
  - platform: hlw8012
    model: BL0937
    sel_pin:
      number: GPIO12
      inverted: true
    cf_pin: GPIO04
    cf1_pin: GPIO05
    current:
      name: "HLW8012 Current"
    voltage:
      name: "HLW8012 Voltage"
    power:
      name: "HLW8012 Power"
    energy:
      name: "HLW8012 Energy"
    update_interval: 10s
    change_mode_every: 3
```
