---
title: "Levoit Everest Air"
date-published: 2026-09-11
type: misc
standard: eu, us, uk
board: esp32
difficulty: 3
project-url: https://github.com/tuct/levoit/tree/main/devices/levoit-everest-air
---

## Description

Levoit's flagship purifier — 612 m³/h CADR, a 3-channel particulate sensor reporting
PM1.0, PM2.5 and PM10, and a motorised vent louver. The Wi-Fi module and the
purifier's own control MCU are separate chips joined by a 115200 8N1 UART link, so
flashing ESPHome onto the stock Wi-Fi ESP32 keeps every hardware function working —
the [`levoit`](https://github.com/tuct/levoit/tree/main/components/levoit) external
component speaks the MCU's binary protocol.

Tested against MCU firmware 1.0.2. The stock module is an ESP32-SOLO-1.

Manufacturer: [Levoit](https://www.levoit.com)

## Features

* Fan with 3 manual speeds and Manual / Auto / Sleep / Turbo presets
* Auto Mode select — Default / Eco
* Vent Angle number — the motorised louver, 45–90°
* Cover Open binary sensor — the unit powers off while the back door is open
* Display, Child Lock and Light Detect switches — the last auto-dims the display in the dark
* PM1.0, PM2.5, PM10 and AQI sensors
* Current CADR sensor in m³/h, updated every 5 s
* Filter life remaining sensor and a Filter Low binary sensor that trips under 5 %
* Configurable filter lifetime in months, with a counter reset button
* Run timer in minutes
* MCU firmware version text sensor

## Flashing

Three screws in the top get you to the control board. The device
[guide](https://github.com/tuct/levoit/tree/main/devices/levoit-everest-air) covers
the teardown, the UART test points, and the alternative of wiring in a replacement
ESP32 rather than reflashing the original.

### GPIO Pinout

The UART mapping below follows the original ESP32-SOLO-1. Verify it against your own
board before flashing.

| ESPHome pin | Test point | Function |
|-------------|-----------|----------|
| `GPIO16` | `TP82` | UART RX — MCU TX to ESP RX |
| `GPIO17` | `TP33` | UART TX — ESP TX to MCU RX |

Baud rate is 115200 8N1.

Take a backup of the stock firmware before writing anything over it.

## Basic Configuration

> The configuration below is hardware-only, which is what this site's pages carry.
> It has no `wifi:` credentials and no `api:` or `ota:` blocks, so add your own before
> flashing — without them the device will not reach Home Assistant or accept OTA
> updates.

```yaml file=config.yaml
```

## Details and instructions

Full teardown, PCB photos, wiring and the complete entity list:
[tuct/levoit — Levoit Everest Air](https://github.com/tuct/levoit/tree/main/devices/levoit-everest-air).
