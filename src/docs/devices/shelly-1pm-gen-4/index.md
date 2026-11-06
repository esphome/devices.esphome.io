---
title: Shelly 1PM Gen 4
date-published: 2025-09-21
type: relay
standard: uk, us, eu
board: esp32
---

## Shelly 1PM Gen 4

## GPIO Pinout

| Pin    | Function                 |
| ------ | ------------------------ |
| GPIO0  | LED (Inverted)           |
| GPIO1  | Button                   |
| GPIO3  | NTC                      |
| GPIO4  | Relay                    |
| GPIO6  | UART Tx                  |
| GPIO7  | UART Rx                  |
| GPIO10 | Switch                   |
| GPIO12 | Add-on module Digital in |
| GPIO16 | Add-on module Data in    |
| GPIO9  | Add-on module Data out   |
| GPIO17 | Add-on module Analog in  |

The Shelly 1PM Gen 4 is based on the ESP32-C6 (Single core, 160MHz, 8MB embedded flash)

Please calibrate the NTC and the voltage / power measurements, the values below are just a rough estimate!

## Basic config

```yaml
esphome:
  name: shelly1pm-gen-4

esp32:
  variant: esp32c6
  flash_size: 8MB
  framework:
    type: esp-idf

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:
  - platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

captive_portal:

web_server:

uart:
  id: bl0942_uart
  tx_pin: GPIO6
  rx_pin:
    number: GPIO7
    mode:
      pullup: true
      input: true
  baud_rate: 9600
  stop_bits: 1

output:
  - id: relay_output
    platform: gpio
    pin: GPIO4

sensor:
  - id: temperature
    name: Temperature
    platform: ntc
    sensor: temperature_sensor_resistance
    icon: mdi:thermometer
    entity_category: diagnostic
    unit_of_measurement: °C
    accuracy_decimals: 1
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 25°C
  - id: temperature_sensor_resistance
    platform: resistance
    sensor: temperature_sensor_voltage
    configuration: DOWNSTREAM
    resistor: 10kOhm
  - id: temperature_sensor_voltage
    platform: adc
    pin: GPIO3
    attenuation: 11db

  - platform: bl0942
    uart_id: bl0942_uart
    update_interval: 1s
    line_frequency: 60Hz
    voltage:
      name: Voltage
      id: sensor_voltage
      entity_category: diagnostic
    current:
      id: sensor_current
      name: current
    power:
      name: Power
      id: sensor_power
    frequency:
      name: Frequency
      id: sensor_frequency
      accuracy_decimals: 2
      entity_category: diagnostic
    energy:
      name: Energy
      id: sensor_energy
      entity_category: diagnostic
      device_class: energy
      state_class: total_increasing
      accuracy_decimals: 3

binary_sensor:
  - id: shelly_add_on_digital_in
    name: addon digital in
    platform: gpio
    pin: GPIO12
    filters:
      - delayed_off: 50ms

  - id: shelly_add_on_data
    name: addon data
    platform: gpio
    pin: GPIO16
    filters:
      - delayed_off: 50ms

  - id: shelly_add_on_analog_in
    name: addon analog in
    platform: gpio
    pin: GPIO17
    filters:
      - delayed_off: 50ms

  - id: shelly_1pm_gen4_switch
    name: Switch
    platform: gpio
    pin: GPIO10
    filters:
      - delayed_off: 50ms

  - id: shelly_1pm_gen4_button
    name: Button
    platform: gpio
    pin: GPIO1
    filters:
      - delayed_off: 50ms

status_led:
  pin:
    number: GPIO0
    inverted: true
```

## Configuration with protections

Configuration as relay with overpower and overtemperature protection

