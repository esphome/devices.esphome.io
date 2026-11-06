---
title: Waveshare ESP32-P4-Nano
date-published: 2025-11-17
type: misc
standard: Global
board: esp32
---

![Waveshare ESP32-P4-Nano](waveshare-esp32-p4-nano.webp "Waveshare ESP32-P4-Nano")

Model reference: ESP32-P4-Nano

Manufacturer: [Waveshare](https://www.waveshare.com/)

## Product Description

The Waveshare ESP32-P4-Nano is a development board based on the ESP32-P4 chip featuring dual-core RISC-V
processors with advanced image and video processing capabilities. The board includes an onboard ESP32-C6-MINI
module for Wi-Fi 6 and Bluetooth 5/BLE connectivity, making it ideal for IoT applications requiring wireless
communication alongside high-performance computing.

### Key Features

- ESP32-P4 dual-core RISC-V processors
- 32MB PSRAM (in chip package)
- 16MB NOR Flash
- ESP32-C6-MINI coprocessor for Wi-Fi 6 and Bluetooth 5/BLE
- MIPI 2-lane DSI display interface
- MIPI 2-lane CSI camera interface with ISP
- 100M Ethernet (IP101 PHY)
- USB 2.0 OTG High-Speed
- SDIO 3.0 TF card slot
- 28 programmable GPIOs
- Onboard microphone
- Speaker header (8Ω 2W)
- RTC battery support
- USB Type-C connector

## GPIO Pinout

### ESP32 Hosted (ESP32-C6 Coprocessor)

The board uses the ESP32-C6-MINI module as a coprocessor for Wi-Fi and Bluetooth connectivity via SDIO:

| Function | GPIO |
|----------|------|
| Reset    | GPIO54 |
| CMD      | GPIO19 |
| CLK      | GPIO18 |
| D0       | GPIO14 |
| D1       | GPIO15 |
| D2       | GPIO16 |
| D3       | GPIO17 |

### Ethernet (IP101 PHY)

| Function | GPIO |
|----------|------|
| MDC      | GPIO31 |
| MDIO     | GPIO52 |
| Power    | GPIO51 |
| CLK      | GPIO50 |

## Basic Configuration

Minimum configuration required for the Waveshare ESP32-P4-Nano:

```yaml
esphome:
  name: "esp32-p4-nano"

esp32:
  board: esp32-p4-evboard
  flash_size: 16MB
  framework:
    type: esp-idf

logger:
  hardware_uart: UART0

api:

ota:
  platform: esphome
```

## ESP32 Hosted Configuration

ESP32 Hosted ESP32-C6 coprocessor configuration:

```yaml
esp32_hosted:
  active_high: true
  variant: ESP32C6
  reset_pin: GPIO54
  cmd_pin: GPIO19
  clk_pin: GPIO18
  d0_pin: GPIO14
  d1_pin: GPIO15
  d2_pin: GPIO16
  d3_pin: GPIO17
```

## Wi-Fi Configuration

The ESP32-C6 coprocessor enables Wi-Fi functionality:

```yaml
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
```

## Bluetooth Proxy Configuration

The ESP32-C6 coprocessor enables Bluetooth proxy functionality:

```yaml
esp32_ble_tracker:
  scan_parameters:
    interval: 1100ms
    window: 1100ms
    active: true

bluetooth_proxy:
  active: true
  connection_slots: 3
```

## Ethernet Configuration

Configuration to use the onboard 100M Ethernet with IP101 PHY:

```yaml
ethernet:
  type: IP101
  mdc_pin: GPIO31
  mdio_pin: GPIO52
  power_pin: GPIO51
  clk:
    mode: CLK_EXT_IN
    pin: GPIO50
  phy_addr: 1
```

## Coprocessor Firmware Update

The ESP32-C6 coprocessor firmware can be updated over-the-air using the esp32_hosted update platform:

```yaml
update:
  - platform: esp32_hosted
    name: "C6 Coprocessor Update"
    path: /path/to/network_adapter.bin
    sha256: your_sha256_hash_here
```

The firmware binary is embedded into the ESP32-P4's flash at compile time and can be deployed to the
coprocessor on demand. The component automatically detects the current firmware version and compares it to
the embedded version. If they differ, an update becomes available in Home Assistant.

## Links

- [Product Page](https://www.waveshare.com/esp32-p4-nano.htm)
- [Wiki Documentation](https://www.waveshare.com/wiki/ESP32-P4-NANO)
- [Schematic](https://files.waveshare.com/wiki/ESP32-P4-NANO/ESP32-P4-NANO-schematic.pdf)
