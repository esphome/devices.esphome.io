---
title: Shelly 1L
date-published: 2021-01-03
type: relay
standard: uk, us, eu, au, global
board: esp8266
---

## GPIO Pinout

| Pin    | Function        |
| ------ | --------------- |
| GPIO0  | On-board LED    |
| GPIO5  | Relay           |
| GPIO4  | Switch Input    |
| GPIO14 | Switch Input    |
| A0     | ADC Temperature |

## Basic Configuration

```yaml
substitutions:
  plug_name: shelly_1l

# Basic Config
esphome:
  name: ${plug_name}

esp8266:
  board: esp01_1m
    
# OTA flashing
ota:
  - platform: esphome

wifi: # Your Wifi network details
  
# Enable fallback hotspot in case wifi connection fails  
  ap:

# Enabling the logging component
logger:

# Enable Home Assistant API
api:

# Enable the captive portal
captive_portal:

#==============================================================
output:
  - platform: gpio
    pin: GPIO5
    id: shelly_1l_relay

light:
  - platform: binary
    name: ${device_name}_light
    output: shelly_1l_relay
    id: lightid

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO4
    name: ${device_name}_switch_1
    on_state:
      then:
        - light.toggle: lightid
    id: switchid1
    filters:
      - delayed_on_off: 50ms
  - platform: gpio
    pin:
      number: GPIO14
    name: ${device_name}_switch_2

sensor:
  - platform: ntc
    sensor: temp_resistance_reading
    name: ${device_name}_temperature
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
          - light.turn_off: lightid
  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 32kOhm
  - platform: adc
    id: temp_analog_reading
    pin: A0

status_led:
  pin: GPIO0
#==============================================================
```

In this configuration switch 1 is connected to the relay and toggles the light.
Switch 2 is published as a basic binary sensor. This allows you to use a dual plate switch where only a single light is present.
The first switch will control the light while the second switch can be used to trigger other automations/scenes.

A protection automation has been added to automatically turn off the relay when the device gets too hot.

Note: I used this temperature sensor configuration from another configuration, it has not been tested on accuracy.
