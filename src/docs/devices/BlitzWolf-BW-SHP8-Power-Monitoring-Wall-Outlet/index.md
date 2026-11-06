---
title: BlitzWolf BW-SHP8 Power Monitoring Wall Outlet
date-published: 2021-08-07
type: plug
standard: eu
board: esp8266
---
  ![alt text](./BlitzWolf-BW-SHP8-Power-Monitoring-Wall-Outlet.jpg "Product Image")

Model reference: BW-SHP8

Manufacturer: [BlitzWolf](https://www.blitzwolf.com/BlitzWolf-BW-SHP8-3680W-EU-Wifi-Smart-In-wall-Socket-with-Remote-Control-p-354.html)

## GPIO Pinout

| Pin    | Function                             |
|--------|--------------------------------------|
| GPIO03 | Push Button (inverted, input_pullup) |
| GPIO13 | Blue LED (inverted)                  |
| GPIO01 | Red LED (inverted)                   |
| GPIO14 | Relay                                |
| GPIO12 | HLWBL SEL Pin                        |
| GPIO04 | HLW8012 CF Pin                       |
| GPIO05 | HLWBL CF1 Pin                        |

## Config

### Parcial Config

```yaml
substitutions:
  hostname: "BW-SHP8"
  # Higher value gives lower watt readout
  current_resistor: "0.001"
  # Lower value gives lower voltage readout
  voltage_divider: "1727"
  
  restore_mode: "ALWAYS_ON"

esphome:

esp8266:
  board: esp8285

binary_sensor:
  - platform: gpio
    id: button
    pin:
      number: GPIO03
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - switch.toggle: relay

switch:
  - platform: gpio
    name: "$hostname power"
    id: relay
    pin: GPIO14
    restore_mode: $restore_mode
    icon: "mdi:power-socket-de"
    on_turn_on:
      - light.turn_on: led
    on_turn_off:
      - light.turn_off: led

output:
  - platform: esp8266_pwm
    id: state_led
    pin:
      number: GPIO01
      inverted: true

light:
  - platform: monochromatic
    output: state_led
    id: led

sensor:
  - platform: hlw8012
    model: BL0937
    current_resistor: $current_resistor
    voltage_divider: $voltage_divider
    change_mode_every: 2
    update_interval: 2s
    sel_pin:
      number: GPIO12
      inverted: True
    cf_pin: GPIO04
    cf1_pin: GPIO05
    current:
      name: "$hostname current"
      unit_of_measurement: A
      id: current
      accuracy_decimals: 3
    voltage:
      name: "$hostname voltage"
      unit_of_measurement: V
      id: voltage
      accuracy_decimals: 3
    power:
      name: "$hostname power"
      unit_of_measurement: W
      id: power
      accuracy_decimals: 3
  - platform: template
    name: "$hostname apparent power"
    id: apparent
    unit_of_measurement: VA
    accuracy_decimals: 3
    lambda: |-
      return id(voltage).state * id(current).state;
  - platform: template
    name: "$hostname reactive power"
    id: reactive_power
    unit_of_measurement: VAr
    accuracy_decimals: 3
    lambda: |-
      if ( id(apparent).state > id(power).state ) {
        return sqrt( id(apparent).state * id(apparent).state - id(power).state * id(power).state );
      } else {
        return 0;
      }
  - platform: template
    name: "$hostname power factor"
    accuracy_decimals: 1
    lambda: |-
      if ( id(power).state > id(apparent).state ) {
        return 1;
      } else if ( id(apparent).state == 0 ){
        return 0;
      } else {
        return id(power).state / (id(apparent).state);
      }

status_led:
  pin:
    number: GPIO13
    inverted: true

```
