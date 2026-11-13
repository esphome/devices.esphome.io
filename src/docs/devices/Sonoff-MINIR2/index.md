---
title: Sonoff MINIR2
date-published: "2026-11-05"
type: relay
standard: global
board: esp8266
---

The Sonoff MINIR2 is a single-channel Wi-Fi relay with external switch terminals.
The Mini V2.0 PCB uses an ESP8285N08 with 1 MiB of integrated flash.
It shares its relay and switch GPIO assignments with the [original Sonoff Mini Relay](/devices/sonoff-mini-relay/),
but has a different board layout.

## GPIO mapping

| GPIO   | Function                    |
|--------|-----------------------------|
| GPIO0  | Onboard button, active low  |
| GPIO1  | UART TX                     |
| GPIO3  | UART RX                     |
| GPIO4  | External switch input       |
| GPIO12 | Relay                       |
| GPIO13 | Blue status LED, active low |

## Installation

### Serial

Disconnect mains completely before attaching a USB-UART adapter.
Use 3.3 V power and logic.
Connect GND to GND, adapter TX to board RX, and adapter RX to board TX at the labeled programming pads.
Hold the onboard button while applying 3.3 V to enter the serial bootloader.
Read the full flash with [esptool](https://docs.espressif.com/projects/esptool/en/latest/esp8266/)
before replacing the original firmware.
Remove all programming wires and reassemble the enclosure before reconnecting mains.

### Stock DIY OTA

Direct stock-to-ESPHome OTA was tested on stock firmware **3.7.6**.
Follow the [Sonoff DIY OTA procedure](https://github.com/njh/sonoff-ota-flash-cli),
passing your ESPHome image URL as the positional argument and its SHA-256 with `-s`.
Use `-i` to specify the device IP address if discovery fails.
Serve the image from an HTTP server with Range support reachable from the device.
The initial image must fit within **508 KiB**.
Include the network credentials in the image so it can reconnect after the update.
Use native ESPHome OTA for later updates.

## ESPHome configuration

Add your Wi-Fi, API and OTA settings before building.
The onboard button and both edges of the external switch toggle the relay.

```yaml file=config.yaml
```
