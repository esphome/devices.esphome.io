---
title: SENSY-ONE E1 Pro Multi Sense
date-published: 2026-06-09
type: sensor
standard: global
board: esp32
project-url: https://github.com/sensy-one/E1-Pro-Multi-Sense
made-for-esphome: true
difficulty: 1
---

![SENSY-ONE E1 Pro Multi Sense](E1_Pro_Multi_Sense.jpg)

## Description

The SENSY-ONE E1 Pro Multi Sense is a PoE-enabled mmWave presence and environmental multisensor designed for
high-performance room tracking, occupancy detection, and smart automation with ESPHome and Home Assistant.

## Links

- [Official Product Page](https://sensy-one.com/products/e1-pro-multi-sense)
- [Home Assistant Add-on](https://github.com/sensy-one/home-assistant-addons)
- [S1 Pro vs E1 Pro Comparison Blog](https://sensy-one.com/blogs/blog/s1-pro-vs-e1-pro-multi-sense-which-smart-sensor-is-right-for-you)

## Features

- Hi-Link LD2460 24GHz mmWave radar module (tracks up to 5 targets simultaneously)
- ESP32-C3 microcontroller with Ethernet, 2.4GHz Wi-Fi and Bluetooth Low Energy
- Power over Ethernet (PoE) for power and wired network connectivity
- USB-C 5V power input (alternative to PoE)
- Built-in air pressure sensor
- LTR-390UV ambient light and UV sensor
- Optional Sensirion SCD40 NDIR CO₂ sensor (true CO₂ measurement with temperature & humidity)
- Optional BME688 air quality sensor (VOC, eCO₂ estimation, temperature, humidity, pressure)
- 3 configurable detection zones + 1 exclusion zone
- Real-time X/Y position, distance and motion tracking
- 4x front-facing RGB LEDs
- Integrated piezo buzzer (~80–90 dB)
- Home Assistant custom add-on with 2D & 3D floorplan support, live positioning, heatmaps, and 3D visualization

## Configuration

```yaml url=https://github.com/sensy-one/E1-Pro-Multi-Sense/blob/main/assets/source/main_wifi.yaml
```
