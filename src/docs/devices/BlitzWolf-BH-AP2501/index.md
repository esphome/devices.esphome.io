---
title: BlitzWolf BH-AP2501
date-published: 2023-04-23
type: misc
standard: eu
board: esp8266
project-url: https://github.com/wildekek/BlitzHome-BH-AP2501
made-for-esphome: False
difficulty: 5
---

![alt text](./product.jpg "Product Image")
![alt text](./ESP12F.jpg "ESP MCU Image")

## General Notes

These devices run a Tuya WBR3 MCU which needs to be replaced: preferably by an ESP12F.

## GPIO Pinout

| Pin    | Function      |
| ------ | ------------- |
| GPIO1  | UART TX       |
| GPIO3  | UART RX       |
| EN     | 10k pull-up   |
| RES    | 10k pull-up   |
| GPIO15 | 10k pull-down |

## Configuration

```yaml
substitutions:
  device_name: "air-purifier"
  device_friendly_name: "Air Purifier"
  device_description: "Clean air good."
  time_timezone: "Europe/Amsterdam"

esphome:
  name: $device_name
  friendly_name: $device_friendly_name
  comment: $device_description
  name_add_mac_suffix: false

esp8266:
  board: esp12e

# Enable status LED
status_led:
  pin:
    number: GPIO2
    inverted: true

# Enable logging
logger:
  level: INFO
  # Disable logging via UART, we need it for the Tuya MCU
  baud_rate: 0

# Enable Home Assistant API
api:
  encryption:
    key: !secret home_assistant_key

ota:
  password: !secret ota_password

# Configure WiFi
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Initialize the UART that connects to the Tuya MCU
uart:
  rx_pin: GPIO3
  tx_pin: GPIO1
  baud_rate: 9600

# Register the Tuya MCU connection
tuya:

# Fan control
output:
  - platform: template
    id: fan_output
    type: float
    # Off = 0
    # Low = 0.33333
    # Medium = 0.66666
    # High = 1
    write_action:
      - logger.log:
          level: INFO
          format: "Fan output: %f"
          args: ["state"]
      - if:
          condition:
            lambda: return (state == 0);
          then:
            - fan.turn_off:
                id: tuya_fan
          else:
            - if:
                condition:
                  lambda: return (state < .4);
                then:
                  # Fan = Low
                  - fan.turn_on:
                      id: tuya_fan
                      speed: 4
                else:
                  - if:
                      condition:
                        lambda: return (state < .8);
                      then:
                        # Fan = Mid
                        - fan.turn_on:
                            id: tuya_fan
                            speed: 3
                      else:
                        # Fan = High
                        - fan.turn_on:
                            id: tuya_fan
                            speed: 2

fan:
  - platform: speed
    output: fan_output
    id: speed_fan
    name: "Fan"
    speed_count: 3
  - platform: "tuya"
    name: "Fan"
    id: "tuya_fan"
    internal: True
    switch_datapoint: 1
    speed_datapoint: 3
    speed_count: 4 # 1=Auto, 2=High, 3=Medium, 4=Sleep

sensor:
  # PM2.5 sensor
  - platform: "tuya"
    name: "PM2.5"
    sensor_datapoint: 2
    device_class: "aqi"
    state_class: "measurement"
    accuracy_decimals: 0
  # Filter utilization
  - platform: "tuya"
    name: "Filter remaining"
    sensor_datapoint: 5
    unit_of_measurement: "%"
    icon: mdi:ticket-percent-outline
    entity_category: diagnostic
  # Countdown remaining
  - platform: "tuya"
    name: "Countdown Remaining"
    sensor_datapoint: 19
    icon: mdi:fan-clock
    unit_of_measurement: "minutes"
  # Air quality
  - platform: "tuya"
    name: "Air Quality"
    sensor_datapoint: 21
    icon: mdi:air-filter

number:
  # Set countdown timer
  - platform: "tuya"
    name: "Countdown"
    number_datapoint: 18
    unit_of_measurement: hours
    mode: box
    icon: "mdi:fan-clock"
    min_value: 0
    max_value: 24
    step: 1

switch:
  # Ionizer
  - platform: "tuya"
    name: "Ionizer"
    switch_datapoint: 6
    icon: mdi:chart-bubble
  # UV sterilization
  - platform: "tuya"
    name: "UV sterilization"
    switch_datapoint: 9
    icon: mdi:sun-wireless
  # Filter reset
  - platform: "tuya"
    id: "filter_reset"
    switch_datapoint: 11
    internal: True

# Button to reset filter cartridge
button:
  - platform: template
    name: "Filter cartridge reset"
    entity_category: diagnostic
    icon: mdi:air-filter
    on_press:
      then:
        - fan.turn_on: tuya_fan
        - switch.turn_on: filter_reset
        - delay: 1s
        - switch.turn_off: filter_reset
```
