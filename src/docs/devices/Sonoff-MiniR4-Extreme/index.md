---
title: Sonoff Mini R4 Extreme
date-published: 2023-12-01
type: relay
standard: global
board: esp32
made-for-esphome: false
difficulty: 2
---

![Sonoff MiniR4 Extreme](sonoff-mini-r4.jpg "Product Image")

Advertised as Smallest Wi-Fi Smart Switch Ever, with one relay, one external input, one button. Switch is really small,
approx 40x30mm, easily fits behind wall switch.

Product page:
[https://sonoff.tech/product/diy-smart-switches/minir4/](https://sonoff.tech/product/diy-smart-switches/minir4/)

## Features

Detected with esptool:

```bash
# esptool.py v4.6.2
# Detecting chip type... ESP32
# Chip is ESP32-D0WD-V3 (revision v3.0)
# Features: WiFi, BT, Dual Core, 240MHz, VRef calibration in efuse, Coding Scheme None
# Crystal is 40MHz
# Detected flash size: 4MB
```

## Programming

### Over-the-air flashing

Devices running stock 1.2.0 firmware can be flashed over-the-air using [minir4-ota](https://github.com/d0tkom/minir4-ota).

### Serial flashing

Serial flashing need disassembly (easy) and moderate soldering skills to attach USB-RS232 converter cables.
Pins are very easy to find as they are lebelled, but due to small size they are quite hard to solder.

![Sonoff MiniR4 Extreme](view_top.jpg "Top View")
![Sonoff MiniR4 Extreme](view_side.jpg "Top View")
![Sonoff MiniR4 Extreme](wires_angle.jpg "Top View")

Rx, Tx, Gnd available on ESP module,
Vcc (3V3) on main board, pad is covered with some protecting coating - needs to be scratched, very subtly, for solder to
cover it.

In order to enter programming mode need to hold button pressed while enabling power supply.
Bootloader uses 76800 baud rate, once application is started 115200 is used.

Programming can be done with esptool or directly through ESPHome (I'm using docker image)

## GPIO Pinout

| Pin    | Function                   |
|--------|----------------------------|
| GPIO00 | BUTTON                     |
| GPIO01 | likely TX (not tested)     |
| GPIO03 | likely RX (not tested)     |
| GPIO19 | blue LED                   |
| GPIO26 | Relay output               |
| GPIO27 | S2 (external switch input) |
| GND    | S1 (external switch input) |

## Basic Config with light

```yaml file=config.yaml
```
