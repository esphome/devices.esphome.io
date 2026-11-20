---
title: "B.K. Licht LSB F03026B RGB+CCT Ceiling Light"
date-published: 2026-11-20
type: light
standard: eu
board: bk72xx
difficulty: 4
---

## Overview

The B.K. Licht LSB F03026B is a 20W RGB+CCT smart ceiling light originally controlled by Tuya firmware.

It contains a Tuya CB2S Wi-Fi module based on the BK7231N microcontroller and supports independently controlled red, green, blue, warm-white and cool-white LED channels.

The original Tuya firmware configuration was examined to recover the GPIO assignments. The configuration has been tested on two fixtures running ESPHome.

## GPIO assignments

| GPIO | Function |
| --- | --- |
| P6 | Red |
| P7 | Green |
| P8 | Blue |
| P24 | Cool white |
| P26 | Warm white |

The manufacturer's PWM frequency is 1000 Hz.

## ESPHome configuration

```yaml file=config.yaml

esphome:
  name: bk-licht-ceiling-light
  friendly_name: B.K. Licht Ceiling Light

bk72xx:
  board: cb2s

logger:
  baud_rate: 0

wifi:
  ap: {}

output:
  - platform: libretiny_pwm
    id: red_output
    pin: P6
    frequency: 1000 Hz

  - platform: libretiny_pwm
    id: green_output
    pin: P7
    frequency: 1000 Hz

  - platform: libretiny_pwm
    id: blue_output
    pin: P8
    frequency: 1000 Hz

  - platform: libretiny_pwm
    id: cool_white_output
    pin: P24
    frequency: 1000 Hz

  - platform: libretiny_pwm
    id: warm_white_output
    pin: P26
    frequency: 1000 Hz

light:
  - platform: rgbww
    name: "Ceiling Light"
    id: ceiling_light
    red: red_output
    green: green_output
    blue: blue_output
    cold_white: cool_white_output
    warm_white: warm_white_output
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
    color_interlock: true
    constant_brightness: false
    gamma_correct: 1.0
    default_transition_length: 300ms
```

## Flashing

The CB2S module can be flashed using a 3.3V USB-to-UART adapter and ltchiptool. Connect TX to RX1, RX to TX1, and GND to GND; use CEN to reset the module into the serial bootloader. Confirm the safe power arrangements for the board before connecting 3.3V.

Back up the original firmware before flashing. Select BK7231N-compatible ESPHome firmware.

**Electrical safety:** This is a 230V mains-powered fixture. Disconnect it from mains and ensure stored charge is discharged before working on the electronics. Do not connect mains power and a USB serial adapter simultaneously. The low-voltage circuitry must not be assumed electrically isolated.

## Notes

Using `gamma_correct: 1.0` improves low-brightness dimming and smooth warm/cool transitions. Stock Tuya and ESPHome brightness curves may differ.
