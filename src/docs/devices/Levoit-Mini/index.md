---
title: Levoit's Mini - Smartified
date-published: 2025-12-20
type: misc
standard: eu, us, uk
board: esp32
made-for-esphome: False
difficulty: 4
project-url: https://github.com/tuct/levoit/tree/main/devices/levoit-mini
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

An air purifier with 3-stage filtration.

This project requires a custom PCB and 3D printed parts to convert the Levoit Mini
into a Levoit Mini-S (smartified version). The original PCB is bypassed rather than
modified, so the change is reversible.

Manufacturer: [Levoit](http://www.levoit.com)

More details and instructions can be found here:

[Tuct's 'levoit' repo](https://github.com/tuct/levoit/tree/main/devices/levoit-mini).
