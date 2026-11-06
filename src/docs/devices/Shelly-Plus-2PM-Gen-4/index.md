---
title: Shelly Plus 2PM Gen 4
date-published: 2025-09-21
type: relay
standard: uk, us, eu
board: esp32
---

## Shelly Plus 2PM Gen 4

## GPIO Pinout

| Pin    | Function       |
| ------ | -------------- |
| GPIO0  | LED (Inverted) |
| GPIO3  | Switch 2 input |
| GPIO4  | NTC            |
| GPIO5  | Switch 1 input |
| GPIO6  | SDA            |
| GPIO7  | SDL            |
| GPIO10 | Relay 2        |
| GPIO11 | Relay 1        |
| GPIO12 | Button         |
| GPIO33 | ade7953 IRQ    |

The Shelly Plus 2PM Gen 4 is based on the ESP32-C6 (Single core, 160MHz, 8MB embedded flash)

Please calibrate the NTC and the voltage / power measurements, the values below are just a rough estimate!

## basic config

```yaml
esphome:
  name: 0-shelly2pm-gen-4

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

output:
  - id: relay_1_output
    platform: gpio
    pin: GPIO5

  - id: relay_2_output
    platform: gpio
    pin: GPIO3

binary_sensor:
  - id: shelly_2pm_gen4_switch_1
    name: Switch 1
    platform: gpio
    pin: GPIO11
    filters:
      - delayed_off: 50ms

  - id: shelly_2pm_gen4_switch_2
    name: Switch 2
    platform: gpio
    pin: GPIO10
    filters:
      - delayed_off: 50ms

  - id: shelly_2pm_gen4_button
    name: Button 1
    platform: gpio
    pin: GPIO12
    filters:
      - delayed_off: 50ms

i2c:
  sda: 6
  scl: 7

sensor:
  - platform: ade7953_i2c
    irq_pin: GPIO19
    voltage:
      name: ADE7953 Voltage
    frequency:
      name: ADE7953 Frequency
    current_a:
      name: ADE7953 Current A
    current_b:
      name: ADE7953 Current B
    power_factor_a:
      name: "ADE7953 Power Factor A"
    power_factor_b:
      name: "ADE7953 Power Factor B"
    apparent_power_a:
      name: "ADE7953 Apparent Power A"
    apparent_power_b:
      name: "ADE7953 Apparent Power B"
    active_power_a:
      name: ADE7953 Active Power A
    active_power_b:
      name: ADE7953 Active Power B
    reactive_power_a:
      name: "ADE7953 Reactive Power A"
    reactive_power_b:
      name: "ADE7953 Reactive Power B"

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
    pin: GPIO4
    attenuation: 11db

status_led:
  pin:
    number: GPIO0
    inverted: true
```

## Configuration with protections

Configuration as relay with overpower and overtemperature protection

```yaml
esphome:
  name: 0-shelly2pm-gen-4

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

output:
  - id: relay_1_output
    platform: gpio
    pin: GPIO5

  - id: relay_2_output
    platform: gpio
    pin: GPIO3

switch:
  # Use a template switch to allow for checking fault conditions before switching on the relay output.
  - platform: template
    id: relay_1
    name: Relay 1
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
          - output.turn_on: relay_1_output
          - binary_sensor.template.publish:
              id: error_overtemp
              state: OFF
          - binary_sensor.template.publish:
              id: error_overpower_1
              state: OFF
          - switch.template.publish:
              id: relay_1
              state: ON
        else:
          - switch.template.publish:
              id: relay_1
              state: OFF
    turn_off_action:
      then:
        - output.turn_off: relay_1_output
        - switch.template.publish:
            id: relay_1
            state: OFF

  # Use a template switch to allow for checking fault conditions before switching on the relay output.
  - platform: template
    id: relay_2
    name: Relay 2
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
          - output.turn_on: relay_2_output
          - binary_sensor.template.publish:
              id: error_overtemp
              state: OFF
          - binary_sensor.template.publish:
              id: error_overpower_2
              state: OFF
          - switch.template.publish:
              id: relay_2
              state: ON
        else:
          - switch.template.publish:
              id: relay_2
              state: OFF
    turn_off_action:
      then:
        - output.turn_off: relay_2_output
        - switch.template.publish:
            id: relay_2
            state: OFF

binary_sensor:
  - id: shelly_2pm_gen4_switch_1
    name: Switch 1
    platform: gpio
    pin: GPIO11
    filters:
      - delayed_off: 50ms

  - id: shelly_2pm_gen4_switch_2
    name: Switch 2
    platform: gpio
    pin: GPIO10
    filters:
      - delayed_off: 50ms

  - id: shelly_2pm_gen4_button
    name: Button 1
    platform: gpio
    pin: GPIO12
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
        - switch.turn_off: relay_1
        - switch.turn_off: relay_2

  - id: error_overpower_1
    name: Overpowering output 1
    device_class: problem
    entity_category: diagnostic
    platform: template
    condition:
      any:
        - binary_sensor.is_on: error_overpower_1 # Latch ON
        - for:
            time: 1s
            condition:
              sensor.in_range:
                id: sensor_current_1
                above: 10 # This is model specific!
    on_press:
      then:
        - switch.turn_off: relay_1

  - id: error_overpower_2
    name: Overpowering output 2
    device_class: problem
    entity_category: diagnostic
    platform: template
    condition:
      any:
        - binary_sensor.is_on: error_overpower_2 # Latch ON
        - for:
            time: 1s
            condition:
              sensor.in_range:
                id: sensor_current_2
                above: 10 # This is model specific!
    on_press:
      then:
        - switch.turn_off: relay_2

i2c:
  sda: 6
  scl: 7

sensor:
  - platform: ade7953_i2c
    irq_pin: GPIO19
    voltage:
      name: ADE7953 Voltage
    frequency:
      name: ADE7953 Frequency
    current_a:
      name: ADE7953 Current A
      id: sensor_current_1
    current_b:
      name: ADE7953 Current B
      id: sensor_current_2
    power_factor_a:
      name: "ADE7953 Power Factor A"
    power_factor_b:
      name: "ADE7953 Power Factor B"
    apparent_power_a:
      name: "ADE7953 Apparent Power A"
    apparent_power_b:
      name: "ADE7953 Apparent Power B"
    active_power_a:
      name: ADE7953 Active Power A
    active_power_b:
      name: ADE7953 Active Power B
    reactive_power_a:
      name: "ADE7953 Reactive Power A"
    reactive_power_b:
      name: "ADE7953 Reactive Power B"

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
    pin: GPIO4
    attenuation: 11db

status_led:
  pin:
    number: GPIO0
    inverted: true
```
