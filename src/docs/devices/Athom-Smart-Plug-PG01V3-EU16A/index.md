---
title: Athom Smart Plug EU V3 (PG01V3-EU16A)
date-published: 2024-04-25
type: plug
standard: eu
board: esp32
project-url: https://github.com/athom-tech/esp32-configs/blob/main/athom-smart-plug.yaml
difficulty: 1
made-for-esphome: true
---

![Athom Smart Plug EU V3](athom-plug-eu-v3.webp "Athom Smart Plug EU V3 - PG01V3-EU16A")

Maker: [Athom](https://www.athom.tech/)

Product page: [ESP32-C3 EU Plug Made for ESPHome](https://www.athom.tech/blank-1/esp32-c3-eu-plug-for-esphome)

## Description

The Athom Smart Plug EU V3 is a 16 A EU smart plug pre-installed with ESPHome for local control through Home
Assistant. It provides relay control and energy monitoring without requiring a cloud service.

## Features

- ESP32-C3 with 4 MB flash
- 2.4 GHz Wi-Fi and Bluetooth Low Energy proxy
- Voltage, current, power, power factor, and energy monitoring
- 16 A maximum load with over-current shutoff
- Configurable power-on state
- Local Home Assistant integration and managed OTA updates

The manufacturer's configuration requires ESPHome 2026.6.0 or newer.

## GPIO Pinout

| Pin    | Function   |
| ------ | ---------- |
| GPIO20 | CSE7766 Rx |
| GPIO3  | Button     |
| GPIO5  | Relay      |
| GPIO6  | Status LED |

## Configuration

```yaml url=https://github.com/athom-tech/esp32-configs/blob/main/athom-smart-plug.yaml
```
