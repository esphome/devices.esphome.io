---
title: Athom Smart Plug UK V3 (PG04V3-UK16A)
date-published: 2024-04-25
type: plug
standard: uk
board: esp32
project-url: https://github.com/athom-tech/esp32-configs/blob/main/athom-smart-plug.yaml
difficulty: 1
made-for-esphome: true
---

![Athom Smart Plug UK V3](athom-plug-uk-v3.webp "Athom Smart Plug UK V3 - PG04V3-UK16A")

Maker: [Athom](https://www.athom.tech/)

Product page: [ESP32-C3 UK Plug Made for ESPHome](https://www.athom.tech/blank-1/esp32-c3-uk-plug-for-esphome)

## Description

The Athom Smart Plug UK V3 is a 16 A UK smart plug pre-installed with ESPHome for local control through Home
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
