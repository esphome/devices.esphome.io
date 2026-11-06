---
title: Levoit's Core 400s 
date-published: 2025-12-20
type: misc
standard: eu, us, uk
board: esp32
made-for-esphome: False
difficulty: 4
---

## Features

* Fan component with modes (Manual, Auto, Sleep)
* Display current and avg CFM value
* Filter life time
  * Tracking based on current CFM value
  * Configurable via Home Assistant (1-12 Months)
  * Reset via Home Assistant
* Display run time in Home Assistant

## General Notes

A smart air purifier with 4-stage filtration. The ESP32 talks to the Tuya MCU using standard 8N1 115200-baud UART. Code
and configuration were obtained from
[Tuct's 'esphome-projects' repo](https://github.com/tuct/esphome-projects/tree/main/projects/levoit-core400s).

Manufacturer: [Levoit](http://www.levoit.com)

## Details and instructions

[Tuct's 'esphome-projects' repo](https://github.com/tuct/esphome-projects/tree/main/projects/levoit-core400s).
