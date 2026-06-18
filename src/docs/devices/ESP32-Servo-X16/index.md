---
title: ESP32 Servo Board X16
date-published: 2026-06-18
type: misc
standard: global
board: esp32
---

![Product](image1.png "Product Image 1")
![Product](image2.png "Product Image 2")
![Product](image3.png "Product Image 3")

## Product description

This is a 16-servo controller board with an ESP32-32E-N4.

Each servo is protected by an 1.5A fuse.

It is available on aliexpress.

## GPIO Pinout

|      |      |      | 5V  | TX  | RX  | GND | GND | IO0 |      |      |      |
| :--: | :--: | :--: | :-: | :-: | :-: | :-: | :-: | :-: | :--: | :--: | :--: |
| GND  | VCC  | IO15 |     |     |     |     |     |     | IO22 | VCC  | GND  |
| GND  | VCC  | IO32 |     |     |     |     |     |     | IO21 | VCC  | GND  |
| GND  | VCC  | IO33 |     |     |     |     |     |     | IO19 | VCC  | GND  |
| GND  | VCC  | IO25 |     |     |     |     |     |     | IO18 | VCC  | GND  |
| GND  | VCC  | IO26 |     |     |     |     |     |     | IO12 | VCC  | GND  |
| GND  | VCC  | IO27 |     |     |     |     |     |     | IO17 | VCC  | GND  |
| GND  | VCC  | IO14 |     |     |     |     |     |     | IO16 | VCC  | GND  |
| GND  | VCC  | IO13 |     |     |     |     |     |     | IO4  | VCC  | GND  |

## Basic Config

```yaml
esphome:
  name: servo-x16

esp32:
  variant: esp32

output:
  - platform: ledc
    id: servo_00
    pin: GPIO4
    frequency: 50Hz    # Standard servo frequency
  - platform: ledc
    id: servo_01
    pin: GPIO16
    frequency: 50Hz
  - platform: ledc
    id: servo_02
    pin: GPIO17
    frequency: 50Hz
  - platform: ledc
    id: servo_03
    pin: GPIO12
    frequency: 50Hz
  - platform: ledc
    id: servo_04
    pin: GPIO18
    frequency: 50Hz
  - platform: ledc
    id: servo_05
    pin: GPIO19
    frequency: 50Hz
  - platform: ledc
    id: servo_06
    pin: GPIO21
    frequency: 50Hz
  - platform: ledc
    id: servo_07
    pin: GPIO22
    frequency: 50Hz
  - platform: ledc
    id: servo_08
    pin: GPIO15
    frequency: 50Hz
  - platform: ledc
    id: servo_09
    pin: GPIO32
    frequency: 50Hz
  - platform: ledc
    id: servo_10
    pin: GPIO33
    frequency: 50Hz
  - platform: ledc
    id: servo_11
    pin: GPIO25
    frequency: 50Hz
  - platform: ledc
    id: servo_12
    pin: GPIO26
    frequency: 50Hz
  - platform: ledc
    id: servo_13
    pin: GPIO27
    frequency: 50Hz
  - platform: ledc
    id: servo_14
    pin: GPIO14
    frequency: 50Hz
  - platform: ledc
    id: servo_15
    pin: GPIO13
    frequency: 50Hz
