---
title: Gosund 13A Power Monitoring Plug UP111
date-published: 2021-01-11
type: plug
standard: uk
board: esp8266
---

## Manufacturer

[Gosund](https://www.gosund.com/)

## Available from

[Amazon.co.uk](https://www.amazon.co.uk/dp/B0983HP45C)

## Flashing info

Purchased from amazon.co.uk on 11-Jan-2021 and successfully flashed using tuya-convert

## GPIO Pinout

| Pin    | Function            |
| ------ | ------------------- |
| GPIO1  | LED Blue (inverted) |
| GPIO3  | Button              |
| GPIO4  | CF Pin              |
| GPIO5  | CF1 Pin             |
| GPIO12 | SEL (inverted)      |
| GPIO13 | LED Red (inverted)  |
| GPIO14 | Relay               |

## Basic Configuration

```yaml
---
# Gosund UP111

# Substitutions
substitutions:
  # Device Names
  device_name: "gosundPlug01"
  friendly_name: "gosundPlug01"
  # Icon
  main_icon: "power-socket-uk"
  # Default Relay State
  # Aka: `restore_mode` in documentation
  # Options: `RESTORE_DEFAULT_OFF`, `RESTORE_DEFAULT_ON`, `ALWAYS_ON` & `ALWAYS_OFF`
  default_state: "RESTORE_DEFAULT_OFF"
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

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${device_name} Fallback Hotspot"
    password: !secret hotspot_wifi_password

captive_portal:

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
      number: GPIO3
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
    pin: GPIO14
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
    cf_pin: GPIO4
    cf1_pin: GPIO05
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
      number: GPIO1
      inverted: true

light:
  - platform: monochromatic
    output: state_led
    id: led

status_led:
  pin:
    number: GPIO13
    inverted: True
```
