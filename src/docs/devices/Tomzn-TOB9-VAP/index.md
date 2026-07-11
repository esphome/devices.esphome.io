---
title: TomZN TOB9-VAP
date-published: 2024-12-07
type: misc
standard: global
board: bk72xx
difficulty: 3
---

## Notes

- Uses [BL0942](https://esphome.io/components/sensor/bl0942/) for energy monitoring, which requires
  [calibration](https://esphome.io/components/sensor/bl0942/#calibration)
- Uses an [H-Bridge](https://esphome.io/components/switch/hbridge/) for controlling the output instead of a standard
  relay. One key difference is that the H-Bridge retains the last position upon power off without the need of
  `restore_mode`

## Product images

![device](./device.jpg "Device")

![board](./board.jpg "Board")

## Programming

Tuya Cloudcutter was [not able to work for this device](https://github.com/tuya-cloudcutter/tuya-cloudcutter/issues/742)
(with firmware v1.0.15). If your device has an older firmware, it may be worth a try.

This device is powered by a [CBU](https://docs.libretiny.eu/boards/cbu) board (BK7231N), you can read
[LibreTiny's instructions](https://docs.libretiny.eu/docs/platform/beken-72xx/) on how to flash it.

Disassembling this device is simple, provided you find a way to remove the golden tubes. Here is one way:

![disassembling](./disassembling.jpg "Disassembling")

## GPIO Pinout

| Pin    | Function          | Notes    |
| ------ | ----------------- | -------- |
| GPIO09 | Red LED           | inverted |
| GPIO10 | RX for BL0942     | RX1      |
| GPIO11 | TX for BL0942     | TX1      |
| GPIO15 | Blue LED (status) | inverted |
| GPIO17 | Button            | inverted |
| GPIO24 | Bridge forward    | pulse    |
| GPIO26 | Bridge reverse    | pulse    |

## Basic Configuration

```yaml
esphome:
  name: TomZN.TOB9-VAP
  min_version: 2024.12.0

bk72xx:
  board: cbu

logger:

captive_portal:

uart:
  tx_pin: TX1
  rx_pin: RX1
  baud_rate: 4800
  stop_bits: 1

binary_sensor:
  - platform: gpio
    id: power_button
    pin:
      number: 17
      inverted: true
      mode: INPUT_PULLUP
    on_multi_click:
      - timing:
          - ON for at most 1s
          - OFF for at least 0.2s
        then:
          switch.toggle: main_switch
      - timing:
          - ON for at least 4s
        then:
          button.press: reset

output:
  - platform: libretiny_pwm
    id: red_led_output
    pin:
      number: P9
      inverted: true

light:
  - platform: status_led
    id: blue_led
    pin:
      number: P15
      inverted: true
  - platform: monochromatic
    id: red_led
    output: red_led_output

switch:
  - platform: hbridge
    name: Switch
    id: main_switch
    on_pin: GPIO24
    off_pin: GPIO26
    pulse_length: 60ms
    wait_time: 30ms
    on_turn_on:
      light.turn_on: red_led
    on_turn_off:
      light.turn_off: red_led

sensor:
  - platform: bl0942
    line_frequency: 50Hz
    update_interval: 10s
    current:
      name: Current
      filters:
        # The chip reports some current even when there is no load
        - lambda: if (x < 0.02) return 0.0; else return x;
    voltage:
      name: Voltage
    power:
      name: Power
      filters:
        # The chip reports some power even when there is no load
        - lambda: if (x < 0.5) return 0.0; else return x;
    energy:
      name: Energy
      unit_of_measurement: kWh
    frequency:
      name: Frequency
      accuracy_decimals: 2
```
