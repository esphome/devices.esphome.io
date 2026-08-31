---
title: "Johnson JN52N Air Conditioner (TYWE1S, TCL protocol)"
date-published: 2026-07-28
type: misc
standard: global
board: esp8266
made-for-esphome: false
difficulty: 3
---

## Product Description

Split air conditioner sold as Johnson JN52N (TCL-based, also found under other brand names).
Its WiFi module is a Tuya **TYWE1S** (ESP8266EX, 2 MB flash), but the unit does **not** use the
Tuya MCU protocol: the module talks to the indoor unit over UART using the **proprietary TCL
protocol** (frames starting with `0xBB`, 9600 baud, EVEN parity), so neither the `tuya:` nor the
`midea:` ESPHome components work with it.

Flashing the TYWE1S with ESPHome plus the community
[TCL climate component](https://github.com/gnacho/esphome-tcl-ac) gives full local control:
modes (cool/heat/dry/fan/auto), presets (eco/sleep/boost), fan speeds, motorized vertical and
horizontal swing, beep on/off and ambient temperature.

## Product Images

![Johnson JN52N datasheet](datasheet.jpg "Johnson JN52N datasheet")
![Back of the WiFi board](pcb-back.jpg "Back of the WiFi board: flashing pins are labeled")
![TYWE1S module](module.jpg "Front of the board with the TYWE1S module")

## Flashing

The TYWE1S is flashed like any ESP8266 with `esptool`:

1. With the AC **unplugged from mains**, connect a USB-to-UART adapter to the labeled flashing
   pins on the back of the board: **3V3, GND, TX, RX**. Dupont cables held firmly in place work;
   no soldering needed.
2. Bridge **GPIO0 to GND** and power up the board to enter download mode.
3. Back up the stock firmware first: `esptool.py --port /dev/ttyUSB0 read_flash 0x0 0x200000 backup.bin`
   (the dump must be exactly 2097152 bytes).
4. Flash ESPHome: `esptool.py --port /dev/ttyUSB0 write_flash 0x0 firmware.bin`.

**Warning: this device works with mains voltage. Take all necessary precautions.**

## GPIO Pinout

| Pin    | Function                    |
| ------ | --------------------------- |
| GPIO15 | UART TX (to AC indoor unit) |
| GPIO13 | UART RX (from AC unit)      |

## Basic Configuration

The config below exposes the climate entity (modes, presets, fan speeds and per-axis swing
on/off). Extras like the beep switch, swing position selects and ambient temperature sensor
are template entities wired to the component's methods — see the full example in the
component repository linked below.

```yaml file=config.yaml
```

## Links

- [Full firmware, TCL climate component and precompiled binary](https://github.com/gnacho/esphome-tcl-ac)
- [Original TCL AC component this fork is based on](https://github.com/Kannix2005/esphome-tcl-ac)
