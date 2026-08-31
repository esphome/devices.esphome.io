---
title: JSY-MK-339
date-published: 2026-08-13
type: sensor
standard: global
board: esp8266
project-url: https://github.com/cocodmdr/JSY-MK-339-ESPHome
---

## JSY-MK-339

Configuration for the JSY-MK-339 three-phase DIN-rail Modbus energy meter.

It supports:

- Three-phase voltage and current
- Active, reactive, and apparent power
- Energy counters (total, forward, reverse)
- Line voltages and leakage current
- Alarm status and direction bits
- Configuration entities for voltage, current, leakage limits, and wiring mode

## Device Images

![JSY-MK-339 front](jsy-mk-339.jpg "JSY-MK-339 front")

## Manufacturer Documentation

- [JSY-MK-339 User Manual (PDF)](jsy-mk-339-user-manual.pdf)

## ESPHome Integration

### Prerequisites

Use an RS-485 transceiver wired to your ESP board UART.

### Example Configuration

```yaml file=config.yaml
```

## Notes

- Default Modbus address is usually 1.
- Default UART format is typically 9600, 8N1.
- Ensure A/B RS-485 lines are not reversed.
- This setup is intended for monitoring and telemetry. Validate behavior before using any control features in production.

## Known Issues

- Some model variants may expose different scaling for a subset of registers.
- If reads are unstable, lower bus speed, improve wiring, or isolate the RS-485 interface.
