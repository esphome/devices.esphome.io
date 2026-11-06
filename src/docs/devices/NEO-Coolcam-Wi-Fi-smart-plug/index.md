---
title: NEO Coolcam Wi-Fi smart plug
date-published: 2023-04-12
type: plug
standard: au
board: esp8266
---

NEO Coolcam Smart Plugs are a Tuya-based smart plugs
sold by Bunnings and Kmart respectively in Australia.

![image](./brilliant-mirabella-genio-smart-plugs.jpg)

## Basic Configuration

``` yaml
substitutions:
  name: coolcam_plug1
  friendly_name: Coolcam Smart Plug
  # Higher value gives lower watt readout
  current_res: "0.00221"
  # Lower value gives lower voltage readout
  voltage_div: "800"

esphome:
  name: ${name}

esp8266:
  board: esp8285

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:

api:

ota:

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      inverted: true
    name: "${friendly_name} Button"
    on_press:
      - switch.toggle: relay

switch:
  - platform: gpio
    name: "${friendly_name} LED Red"
    pin: GPIO13
    inverted: true
    restore_mode: ALWAYS_OFF
    id: red_led

  - platform: gpio
    name: "${friendly_name} Relay"
    pin: GPIO14
    restore_mode: ALWAYS_ON
    id: relay

    on_turn_on:
      - switch.turn_on: red_led

    on_turn_off:
      - switch.turn_off: red_led

sensor:
  - platform: hlw8012
    sel_pin:
      number: GPIO12
      inverted: true
    cf_pin: GPIO04
    cf1_pin: GPIO05
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}
    current:
      name: "${friendly_name} Amperage"
      unit_of_measurement: A
    voltage:
      name: "${friendly_name} Voltage"
      unit_of_measurement: V
    power:
      name: "${friendly_name} Power"
      unit_of_measurement: W
      id: power_sensor
    change_mode_every: 8
    update_interval: 10s

  - platform: total_daily_energy
    name: "${friendly_name} Total Daily Energy"
    power_id: power_sensor
    filters:
        # Multiplication factor from W to kW is 0.001
        - multiply: 0.001
    unit_of_measurement: kWh
```
