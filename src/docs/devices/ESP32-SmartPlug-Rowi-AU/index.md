---
title: Rowi ESP32 Smart Plug AU and NZ
date-published: 2022-01-20
type: plug
standard: au
board: esp32
made-for-esphome: true
---

## Product Description

ESP32-based Smart Plug (Rowi), delivered with the pre-flashed ESPHome firmware - no need to open the device!

Configuration: ESP32, Embedded temperature sensor SHTC3, RGB LED.

Manufacturer: [Vaiotech](https://www.vaiotech.co.nz/rowi-smart-plug-for-esphome/)

## Product Images

![alt text](rowi.png "Rowi ESP32 Smart Plug AU and NZ")

## GPIO Pinout

| Pin   | Function             |
| ----- | -------------------- |
| GPIO4 | Button               |
| GPIO2 | Relay                |
| GPI18 | LED RED (inverted)   |
| GPI19 | LED GREEN (inverted) |
| GPI21 | LED BLUE (inverted)  |
| GPI16 | I2C_SDA              |
| GPI17 | I2C_SCL              |

## Basic Configuration

[GitHub](https://github.com/vt-vaio/rowi)

```yaml url=https://github.com/vt-vaio/rowi/blob/main/rowi-plug.yaml
```
