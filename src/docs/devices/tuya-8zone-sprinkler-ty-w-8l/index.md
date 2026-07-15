---
title: Tuya 8-Zone Sprinkler Controller TY-W-8L (BK7231N/CBU)
date-published: 2026-07-15
type: misc
standard: global
board: bk72xx
project-url: https://github.com/gnacho/esphome-tuya-8zone-valve
difficulty: 4
---

Generic Tuya 8-zone irrigation controller with Beken BK7231N (CBU module). PCB model TY-W-8L-AC-DZAK. Uses two independent 74HC595 shift registers for LEDs and valves.

## Hardware

- **SoC**: Beken BK7231N (CBU module)
- **PCB**: TY-W-8L-AC-DZAK rev 24.9.19
- **Shift registers**: 2x 74HC595 independent (not cascaded)
  - LED SR (U2): data P9, clock P15, latch P17
  - Valve SR (U3): data P16, clock P22, latch P20
- **Buzzer**: P14
- **WiFi LED**: P28
- **Touch buttons**: UP (P6), DOWN (P7), SET (P8)
- **Power**: 24 VAC

## Installation

The BK7231N is flashed via UART with [ltchiptool](https://github.com/libretiny-eu/ltchiptool). No soldering required — dupont cables and a steady hand are enough.

### Connections (3.3V USB-TTL adapter)

```
  USB-TTL Adapter            TY-W-8L-AC-DZAK Board
  ───────────────            ─────────────────────
       3.3V  ───────────────────►  3.3V
        GND  ───────────────────►  GND
         TX  ───────────────────►  RX
         RX  ◄───────────────────  TX
```

**CRITICAL WARNING**: **NEVER connect 3.3V from USB adapter and 24VAC at the same time**. You can damage the board.

**Option A: 3.3V only (preferable if it works)**

Connect all 4 dupont cables (3.3V, GND, TX, RX) as shown above. Try flashing first with this setup.

**Option B: With 24VAC (if 3.3V doesn't work)**

If Option A fails, disconnect the 3.3V cable and use the 24VAC transformer:

```
  USB-TTL Adapter            TY-W-8L-AC-DZAK Board
  ───────────────            ─────────────────────
        GND  ───────────────────►  GND
         TX  ───────────────────►  RX
         RX  ◄───────────────────  TX

  24VAC Transformer          TY-W-8L-AC-DZAK Board
  ─────────────────          ─────────────────────
       24VAC ───────────────────►  AC IN (terminals)
```

In Option B, **DO NOT connect the 3.3V cable from the USB adapter**. Only GND, TX and RX. The board generates its own 3.3V internally from the 24VAC.

### Flashing process

1. Connect the dupont cables to the board
2. Power the board (3.3V or 24VAC as described above)
3. Enter download mode: briefly touch RST to GND (a couple of quick taps)
4. Immediately run the flash command:

```bash
pip install ltchiptool
ltchiptool flash write bk7231n config.yaml
```

### Backup original firmware (recommended)

```bash
ltchiptool flash read bk7231n backup_original.bin
```

## Button usage

### Navigation and zone selection

- **UP**: selects the next zone (LED blinks)
- **DOWN**: selects the previous zone (LED blinks)
- **SET**: confirms selection and activates the zone (LED stays solid)

If you don't press anything for **8 seconds**, the selection is automatically cancelled.

### Activate a single zone

1. Press UP or DOWN until the desired zone LED blinks
2. Press SET → the zone activates (solid LED)
3. To stop it: navigate to that zone and press SET again

### Activate all zones (full cycle)

1. Hold **UP** for **4 seconds** until all LEDs blink
2. Press SET → all 8 zones activate in full cycle (3 confirmation beeps)

### Stop all irrigation

1. Hold **DOWN** for **4 seconds** until all LEDs blink
2. Press SET → all zones close (3 confirmation beeps)

## Basic Configuration

```yaml file=config.yaml
```

## Project repository

Full documentation, compiled firmware binaries, and source code available at [github.com/gnacho/esphome-tuya-8zone-valve](https://github.com/gnacho/esphome-tuya-8zone-valve).
