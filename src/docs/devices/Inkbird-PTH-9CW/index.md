---
title: Inkbird PTH-9CW CO2 Sensor
date-published: 2024-08-15
type: sensor
standard: global
board: bk72xx
difficulty: 4
---

## Overview

The Inkbird PTH-9CW (INK-CO2W) is an air quality sensor that provides CO2 concentration, temperature and humidity
measurements. A teardown of this device can be found
[on Dr. Gough's blog](https://goughlui.com/2023/10/22/review-teardown-inkbird-pth-9cw-wi-fi-carbon-dioxide-detector/)
thanks to Dr. Gough.

This is a Tuya device with a CB3S module inside. The NDIR CO2 sensor is either an MH-Z19D or MH-Z19E, and the
temp/humidity sensor is an SHT40. All the sensors and the display are connected to the Tuya MCU.

While the device has a built-in 18650 cell, it has no power-saving features and will sample the NDIR sensor
continuously. As a result of that, the battery life is extremely poor, and it must remain plugged in for continuous use.
If you don't plan to use it as a portable device, the battery can be disconnected with no loss of function. Optionally,
solder a 100uF electrolytic capacitor across the battery connector to stop the battery charging animation on the
display.

## Flashing

To flash the device, disconnect the solder bridges on J30 and J31, then solder the uart wires to the module. Pinout of
the CB3S module can be found in the Libretiny [documentation](https://docs.libretiny.eu/boards/cb3s/). J2 is not
connected to the CB3S module while J30 and J31 are open, so it cannot be used for flashing. After a successful upload,
bridge J30 and J31 back with some solder, and reassemble the device.

## Configuration

The Tuya MCU will default to a placeholder 500ppm reading while the NDIR CO2 sensor is initializing, so it needs to be
filtered out. The alarm settings and display backlight cannot be changed remotely with datapoints.

```yaml
esphome:
  name: pth-9cw
  friendly_name: PTH-9CW

bk72xx:
  board: cb3s

wifi:
  ap:

logger:

api:

captive_portal:

uart:
  rx_pin: P10
  tx_pin: P11
  baud_rate: 115200

tuya:

sensor:
  - platform: "tuya"
    name: "Temperature"
    device_class: temperature
    state_class: "measurement"
    sensor_datapoint: 18
  - platform: "tuya"
    name: "Humidity"
    device_class: humidity
    state_class: "measurement"
    unit_of_measurement: "%"
    sensor_datapoint: 19
  - platform: "tuya"
    name: "CO2"
    device_class: carbon_dioxide
    state_class: "measurement"
    unit_of_measurement: "ppm"
    sensor_datapoint: 2
    filters:
      - skip_initial: 3
      - filter_out: 500

select:
  - platform: "tuya"
    name: "Display Unit"
    enum_datapoint: 101
    optimistic: true
    options:
      0: Fahrenheit
      1: Celsius
```
