---
title: "GeekMagic Ultra"
date-published: 2026-05-27
type: misc
standard: global
board: esp8266
project-url: https://www.aliexpress.com//item/1005011742070248.html
made-for-esphome: false
difficulty: 2
---

## Product Description

The GeekMagic Ultra is an LCD display designed to look like a mini computer.

It is USB-C powered and has an ESP8266 inside.

The LCD panel has a 28x28mm size resulting in a 240x240 pixel resolution.

## Product Images

![GeekMagic Ultra](GeekMagic_Ultra.png "GeekMagic Ultra")

## Flash ESPHome

Flashing the device can be done in 2 different ways.

### 1. Upload .bin file (using original firmware)(easiest)

The original firmware comes with the option to upload a custom .bin file.
This can be done by connecting to the device's access point over Wi-Fi.
Open a browser and navigate to the IP address displayed on the screen of the device.
Find the "Firmware update" section in the web interface and upload your .bin file.
The .bin file can be generated with ESPHome Device Builder using the correct config below.

### 2. Manual flashing via Serial (Disassembly needed)

If the first option is not usable for you, you can always flash the device manually by disassembling it first.
Unscrew the 2 screws at the bottom of the device and slide the plastic casing open from the back of the device.
Because this device doesn't have a USB to serial chip, we need to connect some wires to it in order to flash it.

Pinout:

![GeekMagic Ultra Pinout](GeekMagic_Ultra_Pinout.png "GeekMagic Ultra Pinout")

**Note:** To enter flash mode, GPIO0 must be pulled to GND during power-up.

## Basic Configuration

**NOTE:**
LVGL is not supported on this model due to the small memory size of the board,
but it is supported on the GeekMagic Pro model (with ESP32 inside).
As of now, displaying content on the screen is limited to the use of custom lambdas.

```yaml file=config.yaml
```
