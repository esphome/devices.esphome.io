---
title: Lilygo TDisplay S3
date-published: 2024-04-08
type: misc
standard: global
board: esp32
project-url: https://www.lilygo.cc/en-ca/products/t-display-s3
---

## Schematic

![TDisplay S3 Schematic](tdisplay-s3.webp "TDisplay S3 Schematic")

## Basic Configuration

Below example is for Lilygo T-Display S3 non-touch (ESP32-S3 1.9 inch ST7789 LCD Display), with ESPHome 2025.6.2.

```yaml
esphome:
  name: s3
  friendly_name: ESP32-S3 T-Display

esp32:
  variant: esp32s3
  framework:
    type: esp-idf
  flash_size: 16MB

logger:

api:

ota:
  - platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      inverted: true
    name: "Button 1"
  - platform: gpio
    pin:
      number: GPIO14
      inverted: true
    name: "Button 2"

output:
  - platform: ledc
    frequency: 2000
    pin: GPIO38
    id: backlight_output

light:
  - platform: monochromatic
    output: backlight_output
    name: LCD Backlight
    id: led
    restore_mode: ALWAYS_ON
    default_transition_length: 0s

spi:
  type: octal
  clk_pin: 8
  data_pins:
    - 39
    - 40
    - 41
    - 42
    - ignore_strapping_warning: true
      number: 45
    - ignore_strapping_warning: true
      number: 46
    - 47
    - 48

psram:
  speed: 80MHz
  mode: octal

display:
  - platform: mipi_spi
    model: t-display-s3
    rotation: 270
    show_test_card: true # display basic hello-world

```
