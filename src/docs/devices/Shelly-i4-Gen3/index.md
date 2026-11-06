---
title: Shelly i4 Gen3
date-published: 2024-06-22
type: switch
standard: uk, us, eu
board: esp32
difficulty: 4
---

Generation 3 of Shelly Plus i4.

![Shelly i4 Gen3](./Shelly_i4_Gen3.png "Shelly i4 Gen3")

## GPIO Pinout

| Pin    | Function       |
| ------ | -------------- |
| GPIO9  | LED (inverted) |
| GPI03  | NTC            |
| GPIO10 | Switch 1       |
| GPIO7  | Switch 2       |
| GPIO6  | Switch 3       |
| GPIO5  | Switch 4       |
| GPIO4  | Reset Button   |

## Programming Interface

same as for Shelly Plus i4

![Interface](./Plus-addon-interface.png "Interface")

## Basic Configuration

```yaml
esphome:
  name: "shelly-i4-gen3"
  friendly_name: "Shelly i4 Gen3"

esp32:
  variant: esp32c3
  flash_size: 8MB
  framework:
    type: esp-idf
    version: recommended
    sdkconfig_options:
      COMPILER_OPTIMIZATION_SIZE: y

wifi:
  ap:

logger:

api:

ota:

time:
  - platform: homeassistant

captive_portal:

sensor:
  - platform: ntc
    sensor: temp_resistance_reading
    name: "Temperature"
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    icon: "mdi:thermometer"
    device_class: temperature
    entity_category: diagnostic
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 298.15K
  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 10kOhm
  - platform: adc
    id: temp_analog_reading
    pin: GPIO3
    attenuation: 12db

binary_sensor:
  - platform: gpio
    name: "Switch 1"
    id: switch1
    pin: 10
    on_press:
      then:
        - logger.log: "Switch 1 pressed"
    on_release:
      then:
        - logger.log: "Switch 1 released"
    filters:
      - delayed_on_off: 50ms
  - platform: gpio
    name: "Switch 2"
    id: switch2
    pin: 7
    on_press:
      then:
        - logger.log: "Switch 2 pressed"
    on_release:
      then:
        - logger.log: "Switch 2 released"
    filters:
      - delayed_on_off: 50ms
  - platform: gpio
    name: "Switch 3"
    id: switch3
    pin: 6
    on_press:
      then:
        - logger.log: "Switch 3 pressed"
    on_release:
      then:
        - logger.log: "Switch 3 released"
    filters:
      - delayed_on_off: 50ms
  - platform: gpio
    name: "Switch 4"
    id: switch4
    pin: 5
    on_press:
      then:
        - logger.log: "Switch 4 pressed"
    on_release:
      then:
        - logger.log: "Switch 4 released"
    filters:
      - delayed_on_off: 50ms
  - platform: gpio
    name: "Reset Button"
    id: reset_button
    pin:
      number: 4
      inverted: yes
      mode:
        input: true
        pullup: true

status_led:
  pin:
    number: 9
    inverted: true
    ignore_strapping_warning: true
```
