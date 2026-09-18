---
title: Everything Presence Pro
date-published: 2026-08-04
type: sensor
standard: global
board: esp32
difficulty: 1
made-for-esphome: true
project-url: https://github.com/EverythingSmartHome/everything-presence-pro
---

![Everything Presence Pro](everything-presence-pro.png "Everything Presence Pro")

## Description

The Everything Presence Pro is a professional-grade presence sensor with a triple-sensor detection system and the
following features:

- DFRobot SEN0609 24GHz mmWave sensor for static presence detection with up to 25m range
- HiLink LD2450 24GHz mmWave sensor for multi-target tracking with up to 6m range (up to 3 targets simultaneously)
- Panasonic EKMC1603111 PIR sensor with 12m detection range
- SHTC3 Temperature and Humidity sensor
- BH1750 Light intensity sensor
- Optional SCD40 CO2 sensor
- RGB status LED with configurable presence and environmental feedback modes
- Relay output with configurable NO/NC contact modes for alarm system integration
- Dedicated tamper output with physical switch
- Ethernet (LAN8720A), 2.4GHz WiFi and Bluetooth LE connectivity
- Bluetooth Proxy functionality for Home Assistant
- Powered via USB-C (5V), 802.3af Power over Ethernet, or 12-24V DC header input
- Visual Zone Configurator for easy zone management with configurable detection and exclusion zones

## Setup

1. Power the Everything Presence Pro via USB-C, PoE or the DC header input.
2. Using the Home Assistant Mobile App, go to Settings > Devices and find the auto discovered Everything Presence Pro
3. Hit add and enter WiFi details (skip this step if using Ethernet)
4. In Home Assistant, look at discovered devices.

## Firmware Variants

The Everything Presence Pro firmware is available in multiple variants covering each combination of network type
(WiFi or Ethernet), Bluetooth Proxy, and CO2 sensor support. The device can switch between variants directly from
Home Assistant using the built-in firmware update selectors — see the
[GitHub repository](https://github.com/EverythingSmartHome/everything-presence-pro) for all available variants.

## Configuration

```yaml url=https://github.com/EverythingSmartHome/everything-presence-pro/blob/main/everything-presence-pro-wifi-ble.yaml
```

## Support

- [Shop](https://shop.everythingsmart.io/products/everything-presence-pro)
- [Official Documentation](https://docs.everythingsmart.io/s/products/doc/everything-presence-pro-nh3fIXmow9)
- [GitHub](https://github.com/EverythingSmartHome/everything-presence-pro)
- [YouTube](https://www.youtube.com/@EverythingSmartHome)
- [Discord](https://discord.everythingsmarthome.co.uk/)
