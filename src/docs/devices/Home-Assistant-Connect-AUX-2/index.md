---
title: Home Assistant Connect AUX-2
date-published: 2026-11-09
type: misc
standard: global
board: esp32
project-url: https://github.com/NabuCasa/aux-2
made-for-esphome: true
difficulty: 1
---

## Description

The Home Assistant Connect AUX-2 by Nabu Casa connects serial, USB and audio devices to Home Assistant over
Ethernet or Wi-Fi. It ships with ESPHome and can be set up with Improv over Bluetooth or USB.

To re-install the factory firmware, use the [web installer](https://firmware.nabucasa.com/install/aux-2/).

## Features

- ESP32-S3 with 8 MB flash and PSRAM
- Ethernet (W5500), with Wi-Fi as a fallback
- Two RS-232 ports, exposed to Home Assistant as serial proxies
- USB host port for:
  - Home Assistant Connect ZWA-2 (Z-Wave proxy)
  - Home Assistant Connect ZBT-2 (Zigbee serial proxy)
  - CH343-based USB serial adapters, such as RS-485 dongles (serial proxy)
- Media player with Sendspin support, through a 3.5 mm combo jack: analog line out (PCM5122 DAC) or optical
  S/PDIF, selected automatically
- Bluetooth proxy
- Grove port with switchable power
- Status light (RGB LED) and a button for factory reset

## Firmware updates

The factory firmware updates through the `update` entity in Home Assistant. Updates are signed, and the device
verifies the signature before installing them. The factory firmware has no network OTA endpoint, so it can't be
flashed over the network until you take control of it in the ESPHome Device Builder. Taking control imports
`packages/aux-2.yaml`, which includes `ota: - platform: esphome`.

## Configuration

The factory configuration:

```yaml url=https://github.com/NabuCasa/aux-2/blob/main/connect-aux-2.yaml
```

The core configuration, imported when you take control of the device:

```yaml url=https://github.com/NabuCasa/aux-2/blob/main/packages/aux-2.yaml
```
