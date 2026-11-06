---
title: Shelly Plus 1PM
date-published: 2021-11-01
type: relay
standard: uk, us, eu
board: esp32
---

![Shelly Plus 1PM](shelly_plus_1pm_pinout.jpg "Shelly Plus 1PM")

## Hardware Versions

There are currently 2 known hardware versions of the Shelly Plus 1PM.

- PCB v0.1.9 with ESP32-U4WDH (Single core, 160MHz, 4MB embedded flash) Sold 2021
- PCB v0.2.0 with ESP32-U4WDH (Dual core,   240MHz, 4MB embedded flash) Sold 2026

## GPIO Pinout

| Pin    | Function                                          |
| ------ | ------------------------------------------------- |
| GPIO0  | LED (Inverted), Shelly Plus Add-On: DATA (Output) |
| GPIO1  | Shelly Plus Add-On: DATA (Input)                  |
| GPIO3  | Shelly Plus Add-On: ANALOG IN                     |
| GPIO4  | Switch input                                      |
| GPIO5  | BL0937 CF                                         |
| GPIO18 | BL0937 CF1                                        |
| GPIO19 | Shelly Plus Add-On: DIGITAL IN                    |
| GPIO23 | BL0937 SEL (Inverted)                             |
| GPIO25 | Button (Inverted, Pull-up)                        |
| GPIO26 | Relay                                             |
| GPIO32 | NTC                                               |
| GPIO33 | Relay supply voltage sensor                       |

Credit and thanks to

- [https://templates.blakadder.com/shelly_plus_1.html](https://templates.blakadder.com/shelly_plus_1.html)

## Internal Temperature Sensor

Please calibrate the NTC and the voltage / power measurements, the values below are just a rough estimate!

## Configuration as relay with overpower and overtemperature protection

```yaml
substitutions:
  device_name: "Shelly Plus 1PM"
  # Higher value gives lower watt readout
  current_res: "0.001"
  # Lower value gives lower voltage readout
  voltage_div: "1925"

esphome:
  name: shelly-plus-1pm
  platformio_options: # Only needed for the single core 160MHz variant
    board_build.f_cpu: 160000000L

esp32:
  variant: esp32
  framework:
    type: esp-idf
    sdkconfig_options: # Only needed for the single core 160MHz variant
      CONFIG_FREERTOS_UNICORE: y
      CONFIG_ESP32_DEFAULT_CPU_FREQ_160: y
      CONFIG_ESP32_DEFAULT_CPU_FREQ_MHZ: "160"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:

api:
  encryption:
    key: "" # Add your API encryption key here

ota:
  - platform: esphome
    password: "" # Add your OTA password here

time:
  - platform: homeassistant

output:
  - platform: gpio
    id: "relay_output"
    pin: GPIO26

switch:
  - platform: output
    id: "relay"
    name: "${device_name} Relay"
    output: "relay_output"

binary_sensor:
  - platform: gpio
    name: "${device_name} Switch"
    pin: GPIO4
    on_press:
      then:
        - switch.turn_on: "relay"
    on_release:
      then:
        - switch.turn_off: "relay"
    filters:
      - delayed_on_off: 50ms

sensor:
  - platform: ntc
    sensor: temp_resistance_reading
    name: "${device_name} Temperature"
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    icon: "mdi:thermometer"
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 298.15K
    on_value_range:
      - above: "80.0"
        then:
          - switch.turn_off: "relay"
  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 10kOhm
  - platform: adc
    id: temp_analog_reading
    pin: GPIO32
    attenuation: 12db

  - platform: adc
    name: "${device_name} Relay Supply Voltage"
    pin: GPIO33
    attenuation: 12db
    filters:
      - multiply: 8

  - platform: hlw8012
    model: BL0937
    sel_pin:
      number: GPIO23
      inverted: true
    cf_pin:
      number: GPIO5
      ignore_strapping_warning: true
    cf1_pin: GPIO18
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}
    current:
      name: "${device_name} Current"
      unit_of_measurement: A
      accuracy_decimals: 3
      icon: mdi:flash-outline
    voltage:
      name: "${device_name} Voltage"
      unit_of_measurement: V
      accuracy_decimals: 1
      icon: mdi:flash-outline
    power:
      name: "${device_name} Power"
      unit_of_measurement: W
      id: power
      icon: mdi:flash-outline
      on_value_range:
        - above: "3600"
          then:
            - switch.turn_off: "relay"
    change_mode_every: 2
    update_interval: 10s
  - platform: total_daily_energy
    name: "${device_name} Daily energy consumed"
    power_id: power
    filters:
      - multiply: 0.001
    unit_of_measurement: kWh
    icon: mdi:clock-alert

status_led:
  pin:
    number: GPIO0
    inverted: true
    ignore_strapping_warning: true
```
