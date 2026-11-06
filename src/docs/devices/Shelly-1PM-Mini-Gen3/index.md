---
title: Shelly 1PM Mini Gen3
date-published: 2023-11-25
type: relay
standard: uk, us, eu
board: esp32
difficulty: 4
---

Generation 3 of Shelly Mini. With Powermeter, and Relay

## Serial Pinout

| Pin     | Colour |
| ------- | ------ |
| Reset   | Brown  |
| 3v3     | Red    |
| RX      | Blue   |
| TX      | Yellow |
| BootSEL | Purple |
| GND     | Black  |

The UART Pinout is the same as other Shelly Plus Mini.

![Shelly 1 Mini Gen3](../Shelly-1-Mini-Gen3/shelly_1_mini_gen3_pcb_a.png "Shelly 1 Mini Gen3")

## GPIO Pinout

| Pin    | Function  |
| ------ | --------- |
| GPIO0  | LED       |
| GPIO1  | Button    |
| GPIO3  | NTC       |
| GPIO5  | Relay     |
| GPIO6  | BL0942 TX |
| GPIO7  | BL0942 RX |
| GPIO10 | Switch    |

## Basic Configuration

```yaml
esphome:
  name: "sehlly-1pm-mini-gen3"
  friendly_name: "Shelly 1PM Mini Gen3"

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

  - platform: bl0942
    uart_id: uart_0
    voltage:
      name: "Voltage"
      id: bvoltage
      icon: mdi:alpha-v-circle-outline
      device_class: voltage
    current:
      name: "Current"
      id: bcurrent
      icon: mdi:alpha-a-circle-outline
      device_class: current
    power:
      name: "Power"
      id: bpower
      icon: mdi:transmission-tower
      device_class: power
    energy:
      name: "Energy"
      id: benergy
      icon: mdi:lightning-bolt
      device_class: energy
    frequency:
      name: "Frequency"
      id: bfreq
      accuracy_decimals: 2
      icon: mdi:cosine-wave
      device_class: frequency
    update_interval: 5s

uart:
  id: uart_0
  tx_pin: GPIO6
  rx_pin: 
    number: GPIO7
    mode:
      pullup: true
      input: true
  baud_rate: 9600
  stop_bits: 1

status_led:
  pin:
    number: 0
    inverted: true

output:
  - platform: gpio
    id: "relay_output"
    pin: 5

switch:
  - platform: output
    id: "relay"
    name: "Relay"
    output: "relay_output"

binary_sensor:
  - platform: gpio
    name: "Switch"
    pin: 10
    on_press:
      then:
        - switch.toggle: "relay"
    filters:
      - delayed_on_off: 50ms

  - platform: gpio
    name: "Button"
    pin:
      number: 1
      inverted: yes
      mode:
        input: true
        pullup: true
```
