---
title: ESP32-C6 SuperMini
date-published: 2026-11-24
type: misc
standard: global
board: esp32
difficulty: 2
---

![ESP32-C6 SuperMini](esp32-c6-super-mini.jpg "ESP32-C6 SuperMini")

## Overview

The ESP32-C6 SuperMini is a tiny USB-C development board with Wi-Fi 6,
Bluetooth 5 LE, and an 802.15.4 radio (Thread/Zigbee). It has 4MB flash,
22 GPIOs, battery pads with a charger, an onboard RGB LED and a status LED.

## GPIO Pinout

| Pin    | Function                                  |
| ------ | ----------------------------------------- |
| GPIO8  | WS2812 RGB LED (also a strapping pin)     |
| GPIO9  | BOOT button (also a strapping pin)        |
| GPIO15 | Status LED (also a strapping pin)         |
| GPIO12 | USB D- (avoid)                            |
| GPIO13 | USB D+ (avoid)                            |
| GPIO16 | UART TX                                   |
| GPIO17 | UART RX                                   |

Safest free pins: GPIO0-3, 14, 18-23.

## Flashing

The board has native USB and no serial chip. If it doesn't show up as a
port, hold **BOOT** while plugging in USB. Press **RESET** after flashing.

## Basic Configuration

```yaml file=config.yaml
```
