---
title: "Philips Series 600 Air Purifier"
date-published: 2026-09-11
type: misc
standard: eu, uk
board: esp32
made-for-esphome: False
difficulty: 4
project-url: https://github.com/tuct/levoit/tree/main/devices/philips-600-series
alias:
  - Philips-AC0650
  - Philips-AC0651
  - MUJI-Air-Purifier
---

## Description

A compact air purifier manufactured by Philips / Versuni and sold under the MUJI
brand. It comes in two builds that speak an identical protocol: a base model with
just fan and filters, and a sensor model that adds a PM1003 particulate sensor, an
allergen index and an Auto fan preset.

As with the Levoit units, the Wi-Fi module and the purifier's control MCU are
separate chips on a 115200 8N1 UART link. The difference is that the stock module
cannot be reflashed — it is an ESP32-C3-WROOM-02U with secure boot enabled and
enforced. The conversion is therefore to wire in your own ESP32-C3 on the same UART
and park the original module by holding its `EN` pin low. Nothing is removed, so the
change is fully reversible.

The [`philips`](https://github.com/tuct/levoit/tree/main/components/philips) external
component implements the MCU's `FE FF` framed binary protocol.

Tested against MCU firmware 0.1.9 and 0.2.1.

Manufacturer: [Philips](https://www.philips.com) / [Versuni](https://www.versuni.com)

![Philips Series 600 air purifier](./overview.jpg "Philips Series 600 air purifier")

## Features

* Fan — on/off plus 3 speeds (Sleep / Medium / Turbo), with an Auto preset on the sensor model
* Pre-filter and HEPA filter life sensors, in % remaining
* Reset buttons for the pre-filter and HEPA counters
* MCU firmware version text sensor
* PM2.5 sensor and allergen index, 1–12, on the sensor model
* Standby sensor monitoring switch on the sensor model — keeps the particulate
  sensor running while the unit is in standby

## Wiring

> **Unplug the unit before touching the PCB.** This is a mains appliance and part of
> the control board sits on the mains side. Do all of the soldering below with the
> purifier disconnected from the wall.

The stock module cannot be reflashed, so an ESP32-C3 of your own goes on the MCU UART
alongside it. A Seeed XIAO ESP32-C3 fits the space well.

Four wires — `+5V`, `GND`, `RX`, `TX`. The RX/TX points are test pads near the
original module, not the pin header. Pull the original module's `EN` pin to `GND` so
it stops driving the bus, otherwise the two modules collide.

The `+5V` pad carries 5 V, so it must go to a **regulated 5 V input** — the `5V`
(VBUS) pad on a XIAO ESP32-C3, which feeds the board's onboard regulator. Never
connect it to a `3V3` pin: 5 V on a 3.3 V rail will destroy the module. If your board
has no 5 V input, add your own 3.3 V regulator instead.

The device
[guide](https://github.com/tuct/levoit/tree/main/devices/philips-600-series) has
photographs of the teardown, the pads, and the `EN`-to-`GND` link.

## Basic Configuration

> The configuration below is hardware-only, which is what this site's pages carry.
> It has no `wifi:` credentials and no `api:` or `ota:` blocks, so add your own before
> flashing — without them the device will not reach Home Assistant or accept OTA
> updates.

```yaml file=config.yaml
```

## Sensor Model

On the sensor-equipped build, change `model: AC0650` to `model: AC0651` in the
`philips:` block of `config.yaml` — that alone adds the Auto fan preset.

Then add the entities below. The two sensors are **merged into the `sensor:` list
that `config.yaml` already has** — do not append a second top-level `sensor:` key, or
it will replace the base filter sensors rather than add to them. `config.yaml` has no
`switch:` block, so the standby-sensor switch is added as a **new top-level `switch:`
block**.

```yaml file=sensor-model.yaml
```

## Details and instructions

Full teardown, PCB photos, wiring and protocol notes:
[tuct/levoit — Philips 600 series](https://github.com/tuct/levoit/tree/main/devices/philips-600-series).
