---
title: "Levoit Core 600S"
date-published: 2026-09-11
type: misc
standard: eu, us, uk
board: esp32
difficulty: 4
project-url: https://github.com/tuct/levoit/tree/main/devices/levoit-core600s
---

## Description

The largest of the Levoit Core range — 641 m³/h CADR, four fan speeds and four
distinct auto profiles, with air quality from a Luftme LD15 sensor. The Wi-Fi module
and the purifier's own control MCU are separate chips joined by a 115200 8N1 UART
link, so flashing ESPHome onto the stock Wi-Fi ESP32 keeps every hardware function
working — the
[`levoit`](https://github.com/tuct/levoit/tree/main/components/levoit) external
component speaks the MCU's binary protocol.

Tested against MCU firmware 2.0.1.

Check which module your unit has before flashing. Retail Core 600S units have been
seen with different ESP32s; the configuration below is for the ESP32-SOLO-1C, and a
C3-based unit needs the matching `esp32:` block instead.

Manufacturer: [Levoit](https://www.levoit.com)

## Features

* Fan with 4 speeds and Manual / Auto / Sleep presets
* Auto Mode select — Default / Quiet / Room Size / ECO
* Auto Mode Room Size number, 9–147 m²
* Display, Child Lock and Light Detect switches — the last auto-dims the display in the dark
* PM2.5 and AQI sensors
* Current CADR sensor in m³/h, updated every 5 s
* Filter life remaining sensor and a Filter Low binary sensor that trips under 5 %
* Configurable filter lifetime in months, with a counter reset button
* Run timer in minutes
* MCU firmware version and error-status text sensors

## Flashing

Disassembly is the most involved of the Levoit range: the fan assembly has to come
out through the handles to reach the control board. The device
[guide](https://github.com/tuct/levoit/tree/main/devices/levoit-core600s) has
annotated photos of every step, the UART pads, and the alternative of wiring in a
replacement ESP32 rather than reflashing the original.

Take a backup of the stock firmware before writing anything over it.

## Basic Configuration

```yaml file=config.yaml
```

## Details and instructions

Full teardown, PCB photos, wiring and the complete entity list:
[tuct/levoit — Levoit Core 600S](https://github.com/tuct/levoit/tree/main/devices/levoit-core600s).
