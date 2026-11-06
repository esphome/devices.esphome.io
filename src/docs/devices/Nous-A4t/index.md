---
title: Nous A4t
date-published: 2025-01-16
type: plug
standard: eu
board: esp8266
---

![Nous A4T](A4T_00.jpg "Tasmota Version Plug")

## GPIO Pinout

[see pinout](https://nous.technology/product/a4t.html?show=manual)

| Pin    | Function   |
| ------ | ---------- |
| GPIO00 | None       |
| GPIO01 | HLWBL SELi |
| GPIO02 | None       |
| GPIO03 | LedLink_i  |
| GPIO04 | HLWBL CF1  |
| GPIO05 | BL0937 CF  |
| GPIO09 | None       |
| GPIO10 | None       |
| GPIO12 | Relay 1    |
| GPIO13 | Relay 2    |
| GPIO14 | Button 1   |
| GPIO15 | None       |
| GPIO16 | None       |
| FLAG   | None       |

## Basic Configuration

```yaml
substitutions:
  devicename: nousa4tplug
  # See calculator at bottom of https://esphome.io/components/sensor/hlw8012/ to calibrate these values
  voltage_div: "1541"
  current_res: "0.0010829518310527565"
  current_multiply: "0.8476903844535357"

api:

ota:
  platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${devicename}-AP"

captive_portal:

esphome:
  name: ${devicename}

esp8266:
  board: esp8285
  restore_from_flash: true
  early_pin_init: false

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO14
      inverted: True
    name: input
    on_multi_click:
      - timing:
          - ON for at most 1s
          - OFF for at least 0.5s
        then:
          - switch.toggle: relay_1
      - timing:
          - ON for at most 1s
          - OFF for at most 0.5s
          - ON for at most 1s
          - OFF for at least 0.1s
        then:
          - switch.toggle: relay_2

light:
  - platform: status_led
    id: connection_status_led
    name: status_led
    internal: true
    pin:
      number: GPIO03
      inverted: true

switch:
  - platform: gpio
    pin: GPIO12
    restore_mode: RESTORE_DEFAULT_OFF
    id: relay_1
    name: switch_1
  - platform: gpio
    pin: GPIO13
    restore_mode: RESTORE_DEFAULT_OFF
    id: relay_2
    name: switch_2

sensor:
  - platform: hlw8012
    model: BL0937
    sel_pin:
      number: GPIO01
      inverted: True
    cf_pin: GPIO05
    cf1_pin: GPIO04
    change_mode_every: 4
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}
    update_interval: 3s

    current:
      name: current
      id: current
      #unit_of_measurement: "A"
      accuracy_decimals: 3
      device_class: current
      state_class: measurement
      filters:
        - multiply: ${current_multiply}
    voltage:
      name: voltage
      id: voltage
      #unit_of_measurement: "V"
      accuracy_decimals: 1
      device_class: voltage
      state_class: measurement
    power:
      name: power
      id: power
      #unit_of_measurement: "W"
      accuracy_decimals: 1
      device_class: power
      state_class: measurement
    energy:
      name: energy
      id: energy
      unit_of_measurement: Wh
      accuracy_decimals: 0
      device_class: energy
      state_class: total_increasing
```
