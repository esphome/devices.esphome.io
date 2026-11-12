---
title: "Tynet HCPBridge"
date-published: 2026-11-12
type: misc
standard: global
board: esp32
difficulty: 1
made-for-esphome: true
project-url: https://github.com/Tysonpower/Tynet-HCPBridge
---

## Description

The Tynet HCPBridge is a device that allows the control of Hörmann garage door motors via Home Assistant.

A DIY kit is available from the [Tynet.eu Shop](https://shop.tynet.eu),
 it ships with ESPHome pre-installed and uses the Hörmann Cover ESPHome component to provide a plug-and-play
experience with minimal setup needed.

Features:

- Read door status: open/closed, door position in percent, light on/off  
- Control: open, close, stop, light toggle, set position (half/vent/custom)
- On-board AHT20 sensor (temperature & humidity)
- Home Assistant Auto Discovery via ESPHome
- Web interface for door control
- First-use hotspot (for out-of-the-box Wi-Fi setup)  
- Connects to the strongest AP if the SSID is broadcast by several access points
- Multiple expansion ports to add sensors
- Optional external sensors with YAML examples (BME280, DHT22, DS18x20, HC-SR04, HC-SR501, MQ4)  
- Supports multiple HCPBridges for multiple garage doors (one bridge per motor)
- OTA updates  

## Setup

Follow our detailed
 [Quickstart Guide](https://github.com/Tysonpower/Tynet-HCPBridge/wiki/Quickstart-ESPHome-based-Firmware)
 in our GitHub Wiki or follow these instructions:

1. Power the HCPBridge via USB-C.
2. Connect it to your local Wi-Fi via the hotspot it opens, using Improv via Bluetooth (Home Assistant app),
   or using Improv via USB.
3. Adopt it in Home Assistant once configured and connected to your Wi-Fi.
4. Disconnect the USB-C cable and connect to your Hörmann motor's BUS port via the provided RJ12 cable.
5. Execute a BUS scan on your garage motor (see user manual).

## Configuration

```yaml url=https://github.com/Tysonpower/Tynet-HCPBridge/blob/main/hcpbridge_series4.yaml
# Paste a working ESPHome YAML configuration here
```
