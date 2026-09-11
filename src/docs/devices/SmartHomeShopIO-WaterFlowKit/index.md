---
title: SmartHomeShopIO WaterFlowKit
date-published: 2026-04-16
type: sensor
standard: global
board: esp32
project-url: https://github.com/smarthomeshop/waterflowkit
made-for-esphome: true
difficulty: 1
---

![WaterFlowKit](waterflowkit-product-shop.png "WaterFlowKit")

## Description

The **WaterFlowKit** is an ESPHome-based water flow monitor for supported pulse-based flow sensors.
It measures **real-time flow rate**, **total water consumption**, and **water temperature**, and also includes
onboard **temperature** and **humidity** sensing with the **HDC1080**.

It is designed for fully local use with **ESPHome** and **Home Assistant**, with onboarding through
**captive portal**, **Improv BLE**, or **Improv Serial** where supported, and supports **HTTP OTA** firmware updates.

### Features

- Real-time **flow rate** and **total consumption**
- **Water temperature** monitoring per flow input
- Built-in **HDC1080** temperature and humidity sensing
- Support for multiple **YF-series** pulse flow sensors with calibration options
- **Wi-Fi** and **Ethernet** firmware variants depending on hardware revision
- **HTTP OTA** firmware update support
- Fully **local** and **open source**

### Specifications

- MCU:
  - **V1**: ESP32
  - **V2**: ESP32-C6
- Flow inputs:
  - **V1**: 2
  - **V2**: 4
- Connectivity:
  - **V1**: Wi-Fi
  - **V2**: Wi-Fi and Ethernet
- Sensors: **HDC1080** temperature and humidity
- Firmware: **ESPHome**

## Variants

- **WaterFlowKit V1 WiFi** — ESP32 based hardware with 2 flow inputs
- **WaterFlowKit V2 WiFi** — ESP32-C6 based hardware with 4 flow inputs
- **WaterFlowKit V2 Ethernet** — ESP32-C6 based hardware with wired Ethernet support

## Supported Flow Sensors

- **YF-B1 / YF-B7**
- **YF-B5 / YF-B6**
- **YF-B10**
- **YF-DN40-S**
- **YF-DN50-S**

## Quickstart

1. Connect power and wire the flow sensors.
2. Flash the desired firmware with the web flasher or ESPHome.
3. Onboard the device using the fallback hotspot, **Improv BLE**, or **Improv Serial** where supported.
4. Adopt the device in **Home Assistant** / **ESPHome**.
5. Select the connected flow sensor type and calibrate if needed.

Please check our [full documentation and Quick Start Guide](https://smarthomeshop.io/quick-start-waterflowkit)
and the [product page](https://smarthomeshop.io/waterflowkit) for supported flow sensor details.

## V1 Configuration

```yaml url=https://github.com/smarthomeshop/waterflowkit/blob/main/waterflowkit-v1/waterflowkit-wifi.yaml
```

## V2 Configuration

```yaml url=https://github.com/smarthomeshop/waterflowkit/blob/main/waterflowkit-v2/waterflowkit-wifi.yaml
```

## Links

- [Shop](https://smarthomeshop.io/waterflowkit)
- [GitHub](https://github.com/smarthomeshop/waterflowkit)
- [Firmware](https://smarthomeshop.io/en/firmware)
- [Quick Start Guide](https://smarthomeshop.io/quick-start-waterflowkit)
- [Discord](https://smarthomeshop.io/discord)

## Product Images

| Product view                                | In the box                                  |
| ------------------------------------------- | ------------------------------------------- |
| ![Product view](waterflowkit-product-shop.png) | ![In the box](waterflowkit-whatsinthebox-shop.png) |
