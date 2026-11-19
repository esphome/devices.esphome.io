---
title: Athom Temperature and Humidity Sensor (SS01-TH)
date-published: 2025-08-25
type: sensor
standard: global
board: esp32
project-url: https://github.com/athom-tech/esp32-configs/blob/main/athom-sht40-sensor.yaml
difficulty: 1
made-for-esphome: true
---

![Athom Temperature and Humidity Sensor](SS01-TH.webp "Athom Temperature and Humidity Sensor - SS01-TH")

Maker: [https://www.athom.tech](https://www.athom.tech)

## Available from

- [Athom](https://www.athom.tech/blank-1/tempreture-and-humidity-sensor)
- [Aliexpress](https://www.aliexpress.com/item/1005009637778878.html)
- [Discord](https://discord.gg/tHdBmXCwRj)

## Description

The Athom Temperature and Humidity Sensor is a USB-powered ESP32-C3 environmental sensor pre-installed with ESPHome
for local monitoring through Home Assistant. Its Sensirion SHT40 sensor measures temperature and relative humidity.

## Features

- ESP32-C3 with 4 MB flash
- Sensirion SHT40 temperature and humidity sensor
- 2.4 GHz Wi-Fi
- WS2812 RGB LED for connection status
- Bluetooth Low Energy proxy enabled by default
- Local Home Assistant integration and OTA updates
- Direct USB power and firmware flashing

The manufacturer's configuration provides adjustable temperature and humidity offset entities. It requires ESPHome
2026.6.0 or newer.

## GPIO Pinout

| Pin    | Function         |
| ------ | ---------------- |
| GPIO9  | Button           |
| GPIO21 | WS2812 RGB LED   |
| GPIO10 | SHT40 SDA        |
| GPIO8  | SHT40 SCL        |

## Configuration

```yaml url=https://github.com/athom-tech/esp32-configs/blob/main/athom-sht40-sensor.yaml
```
