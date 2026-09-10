---
title: SENSY-ONE S1 Pro Multi Sense
date-published: 2026-06-09
type: sensor
standard: global
board: esp32
project-url: https://github.com/sensy-one/S1-Pro-Multi-Sense
made-for-esphome: true
difficulty: 1
---

![SENSY-ONE S1 Pro Multi Sense](S1_Pro_Multi_Sense.jpg)

## Description

The SENSY-ONE S1 Pro Multi Sense is a compact Wi-Fi mmWave presence and environmental multisensor designed for
ESPHome and Home Assistant. It delivers real-time multi-target tracking, indoor air quality sensing, and
seamless smart home automation support.

## Links

- [Official Product Page](https://sensy-one.com/products/s1-pro-multi-sense-1)
- [Home Assistant Add-on](https://github.com/sensy-one/home-assistant-addons)
- [S1 Pro vs E1 Pro Comparison Blog](https://sensy-one.com/blogs/blog/s1-pro-vs-e1-pro-multi-sense-which-smart-sensor-is-right-for-you)

## Features

- Hi-Link LD2450 24GHz mmWave radar module (tracks up to 3 targets simultaneously)
- ESP32-C3 microcontroller with 2.4GHz Wi-Fi and Bluetooth Low Energy
- USB-C 5V power input
- Bosch BME688 environmental sensor (VOC, eCO₂ estimation, IAQ, temperature, humidity, air pressure)
- LTR-390UV ambient light and UV sensor
- Optional Sensirion SCD40 NDIR CO₂ sensor (true CO₂ measurement with temperature & humidity)
- Configurable detection zones (3 zones + 1 exclusion zone)
- Real-time X/Y position, distance and motion tracking
- RGB LED status indicator
- Integrated piezo buzzer (~80–90 dB)
- Home Assistant custom add-on with 2D & 3D floorplan support, live presence visualization, and heatmaps

```yaml url=https://github.com/sensy-one/S1-Pro-Multi-Sense/blob/main/assets/source/main.yaml
```
