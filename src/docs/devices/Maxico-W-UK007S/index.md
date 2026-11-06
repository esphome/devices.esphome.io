---
title: Maxico W-UK007S
date-published: 2019-10-21
type: plug
standard: uk
board: esp8266
---

## GPIO Pinout

| Pin    | Function       |
| ------ | -------------- |
| GPIO0  | LED (inverted) |
| GPIO5  | CF Pin         |
| GPIO12 | SEL (inverted) |
| GPIO13 | Button         |
| GPIO14 | CF1 Pin        |
| GPIO14 | Relay          |

## Basic Configuration

```yaml
# Maxcio W-UK007S

# Substitutions
substitutions:
  # Device Names
  device_name: "dishwasher"
  friendly_name: "Dishwasher"
  # Icon
  main_icon: "dishwasher"
  # Default Relay State
  # Aka: `restore_mode` in documentation
  # Options: `RESTORE_DEFAULT_OFF`, `RESTORE_DEFAULT_ON`, `ALWAYS_ON` & `ALWAYS_OFF`
  default_state: "ALWAYS_ON"
  # Activity State Threshold
  # Threshold (number) that the device will change from `Idle` to `Active` if power is greater than or equal to
  activity_threshold: "5"

# Basic Config
esphome:
  name: "${device_name}"

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:
api:
ota:

time:
  - platform: sntp
    id: sntp_time

# Device Specific Config
binary_sensor:
  # Push Button (Toggles Relay When Pressed)
  - platform: gpio
    pin:
      number: GPIO13
      mode: INPUT_PULLUP
      inverted: true
    name: "${friendly_name} Button"
    on_press:
      - switch.toggle: relay
  - platform: status
    name: "${friendly_name} Server Status"

switch:
  # Relay (As Switch)
  - platform: gpio
    name: "${friendly_name}"
    icon: "mdi:${main_icon}"
    pin: GPIO15
    id: relay
    restore_mode: "${default_state}"
    on_turn_on:
      - light.turn_on:
          id: led
          brightness: 100%
          transition_length: 0s
    on_turn_off:
      - light.turn_off:
          id: led
          transition_length: 0s

sensor:
  # WiFi Signal Sensor
  - platform: wifi_signal
    name: "${friendly_name} WiFi Status"
    update_interval: 60s
  # Power Monitoring
  - platform: hlw8012
    sel_pin:
      number: GPIO12
      inverted: true
    cf_pin: GPIO5
    cf1_pin: GPIO14
    change_mode_every: 3
    update_interval: 3s
    voltage:
      name: "${friendly_name} Voltage"
      id: voltage
      unit_of_measurement: V
      accuracy_decimals: 1
      filters:
        # Map from sensor -> measured value
        - calibrate_linear:
            - 0.0 -> 0.0
            - 602.87506 -> 229.9
            - 609.8 -> 232.8
    power:
      name: "${friendly_name} Power"
      id: power
      unit_of_measurement: W
      accuracy_decimals: 0
      filters:
        # Map from sensor -> measured value
        - calibrate_linear:
            - 0.0 -> 1.14
            - 62.06167 -> 10.93
            - 1503.27161 -> 247.6
            - 1599.81213 -> 263.7
            - 3923.67700 -> 631.4
            - 7109.50928 -> 1148.0
            - 7237.0857 -> 1193.0
            - 7426.71338 -> 1217.0
    current:
      name: "${friendly_name} Current"
      id: current
      unit_of_measurement: A
      accuracy_decimals: 3
      filters:
        # Map from sensor -> measured value
        - calibrate_linear:
            - 0.0 -> 0.013
            - 0.08208 -> 0.071
            - 1.34223 -> 1.066
            - 5.57170 -> 4.408
            - 6.69184 -> 5.259
            - 6.97187 -> 5.540
  # Total daily energy sensor
  - platform: total_daily_energy
    name: "${friendly_name} Daily Energy"
    power_id: power
    filters:
      # Multiplication factor from W to kW is 0.001
      - multiply: 0.001
    unit_of_measurement: kWh

text_sensor:
  # Device Activity State
  # e.g. shows as active if power reading above a certain threshold
  - platform: template
    name: "${friendly_name} Activity State"
    icon: "mdi:${main_icon}"
    lambda: |-
      if (id(power).state >= $activity_threshold) {
        return {"Active"};
      } else {
        return {"Idle"};
      }
    update_interval: 5s

# Relay State LED
output:
  - platform: esp8266_pwm
    id: state_led
    pin:
      number: GPIO0
      inverted: true

light:
  - platform: monochromatic
    output: state_led
    id: led
```
