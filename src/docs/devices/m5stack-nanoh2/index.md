---
title: "M5Stack NanoH2"
date-published: 2026-09-11
type: misc
standard: global
board: esp32
difficulty: 2
project-url: https://docs.m5stack.com/en/core/NanoH2
---

## Description

NanoH2 is an ultra-compact, USB-C powered IoT devkit in the M5Stack Nano series, built around the
ESP32-H2. Unlike the Wi-Fi based NanoC6, the H2 variant has no Wi-Fi radio — it exposes an IEEE
802.15.4 radio instead, for Zigbee, Thread and Matter-over-Thread use cases. The board also has an
onboard RGB LED, a blue status LED, an IR transmitter, a user button, and a Grove port for
expansion.

## GPIO Pinout

| Pin    | Function              |
| ------ | --------------------- |
| GPIO3  | IR transmitter        |
| GPIO4  | Status LED (blue)     |
| GPIO9  | Button                |
| GPIO10 | RGB LED power enable  |
| GPIO11 | RGB LED (WS2812) data |
| GPIO1  | Grove port (yellow)   |
| GPIO2  | Grove port (white)    |

## Basic Configuration

```yaml file=config.yaml
```
