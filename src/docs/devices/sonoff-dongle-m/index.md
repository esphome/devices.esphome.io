---
title: SONOFF Dongle Max (Dongle-M)
date-published: 2026-10-28
type: misc
standard: global
board: esp32
difficulty: 2
project-url: https://dongle.sonoff.tech/guide/dongle-m/running-esphome-firmware-on-dongle-m/
---

# Description

Dongle-M uses a dual-chip architecture consisting of an ESP32 (Wi-Fi SoC) and an MG24 (Zigbee/Thread SoC).
The ESP32 handles functions such as Wi-Fi and Ethernet, and provides a TCP port for transmitting and receiving serial data from the MG24.
The MG24 serves as a Zigbee NCP (Zigbee Coordinator), Zigbee Router, OpenThread RCP, or Multiprotocol RCP.

**Note:** ESPHome firmware runs exclusively on Dongle-M's ESP32 Wi-Fi SoC. 
Flashing ESPHome firmware onto Dongle-M will not affect the functionality of the firmware on the MG24 SoC.

![SONOFF Dongle Max (Dongle-M)](dongle-m.jpg)
![SONOFF Dongle Max (Dongle-M)](dongle-m.jpg)

## Quick Start

1. Copy below advanced yaml into ESPHome Builder 
2. Compile and flash the firmware to Dongle-M's ESP32
3.  Add it to Home Assistant via the ESPHome integration.
4. (Optional) Flash the MG24 firmware and connect it to open-source platform

## GPIO Pinout

![SONOFF Dongle Max (Dongle-M)](dongle-m.jpg)

| Function | ESP32 GPIO | Direction | Notes |
| --- | --- | --- | --- |
| EFR32MG24 UART RX | GPIO13 | Input | Data from EFR32MG24 to ESP32 |
| EFR32MG24 UART TX | GPIO17 | Output | Data from ESP32 to EFR32MG24 |
| EFR32MG24 Reset | GPIO15 | Output | Active low |
| EFR32MG24 Bootloader | GPIO12 | Output | Used to enter radio bootloader mode |
| RGB LED - Red | GPIO4 | Output / PWM | LEDC PWM |
| RGB LED - Green | GPIO14 | Output / PWM | LEDC PWM |
| RGB LED - Blue | GPIO2 | Output / PWM | LEDC PWM |
| User Button | GPIO34 | Input | Active low |
| Ethernet MDC | GPIO23 | Output | IP101 PHY management clock |
| Ethernet MDIO | GPIO18 | I/O | IP101 PHY management data |
| Ethernet REF_CLK | GPIO0 | Input | External 50 MHz RMII clock |

## Key Features

The following features are based on the advanced YAML configuration provided in this document. All parameters can be modified in ESPHome to suit your needs.

- **Ethernet:** Provides a wired network connection through the onboard IP101 PHY.
- **Wi-Fi:** Supports wireless connectivity and a fallback access point for setup and recovery.
- **UART over TCP:** Exposes the MG24 UART interface over TCP port 6638 for compatible Zigbee or Thread open-source platform.
- **Bluetooth Proxy:** Enables Home Assistant to discover and control nearby BLE devices.
- **MG24 Firmware Management:** Supports entering MG24 bootloader mode and updating radio firmware.
- **Status and Controls:** Provides RGB status indication, button events

## Basic Configuration

The basic configuration provides Ethernet connectivity, UART over TCP, and essential device diagnostics.

```yaml file=config.yaml
```

## Advanced Configuration

The advanced configuration adds Wi-Fi, Bluetooth Proxy, RGB LED effects, button events, access point controls, and MG24 radio management.

```yaml file=advanced.yaml
```

## Link

- [**Shop:** Purchase Dongle-M from the official SONOFF store.](https://sonoff.tech/products/sonoff-dongle-max-zigbee-thread-poe-dongle-dongle-m)
- [**Guide:** Follow Running ESPHome Firmware on Dongle-M.](https://dongle.sonoff.tech/guide/dongle-m/running-esphome-firmware-on-dongle-m/)
- [**Forum:** Post questions on the eWeLink Community Forum for our official technical support.](https://forum.ewelink.cc/t/esphome-on-sonoff-dongle-max/209243)
