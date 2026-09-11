---
title: "Levoit Vital 200S"
date-published: 2026-09-11
type: misc
standard: eu, us, uk
board: esp32
difficulty: 3
project-url: https://github.com/tuct/levoit/tree/main/devices/levoit-vital200s
---

## Description

A smart air purifier with four fan speeds, a PM1003 particulate sensor and a Pet
preset, rated at 415 m³/h. The Wi-Fi module and the purifier's own control MCU are
separate chips joined by a 115200 8N1 UART link, so flashing ESPHome onto the stock
Wi-Fi ESP32 keeps every hardware function working — the
[`levoit`](https://github.com/tuct/levoit/tree/main/components/levoit) external
component speaks the MCU's binary protocol.

Tested against MCU firmware 1.0.5. The stock module is an ESP32-C3-SOLO-1.

The Vital 200S and the Vital 200S Pro are the same device as far as the component is
concerned — both use `model: VITAL200S`.

Manufacturer: [Levoit](https://www.levoit.com)

## Features

* Fan with 4 speeds and Manual / Auto / Sleep / Pet presets
* Auto Mode select — Default / Quiet / Efficient
* Auto Mode Room Size number (9–87 m²)
* Efficiency counter sensor and a remaining high-fan-time text sensor for Efficient mode
* Display, Child Lock and Light Detect switches — the last auto-dims the display in the dark
* PM2.5 and AQI sensors
* Current CADR sensor in m³/h, updated every 5 s
* Filter life remaining sensor and a Filter Low binary sensor that trips under 5 %
* Configurable filter lifetime in months, with a counter reset button
* Run timer in minutes
* MCU firmware version and error-status text sensors

## Flashing

The stock ESP32 is flashed over its UART pads. The device
[guide](https://github.com/tuct/levoit/tree/main/devices/levoit-vital200s) covers that
path end to end — prerequisites, backing up the stock firmware, flashing, using the
ESPHome web builder or dashboard, and restoring the original image if you want to go
back.

Take a backup of the stock firmware before writing anything over it; the guide's
restore steps depend on having it.

The teardown steps, the debug-header pinout and the wiring for a replacement ESP32 are
not documented for this model yet. The case opens much like the
[Vital 100S](/devices/levoit-vital-100s/), which is worth reading first, but treat the
specifics as unverified on the 200S.

## Basic Configuration

> The configuration below is hardware-only, which is what this site's pages carry.
> It has no `wifi:` credentials and no `api:` or `ota:` blocks, so add your own before
> flashing — without them the device will not reach Home Assistant or accept OTA
> updates.

```yaml file=config.yaml
```

## Details and instructions

Full teardown, PCB photos, wiring and the complete entity list:
[tuct/levoit — Levoit Vital 200S](https://github.com/tuct/levoit/tree/main/devices/levoit-vital200s).
