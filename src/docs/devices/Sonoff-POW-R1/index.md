---
title: Sonoff POWR1
date-published: 2019-11-11
type: relay
standard: global
board: esp8266
difficulty: 3
---

## Product Images

![A picture of the PCB inside of the SONOFF POWR1](./inside.jpg "inside")

## GPIO Pinout

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO0  | Push Button (HIGH = off, LOW = on) |
| GPIO12 | Relay and its status LED           |
| GPIO5  | sel_pin on HLW8012                 |
| GPIO13 | cfl_pin on HLW8012                 |
| GPIO14 | cf_pin on HLW8012                  |
| GPIO15 | Blue LED (HIGH = off, LOW = on)    |
| GPIO1  | RX pin (for serial programming)    |
| GPIO3  | TX pin (for serial programming)    |

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: "SonOff POW r1"

esp8266:
  board: esp01_1m
  board_flash_mode: dout

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    name: SonOff POW Button
    on_press:
      - switch.toggle: fakebutton
  - platform: template
    name: SonOff POW Running
    filters:
      - delayed_off: 15s
    lambda: |-
      if (isnan(id(power).state)) {
        return {};
      } else if (id(power).state > 4) {
        // Running
        return true;
      } else {
        // Not running
        return false;
      }

sensor:
  - platform: hlw8012
    sel_pin: 5
    cf_pin: 14
    cf1_pin: 13
    update_interval: 2s
    current:
      name: SonOff POW Current
    voltage:
      name: SonOff POW Voltage
    power:
      name: SonOff POW Power
      id: power
      on_value_range:
        - above: 4.0
          then:
            - light.turn_on: led
        - below: 3.0
          then:
            - light.turn_off: led

switch:
  - platform: template
    name: SonOff POW Relay
    optimistic: true
    id: fakebutton
    turn_on_action:
      - switch.turn_on: relay
      - light.turn_on: led
    turn_off_action:
      - switch.turn_off: relay
      - light.turn_off: led
  - platform: gpio
    id: relay
    pin: GPIO12

output:
  - platform: esp8266_pwm
    id: pow_blue_led
    pin:
      number: GPIO15
      inverted: True

light:
  - platform: monochromatic
    name: SonOff POW Blue LED
    output: pow_blue_led
    id: led
```
