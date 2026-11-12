---
title: Delock 11827 Power Monitoring Smart Plug
date-published: 2021-01-26
type: plug
standard: eu
board: esp8266
---

## General Notes

Model reference: 11827

Manufacturer: [Delock](https://www.delock.de/produkt/11827/merkmale.html?setLanguage=en)

The device comes **pre-flashed with Tasmota**.
Flashing ESPHome is easily possible by uploading an ESPHome .bin file using the device's web interface.

![Product](./Delock-11827-Power-Monitoring-Smart-Plug-Box.jpg "Product Image Box")

## GPIO Pinout

| Pin    | Function          |
| ------ | ----------------- |
| GPIO3  | Button (inverted) |
| GPIO4  | HLW8012 - CF      |
| GPIO5  | HLW8012 - CF1     |
| GPIO12 | HLW8012 - SEL     |
| GPIO13 | LED               |
| GPIO14 | Relay             |

## HLW8012 Calibration Values

| Value   |           |
| ------- | --------- |
| Current | 0.0009356 |
| Voltage | 2182      |

Values vary between devices, should be calibrated.

## Basic Config

Basic configuration with switch and power/voltage/current reporting.

```yaml file=config.yaml
```
