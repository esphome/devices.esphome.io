---
title: Tuya 8-Zone Sprinkler Controller TY-W-8L (BK7231N/CBU)
date-published: 2026-07-15
type: misc
standard: global
board: bk72xx
project-url: https://github.com/gnacho/esphome-tuya-8zone-valve
difficulty: 4
---

Generic Tuya 8-zone irrigation controller with Beken BK7231N (CBU module).
PCB model TY-W-8L-AC-DZAK. Uses two independent 74HC595 shift registers for
LEDs and valves.

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

The BK7231N is flashed via UART with
[ltchiptool](https://github.com/libretiny-eu/ltchiptool). No soldering required
- dupont cables and a steady hand are enough.

### Connections (3.3V USB-TTL adapter)

```text
  USB-TTL Adapter            TY-W-8L-AC-DZAK Board
  ───────────────            ─────────────────────
       3.3V  ───────────────────►  3.3V
        GND  ───────────────────►  GND
         TX  ───────────────────►  RX
         RX  ◄───────────────────  TX
```

**CRITICAL WARNING**: **NEVER connect 3.3V from USB adapter and 24VAC at the
same time**. You can damage the board.

### Option A: 3.3V only (preferable if it works)

Connect all 4 dupont cables (3.3V, GND, TX, RX) as shown above. Try flashing
first with this setup.

### Option B: With 24VAC (if 3.3V doesn't work)

If Option A fails, disconnect the 3.3V cable and use the 24VAC transformer:

```text
  USB-TTL Adapter            TY-W-8L-AC-DZAK Board
  ───────────────            ─────────────────────
        GND  ───────────────────►  GND
         TX  ───────────────────►  RX
         RX  ◄───────────────────  TX

  24VAC Transformer          TY-W-8L-AC-DZAK Board
  ─────────────────          ─────────────────────
       24VAC ───────────────────►  AC IN (terminals)
```

In Option B, **DO NOT connect the 3.3V cable from the USB adapter**. Only GND,
TX and RX. The board generates its own 3.3V internally from the 24VAC.

### 1. Back up the original firmware first

Read the whole flash before writing anything. Once ESPHome is on the chip this is
the only copy of the original firmware left:

```bash
pip install ltchiptool
ltchiptool flash read bk7231n backup_original.bin
```

### 2. Compile the configuration

`config.yaml` holds the hardware definition and `sprinkler-zone-control.yaml` the
zone control application. Put both in the same file (append the second one to the
first, or pull it in with `packages:` and `!include`) and compile:

```bash
esphome compile config.yaml
```

The build leaves a UF2 image in
`.esphome/build/tuya-sprinkler-8z/.pioenvs/tuya-sprinkler-8z/firmware.uf2`.
On the ESPHome Dashboard use Install, Manual download, UF2 package instead.

### 3. Write the firmware

Enter download mode (bridge CEN/RST to GND while powering the board, then release
the bridge when the tool starts writing) and flash the compiled image:

```bash
ltchiptool flash write bk7231n firmware.uf2
```

ltchiptool only writes a compiled image, it does not compile ESPHome YAML, so pass
the UF2 file and not `config.yaml`.

## Button usage

### Navigation and zone selection

- **UP**: selects the next zone (LED blinks)
- **DOWN**: selects the previous zone (LED blinks)
- **SET**: confirms selection and activates the zone (LED stays solid)

If you don't press anything for **8 seconds**, the selection is automatically
cancelled.

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

Hardware definition (pinout, shift registers, valves, buzzer and panel LEDs):

```yaml file=config.yaml
```

Zone control application (selection state machine, panel buttons, LED feedback and
the `sprinkler` component). Append it to the hardware file before compiling:

```yaml file=sprinkler-zone-control.yaml
```

## Project repository

Full documentation, compiled firmware binaries, and source code available at
[github.com/gnacho/esphome-tuya-8zone-valve](https://github.com/gnacho/esphome-tuya-8zone-valve).
