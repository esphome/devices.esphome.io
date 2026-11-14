---
title: Yamaha RS-232 Adapter (ESP32 and ESP8266)
date-published: 2026-11-07
type: misc
standard: global
board: esp32, esp8266
project-url: https://github.com/memphi2/ESPHome-Yamaha-Serial
---

## Overview

This DIY adapter connects a Yamaha AV receiver's RS-232 port to an ESP32 or ESP8266 using a 3.3 V MAX3232 level converter.
Either ESP runs the community-maintained
[ESPHome-Yamaha-Serial external component](https://github.com/memphi2/ESPHome-Yamaha-Serial).
The receiver keeps its original firmware; only the ESP is flashed. No cloud service or MQTT broker is required.

Both board configurations below target an RX-V1600 and provide a media player for power, volume and mute, separate input
and DSP program selects, a status-refresh button and a connection indicator. They do not stream audio to the receiver.
Source and sound-mode selection inside a single Home Assistant media player can use the project's optional
[companion integration](https://github.com/memphi2/ESPHome-Yamaha-Serial/blob/v0.4.0/docs/home_assistant_companion.md).

## Hardware

- Either a classic ESP32-WROOM-32 development board with GPIO16/GPIO17, or an ESP8266 NodeMCU v2 with GPIO1/GPIO3.
- A MAX3232 module suitable for a 3.3 V supply and 3.3 V logic.
- A DB9 cable or breakout appropriate for the receiver and converter pinouts.
- A USB power supply for the ESP and insulated wiring or an enclosure.

The ESP32 pin assignment is not intended for ESP32-WROVER boards where GPIO16/GPIO17 may be used by PSRAM, or for ESP32-C3/S3
boards. The ESP8266 configuration uses hardware UART0 rather than software serial.

## Wiring

> **Do not connect Yamaha RS-232 signals directly to ESP GPIO pins.** RS-232 uses different voltage levels and polarity
> from a 3.3 V UART. A level converter is required in both directions. Do not use an RS-485 transceiver or a 5 V-only
> TTL adapter. Power off the receiver and disconnect the ESP's USB supply before wiring.

### GPIO Pinout

| ESP32 connection | ESP8266 NodeMCU v2 connection | MAX3232 connection | Function |
| --- | --- | --- | --- |
| GPIO17 | GPIO1 (TX) | T1IN, logic-side transmitter input | ESP UART TX |
| GPIO16 | GPIO3 (RX) | R1OUT, logic-side receiver output | ESP UART RX |
| 3V3 | 3V3 | VCC on a 3.3 V-compatible module | Converter supply |
| GND | GND | GND | Common signal ground |

On ESP8266, UART0 is shared with serial flashing and logging. Keep `logger.baud_rate: 0` as in the example so firmware
logs do not enter the receiver protocol; logs remain available over the native API. This does not suppress ROM boot
messages. Disconnect the converter's UART wires for USB flashing and check the board schematic to avoid two transmitters
driving GPIO3 (the USB-to-serial bridge and the converter's R1OUT) at the same time.

On the RS-232 side, connect the converter's T1OUT to the receiver's RXD, the receiver's TXD to the converter's R1IN,
and their signal grounds together. Transmit must reach receive end-to-end through the converter.
Module labels such as TX/RX are not consistent between vendors: use the module schematic and the receiver's connector
pinout to identify signal direction. Do not choose a straight-through or null-modem cable by connector gender alone.

The UART uses **9600 baud, 8 data bits, no parity and 1 stop bit**. Some receivers require their RS-232 CTS input to be
asserted before responding. Neither example drives RTS/CTS from the ESP. Use an appropriate RS-232-side handshake
connection for the receiver and converter; never connect RS-232 handshake pins directly to ESP GPIO or 3V3.

See the project's [wiring notes](https://github.com/memphi2/ESPHome-Yamaha-Serial/blob/v0.4.0/docs/wiring.md)
for handshake troubleshooting. No modification inside the receiver is required.

## Configuration

Requires ESPHome **2026.9.0 or newer**. The external component is pinned to the published `v0.4.0` release.
Review its release notes before changing that version.

Choose **one** board configuration; do not merge the ESP32 and ESP8266 examples.
Both hardware configurations intentionally exclude Wi-Fi credentials, the native API and OTA settings.
Add your own network configuration, encrypted API access and authenticated OTA updates in the ESPHome Device Builder
before installing.
Do not expose the API or OTA service to the public internet.

### ESP32

```yaml file=config.yaml
```

### ESP8266 NodeMCU v2

This standalone alternative provides the same receiver entities using GPIO1/GPIO3, with serial logging disabled.

```yaml file=esp8266.yaml
```

### Receiver Settings

The explicit `rx_vx600_extended` profile matches the RX-V1600 and enables its startup status decoding.
Periodic polling is disabled: startup synchronization and receiver-generated reports maintain the state, while the
Refresh button requests an additional update. A quiet serial link is therefore normal.

Both examples limit software volume commands to 0 dB. This is not a limiter for the receiver's front-panel controls.

## Compatibility And Validation

The project is beta software. This page describes an RX-V1600 configuration, not a claim that every Yamaha receiver or
every function has been tested. Release `v0.4.0` also provides x500, x700, x800 and RX-V1900 profiles; select the appropriate
profile rather than applying RX-V1600 settings to a different model.
Consult the project's [model matrix](https://github.com/memphi2/ESPHome-Yamaha-Serial/blob/v0.4.0/docs/supported_models.md)
for implemented mappings and hardware-validation limitations.

The project's [full ESP8266 example](https://github.com/memphi2/ESPHome-Yamaha-Serial/blob/v0.4.0/examples/yamaha_rx_v_full.yaml)
includes additional receiver controls. ESP8266 has less flash and RAM available than ESP32; adding entities changes the
resource requirements, so check build size before installing a larger configuration.

Local configuration validation and compilation do not establish electrical compatibility or replace a receiver test.
When reporting results, include the receiver model, ESP board, converter, component version and ESPHome version.
Remove Wi-Fi credentials, API encryption keys and other secrets from any configuration or logs you share.

## Troubleshooting

- **No receiver response:** check the converter supply, TX/RX direction, signal ground, baud rate and RTS/CTS wiring.
- **Unavailable in standby:** check whether the receiver permits RS-232 control in standby; settings vary by model.
- **Incorrect source or program labels:** check the selected receiver profile and any input-label overrides.
- **Only some functions work:** compare with the model matrix and try a manual Refresh before enabling periodic polling.

Further diagnostic steps are in the project's
[troubleshooting guide](https://github.com/memphi2/ESPHome-Yamaha-Serial/blob/v0.4.0/docs/troubleshooting.md).
The adapter is a community project, not a Yamaha product or an official ESPHome component.
