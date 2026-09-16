---
title: Solimo Power Monitoring Plug 6A
date-published: 2025-07-01
type: plug
standard: in
board: rtl87xx
difficulty: 4
---

## GPIO Pinout

| Pin    | Function                   |
|--------|----------------------------|
| PA18   | Push Button                |
| PA23   | Blue LED (Inverted: true)  |
| PA00   | Relay                      |
| PA15   | HLWBL SEL Pin              |
| PA05   | HLW8012 CF Pin             |
| PA12   | HLWBL CF1 Pin              |

## Basic Config

```yaml
web_server:
  port: 80

substitutions:
  voltage_divider: "1584.943820224719"
  current_resistor: "0.0010826966292134831"
  current_multiply: "0.8990055843369442"

sensor:
  - platform: hlw8012
    model: BL0937
    sel_pin:
      number: PA15
      inverted: true
    cf_pin: PA05
    cf1_pin: PA12
    current_resistor: ${current_resistor}
    voltage_divider: ${voltage_divider}
    current:
      name: "Current"
      filters:
        - multiply: ${current_multiply}
    voltage:
      name: "Voltage"
    power:
      name: "Power"
    energy:
      name: "Energy"
    update_interval: 3s

switch:
  - platform: gpio
    pin: PA00
    name: "relay"
    id: relay
    on_turn_on:
      - switch.turn_on: blue_led
    on_turn_off:
      - switch.turn_off: blue_led

  - platform: gpio
    pin:
      number: PA23
      inverted: true
    id: blue_led

binary_sensor:
  - platform: gpio
    pin: PA18
    filters:
      - invert:
      - delayed_on: 100ms
      - delayed_off: 100ms
      - delayed_on_off: 100ms
    name: "Button"
    on_press:
      - switch.toggle: relay
