---
title: ESP32_Relay_X4_Modbus_v1.3
date-published: 2025-09-20
type: relay
standard: global
board: esp32
difficulty: 2
---

## Product Description

This is a 4-relay board, having 4 binary inputs and an RS485 interface based on ESP32. The inputs are optoisolated (mine
came with TLP785GB with 4.7k resistors on inputs, making it safe to operate them around max 24V), with a common ground,
independent from the board's main ground. The RS485 transceiver is a SP3485E. Connectors are detachable.

[Manufacturer documentation](http://www.chinalctech.com/cpzx/Programmer/Relay_Module/898.html)

I bought it from [AliExpress](https://www.aliexpress.com/item/1005008876629425.html).

## Product Images

![ESP32_Relay_X4_Modbus_v1.3](esp32_relay_x4_modbus_v1_3.png "ESP32_Relay_X4_Modbus_v1.3")

## GPIO Pinout

According to [Tasmota discussion](https://github.com/arendst/Tasmota/discussions/24404):

Function / Signal | ESP32 GPIO | ESP32 QFN Pin | Direction | Connected Hardware / Notes
------------------|------------|---------------|-----------|----------------------------
**RS485 TX** | **GPIO19** | **Pin 31** | Output | UART TX -> SP3485 DI
**RS485 RX** | **GPIO18** | **Pin 30** | Input | UART RX <- SP3485 RO
**RS485 Driver Enable** | **GPIO32** | **Pin 8** | Output | SP3485 DE
**RS485 Receiver Enable** | **GPIO32** | **Pin 8** | Output | SP3485 RE (active LOW)
Relay 1 | GPIO23 | Pin 37 | Output | Relay output 1
Relay 2 | GPIO5 | Pin 29 | Output | Relay output 2
Relay 3 | GPIO4 | Pin 26 | Output | Relay output 3
Relay 4 | GPIO13 | Pin 15 | Output | Relay output 4
Digital Input 1 | GPIO25 | Pin 10 | Input | IN1
Digital Input 2 | GPIO26 | Pin 11 | Input | IN2
Digital Input 3 | GPIO27 | Pin 12 | Input | IN3
Digital Input 4 | GPIO33 | Pin 9 | Input | IN4
Status LED | GPIO15 | Pin 23 | Output | Usually inverted
PAD_TX2 | GPIO17 | Pin 28 | .. | no PSRAM
PAD_RX2 | GPIO16 | Pin 27 | .. | no PSRAM
PDAD_G12 | GPIO12 | .. | .. | ..
PDAD_G14 | GPIO14 | .. | .. | ..
PDAD_G21 | GPIO21 | .. | .. | ..
PDAD_G22 | GPIO22 | .. | .. | ..

All pins are inverted. It also exposes GPIOs 12, 14, 21, 22 labeled appropriately on the board.

## Basic Config

```yaml file=config.yaml
```
