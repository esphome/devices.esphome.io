---
title: Shelly Plus Uni
date-published: 2026-07-31
type: sensor
standard: global
board: esp32
difficulty: 2
---

![Shelly Plus Uni PCB](shelly-plus-uni-uart.png "Shelly Plus Uni PCB with UART header (J13) pinout")

## Resources

- [Shelly Plus Uni Knowledge Base](https://kb.shelly.cloud/knowledge-base/shelly-plus-uni)

## Notes

The Shelly Plus Uni (model SNSN-0043X) is a universal I/O module based on the
ESP32-U4WDH (single-core, 160MHz, 4MB embedded flash). It is the ESP32-based
successor to the original Shelly Uni (ESP8266).

Features:

- 2 digital inputs
- 2 potential-free solid-state relay outputs (30V / 300mA max)
- 1 analog input (0-15V or 0-30V selectable range)
- 1 pulse counter input (up to 1kHz)
- 1-Wire data bus (DS18B20 or DHT22)
- Powered by 8-24 VAC, 9-28 VDC, or 5 VDC

## GPIO Pinout

| Function         | GPIO   | Status    | Notes                   |
| ---------------- | ------ | --------- | ----------------------- |
| Input 1          | GPIO37 | Confirmed | Digital input (SWITCH1) |
| Input 2          | GPIO38 | Confirmed | Digital input (SWITCH2) |
| Output 1 (Relay) | GPIO19 | Confirmed | Potential-free contact  |
| Output 2 (Relay) | GPIO21 | Confirmed | Potential-free contact  |
| 1-Wire / Sensor  | ?      | Unknown   | DS18B20, DHT22          |
| Status LED       | GPIO18 | Confirmed | Active low              |
| Analog Input     | ?      | Unknown   | 0-15V / 0-30V range     |
| Counter Input    | ?      | Unknown   | Up to 1kHz              |

GPIO assignments for Input 1, Input 2, Output 1, Output 2, and Status LED have
been confirmed by testing. Remaining GPIOs are not yet documented.

## Flashing

The Shelly Plus Uni uses an ESP32-U4WDH with 4MB embedded flash. The J13 header
exposes the UART pins needed for flashing:

| J13 Pin | Function       |
| ------- | -------------- |
| 1       | ESP_DEBUG_UART |
| 2       | TX             |
| 3       | RX             |
| 4       | 3.3V           |
| 5       | RESET          |
| 6       | GPIO0          |
| 7       | GND            |

The J13 header uses 1.27mm pitch (half of standard 2.54mm breadboard spacing).
Standard dupont jumper wires will not fit. Sewing needles inserted into the
header holes work well, or use pogo pins or solder temporary wires.

Connect a USB-to-serial adapter (3.3V logic) and pull GPIO0 low during
power-on/reset to enter bootloader mode.

```bash
# Backup stock firmware first
esptool.py --chip esp32 --port /dev/ttyUSB0 --baud 460800 read_flash 0x0 0x400000 shelly_plus_uni_backup.bin

# Then flash ESPHome
esphome run config.yaml
```

## Basic Configuration

```yaml file=config.yaml
```
