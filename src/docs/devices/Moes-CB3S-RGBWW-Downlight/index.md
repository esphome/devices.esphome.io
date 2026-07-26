---
title: "Moes CB3S RGBWW Downlight"
date-published: 2026-07-25
type: light
standard: global
board: bk72xx
made-for-esphome: false
difficulty: 4
---

## Product Description

Recessed RGBWW (RGB + cold/warm white) downlight sold by Moes and other Tuya-based brands,
commonly found on AliExpress in two sizes (145 mm and 115 mm diameter).
Both sizes use the same board and the same firmware.

It is mains powered (220 V) and carries a Tuya CB3S module with a Beken BK7231N SoC.
The module is hidden under a metal shield with no chip name printed on the enclosure or the PCB,
so the shield has to be removed to identify it.

A capacitive touch button on the front cover toggles the light.

## Product Images

![Moes CB3S RGBWW Downlight](product.png "Moes CB3S RGBWW Downlight")
![CB3S module with shield removed](pcb-chip.jpg "Beken BK7231N visible after removing the shield")
![UART flashing wiring](wiring.jpg "Wires soldered to the CB3S UART pads: GND, RX, TX")

## Flashing

The CB3S module has no USB to serial chip, so the downlight has to be disassembled and
flashed via UART with [ltchiptool](https://docs.libretiny.eu/docs/flashing/tools/ltchiptool/).

Things to keep in mind with Beken chips:

1. Bridge the CEN pin to GND before powering the chip, and remove the bridge before the writing starts.
2. The chip needs a stable 3.3 V supply. If your USB-UART adapter cannot provide it, flashing will fail.
   You can power it from an external 3.3 V supply or power the downlight itself from mains.
   **If you power it from mains, do NOT connect the 3.3 V line of the USB-UART adapter.**
   Only GND, RX and TX go to the adapter.
3. An order that works: power up the board, plug in the USB adapter, launch the flash command,
   wait a few seconds, then remove the CEN-to-GND bridge.

**Warning: this device works with mains voltage. Take all necessary precautions.**

## GPIO Pinout

| Pin | Function        |
| --- | --------------- |
| P8  | Red PWM         |
| P24 | Green PWM       |
| P26 | Blue PWM        |
| P7  | Cold white PWM  |
| P6  | Warm white PWM  |
| P14 | Touch button    |

Pin naming on Beken chips is `P6`, `P7`, `P8`..., not `GPIOxx`.
If the colors do not match on your unit, flash a diagnostic firmware with one monochromatic
light per candidate PWM pin and toggle them one by one to find the real mapping.

## Basic Configuration

```yaml file=config.yaml
```

## Links

- [CB3S pinout and documentation (LibreTiny)](https://docs.libretiny.eu/boards/cb3s/)
- [Full flashing story and photos](https://github.com/gnacho/esphome-moes-downlight-cb3s)
