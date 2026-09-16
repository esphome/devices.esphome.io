---
title: ESP32 Trinity
date-published: 2026-08-12
type: misc
standard: global
board: esp32
difficulty: 2
made-for-esphome: false
project-url: https://github.com/witnessmenow/ESP32-Trinity
---

## Description

The [ESP32 Trinity](https://esp32trinity.com/) is an open-source ESP32 board built specifically for driving HUB75
RGB LED matrix panels. It is the work of Brian Lough (witnessmenow).

- ESP32-WROVER-E with 4&nbsp;MB PSRAM
- HUB75 output header wired directly to the panel connector, so there is no hand-wiring
- Screw terminals for 5&nbsp;V panel power, with the board able to run from the same supply
- Two buttons, a Qwiic/STEMMA connector and a microSD slot
- USB-C for power and flashing

## Setup

1. Connect the HUB75 ribbon cable from the panel to the Trinity's output header.
2. Feed 5&nbsp;V into the screw terminals — a matrix panel draws far more current than USB can supply.
3. Flash the configuration below, adjusting `panel_width` and `panel_height` to match your panel.

## Configuration

The `hub75` display platform ships a **board preset for the Trinity**, so `board: esp32-trinity` supplies the
entire pinout and no pins need listing. The example below draws a clock from SNTP as a minimal proof that the
panel is scanning correctly.

```yaml file=config.yaml
```

For reference, the preset resolves to R1 `GPIO25`, G1 `GPIO26`, B1 `GPIO27`, R2 `GPIO14`, G2 `GPIO12`,
B2 `GPIO13`, A `GPIO23`, B `GPIO19`, C `GPIO5`, D `GPIO17`, E `GPIO18`, LAT `GPIO4`, OE `GPIO15`, CLK `GPIO16`.

## Notes

- **Using the board preset removes the most common cause of a garbled panel.** Hand-wired HUB75 builds usually
  fail on the address lines: get C, D or E wrong and the panel renders in duplicated bands rather than showing
  nothing, which reads like a broken panel rather than a wiring fault. On a 64×64 panel the E line matters — a
  32-row panel does not use it, so a pinout copied from a 64×32 build will look like it works and then double
  every four rows.
- **Some panels need `shift_driver: FM6126A`.** Those panels stay dark or show badly wrong colours until the
  driver chip is initialised. If your panel does nothing with an otherwise correct configuration, that setting is
  the first thing to try.
- Power the panel from its screw terminals, not from the USB connector. A 64×64 panel at full white can pull
  several amps.
