---
title: Yamaha RS-232 Adapter (ESP32)
date-published: 2026-11-07
type: misc
standard: global
board: esp32
project-url: https://github.com/memphi2/ESPHome-Yamaha-Serial
---

## Overview

This DIY adapter connects a Yamaha AV receiver's RS-232 port to an ESP32 using a 3.3 V MAX3232 level converter.
The ESP32 runs the community-maintained
[ESPHome-Yamaha-Serial external component](https://github.com/memphi2/ESPHome-Yamaha-Serial).
The receiver keeps its original firmware; only the ESP32 is flashed. No cloud service or MQTT broker is required.

The configuration below targets an RX-V1600 and provides a media player for power, volume and mute, separate input and
DSP program selects, a status-refresh button and a connection indicator. It does not stream audio to the receiver.
Source and sound-mode selection inside a single Home Assistant media player can use the project's optional
[companion integration](https://github.com/memphi2/ESPHome-Yamaha-Serial/blob/v0.2.4/docs/home_assistant_companion.md).

## Hardware

- A classic ESP32 development board with an ESP32-WROOM-32 module and accessible GPIO16/GPIO17.
- A MAX3232 module suitable for a 3.3 V supply and 3.3 V logic.
- A DB9 cable or breakout appropriate for the receiver and converter pinouts.
- A USB power supply for the ESP32 and insulated wiring or an enclosure.

This pin assignment is not intended for ESP32-WROVER boards where GPIO16/GPIO17 may be used by PSRAM, or for ESP32-C3/S3
boards. The external component also supports ESP8266, but this page documents the ESP32 assembly only.

## Wiring

> **Do not connect Yamaha RS-232 signals directly to ESP GPIO pins.** RS-232 uses different voltage levels and polarity
> from a 3.3 V UART. A level converter is required in both directions. Do not use an RS-485 transceiver or a 5 V-only
> TTL adapter. Power off the receiver and disconnect the ESP32's USB supply before wiring.

### GPIO Pinout

| ESP32 connection | MAX3232 connection | Function |
| --- | --- | --- |
| GPIO17 | T1IN, logic-side transmitter input | ESP UART TX |
| GPIO16 | R1OUT, logic-side receiver output | ESP UART RX |
| 3V3 | VCC on a 3.3 V-compatible module | Converter supply |
| GND | GND | Common signal ground |

On the RS-232 side, connect the converter's T1OUT to the receiver's RXD, the receiver's TXD to the converter's R1IN,
and their signal grounds together. Transmit must reach receive end-to-end through the converter.
Module labels such as TX/RX are not consistent between vendors: use the module schematic and the receiver's connector
pinout to identify signal direction. Do not choose a straight-through or null-modem cable by connector gender alone.

The UART uses **9600 baud, 8 data bits, no parity and 1 stop bit**. Some receivers require their RS-232 CTS input to be
asserted before responding. This example does not drive RTS/CTS from the ESP32. Use an appropriate RS-232-side handshake
connection for the receiver and converter; never connect RS-232 handshake pins directly to ESP GPIO or 3V3.

See the project's [wiring notes](https://github.com/memphi2/ESPHome-Yamaha-Serial/blob/v0.2.4/docs/wiring.md)
for handshake troubleshooting. No modification inside the receiver is required.

## Configuration

Requires ESPHome **2026.9.0 or newer**. The external component is pinned to the published `v0.2.4` release.
Review its release notes before changing that version.

This hardware configuration intentionally excludes Wi-Fi credentials, the native API and OTA settings.
Add your own network configuration, encrypted API access and authenticated OTA updates in the ESPHome Device Builder
before installing.
Do not expose the API or OTA service to the public internet.

```yaml file=config.yaml
```

The explicit `rx_vx600_extended` profile matches the RX-V1600 and enables its startup status decoding.
Periodic polling is disabled: startup synchronization and receiver-generated reports maintain the state, while the
Refresh button requests an additional update. A quiet serial link is therefore normal.

The example limits software volume commands to 0 dB. This is not a limiter for the receiver's front-panel controls.

## Compatibility And Validation

The project is beta software. This page describes an RX-V1600 configuration, not a claim that every Yamaha receiver or
every function has been tested. Release `v0.2.4` also provides x500, x700 and x800 family profiles; select the appropriate
profile rather than applying RX-V1600 settings to a different model.
Consult the project's [model matrix](https://github.com/memphi2/ESPHome-Yamaha-Serial/blob/v0.2.4/docs/supported_models.md)
for implemented mappings and hardware-validation limitations.

Local configuration validation and compilation do not establish electrical compatibility or replace a receiver test.
When reporting results, include the receiver model, ESP board, converter, component version and ESPHome version.
Remove Wi-Fi credentials, API encryption keys and other secrets from any configuration or logs you share.

## Troubleshooting

- **No receiver response:** check the converter supply, TX/RX direction, signal ground, baud rate and RTS/CTS wiring.
- **Unavailable in standby:** check whether the receiver permits RS-232 control in standby; settings vary by model.
- **Incorrect source or program labels:** check the selected receiver profile and any input-label overrides.
- **Only some functions work:** compare with the model matrix and try a manual Refresh before enabling periodic polling.

Further diagnostic steps are in the project's
[troubleshooting guide](https://github.com/memphi2/ESPHome-Yamaha-Serial/blob/v0.2.4/docs/troubleshooting.md).
The adapter is a community project, not a Yamaha product or an official ESPHome component.
