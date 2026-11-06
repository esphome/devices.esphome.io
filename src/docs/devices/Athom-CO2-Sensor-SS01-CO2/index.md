---
title: Athom CO2 Sensor (SS01-CO2)
date-published: 2025-08-25
type: sensor
standard: global
board: esp32
project-url: https://github.com/athom-tech/esp32-configs/blob/main/athom-scd40-sensor.yaml
difficulty: 1
made-for-esphome: true
---

![Athom CO2 Sensor](SS01-CO2.webp "Athom CO2 Sensor - SS01-CO2")

Maker: [https://www.athom.tech](https://www.athom.tech)

## Available from

- [Athom](https://www.athom.tech/blank-1/co2-sensor)
- [Aliexpress](https://www.aliexpress.com/item/1005009637969636.html)
- [Discord](https://discord.gg/tHdBmXCwRj)

## Description

The Athom CO2 Sensor is a USB-powered ESP32-C3 air quality sensor pre-installed with ESPHome for local monitoring
through Home Assistant. Its Sensirion SCD40 sensor measures carbon dioxide, temperature, and relative humidity.

## Features

- ESP32-C3 with 4 MB flash
- Sensirion SCD40 CO2, temperature, and humidity sensor
- WS2812 RGB LED for connection and air quality status
- Bluetooth Low Energy proxy enabled by default
- Local Home Assistant integration and OTA updates
- Direct USB power and firmware flashing

The temperature and humidity entities are disabled by default in the manufacturer's configuration. The configuration
requires ESPHome 2026.6.0 or newer.

## GPIO Pinout

| Pin    | Function         |
| ------ | ---------------- |
| GPIO9  | Button           |
| GPIO21 | WS2812 RGB LED   |
| GPIO10 | SCD40 SDA        |
| GPIO8  | SCD40 SCL        |

## Configuration

```yaml url=https://github.com/athom-tech/esp32-configs/blob/main/athom-scd40-sensor.yaml
```