```yaml
esphome:
  name: shelly-1pm-gen-4

esp32:
  variant: esp32c6
  flash_size: 8MB
  framework:
    type: esp-idf

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:
  - platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

captive_portal:

web_server:

uart:
  id: bl0942_uart
  tx_pin: GPIO6
  rx_pin:
    number: GPIO7
    mode:
      pullup: true
      input: true
  baud_rate: 9600
  stop_bits: 1

output:
  - id: relay_output
    platform: gpio
    pin: GPIO4

switch:
  # Use a template switch to allow for checking fault conditions before switching on the relay output.
  - platform: template
    id: relay
    name: Relay
    device_class: outlet
    restore_mode: ALWAYS_ON
    turn_on_action:
      if:
        any:
          - sensor.in_range:
              id: temperature
              below: 75.0
          # Temperature sensor is unknown for several seconds on boot. Allow the relay to switch on anyway.
          - and:
              - lambda: "return isnan(id(temperature).state);"
              - binary_sensor.is_off: error_overtemp
        then:
          - output.turn_on: relay_output
          - binary_sensor.template.publish:
              id: error_overtemp
              state: OFF
          - binary_sensor.template.publish:
              id: error_overpower
              state: OFF
          - switch.template.publish:
              id: relay
              state: ON
        else:
          - switch.template.publish:
              id: relay
              state: OFF
    turn_off_action:
      then:
        - output.turn_off: relay_output
        - switch.template.publish:
            id: relay
            state: OFF

sensor:
  - id: temperature
    name: Temperature
    platform: ntc
    sensor: temperature_sensor_resistance
    icon: mdi:thermometer
    entity_category: diagnostic
    unit_of_measurement: °C
    accuracy_decimals: 1
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 25°C
  - id: temperature_sensor_resistance
    platform: resistance
    sensor: temperature_sensor_voltage
    configuration: DOWNSTREAM
    resistor: 10kOhm
  - id: temperature_sensor_voltage
    platform: adc
    pin: GPIO3
    attenuation: 11db

  - platform: bl0942
    uart_id: bl0942_uart
    update_interval: 1s
    line_frequency: 60Hz
    voltage:
      name: Voltage
      id: sensor_voltage
      entity_category: diagnostic
    current:
      id: sensor_current
      name: current
    power:
      name: Power
      id: sensor_power
    frequency:
      name: Frequency
      id: sensor_frequency
      accuracy_decimals: 2
      entity_category: diagnostic
    energy:
      name: Energy
      id: sensor_energy
      entity_category: diagnostic
      device_class: energy
      state_class: total_increasing
      accuracy_decimals: 3

binary_sensor:
  - id: shelly_add_on_digital_in
    name: addon digital in
    platform: gpio
    pin: GPIO12
    filters:
      - delayed_off: 50ms

  - id: shelly_add_on_data
    name: addon data
    platform: gpio
    pin: GPIO16
    filters:
      - delayed_off: 50ms

  - id: shelly_add_on_analog_in
    name: addon analog in
    platform: gpio
    pin: GPIO17
    filters:
      - delayed_off: 50ms

  - id: shelly_1pm_gen4_switch
    name: Switch
    platform: gpio
    pin: GPIO10
    filters:
      - delayed_off: 50ms

  - id: shelly_1pm_gen4_button
    name: Button
    platform: gpio
    pin: GPIO1
    filters:
      - delayed_off: 50ms

  - id: error_overtemp
    name: Overheating
    device_class: problem
    entity_category: diagnostic
    platform: template
    condition:
      any:
        - binary_sensor.is_on: error_overtemp # Latch ON
        - sensor.in_range:
            id: temperature
            above: 75.0
    on_press:
      then:
        - switch.turn_off: relay

  - id: error_overpower
    name: Overpowering
    device_class: problem
    entity_category: diagnostic
    platform: template
    condition:
      any:
        - binary_sensor.is_on: error_overpower # Latch ON
        - for:
            time: 1s
            condition:
              sensor.in_range:
                id: sensor_current
                above: 16 # This is model specific!
    on_press:
      then:
        - switch.turn_off: relay

status_led:
  pin:
    number: GPIO0
    inverted: true
```
