---
title: Athom 2CH Relay Board (R2-ESP)
date-published: 2024-11-01
type: relay
standard: global
board: esp32
project-url: https://github.com/athom-tech/esp32-configs/blob/main/athom-2ch-relay-board.yaml
difficulty: 1
made-for-esphome: true
---

![alt text](athom-2ch-relay.webp "Athom 2CH Relay Board - R2-ESP")

Maker: [https://www.athom.tech/](https://www.athom.tech/)
Product page: [https://www.athom.tech/blank-1/2ch-inching-self-lock-relay-for-esphome](https://www.athom.tech/blank-1/2ch-inching-self-lock-relay-for-esphome)

Also on Aliexpress, available pre-flashed with ESPHome or Tasmota.

## Description

A 2-relay board with an ESP32-WROOM-32E.

Built-in RF433 receiving module

Onboard buttons to control each relay

Built-in CH340 serial port chip, can realize arbitrary programming

Each relay has COM/NO/NC terminals and is rated for a 10A max load.

The board can be powered either via 7-30 VDC or 5 VDC (separate terminals and Type-C).

## GPIO Pinout

| Pin    | Function |
| ------ | -------- |
| GPIO36 | Button1  |
| GPIO39 | Button2  |
| GPIO27 | Relay1   |
| GPIO14 | Relay2   |
| GPIO15 | Led      |
| GPIO16 | RF33     |

## Configuration

```yaml url=https://github.com/athom-tech/esp32-configs/blob/main/athom-2ch-relay-board.yaml
```
