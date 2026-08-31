---
title: Guition ESP32-P4-M3-Dev
date-published: 2025-12-01
type: misc
standard: Global
board: esp32
---

![Guition ESP32-P4-M3-Dev](guition_jc_esp32_p4_m3_dev.webp "Guition ESP32-P4-M3-Dev")

Model reference: ESP32-P4-M3-Dev

Available on [AliExpress](https://www.aliexpress.com/item/1005009511796128.html)

## Product Description

The Guition ESP32-P4-M3-Dev is a development board based on the ESP32-P4 chip featuring dual-core RISC-V
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
- USB 2.0 OTG High-Speed Host Controller Port (Type-C)
- USB 1.1 OTG Full-Speed Host Controller Port (Type-C)
- SDIO 3.0 TF card slot
- 11 accessible unused programmable GPIOs
- Onboard microphone
- Speaker header (8Ω 2W)
- Li-Ion Battery connector
- USB Type-C connector
- 0.5 Pitch 6 pin FPC connector for touch
- UART/RS485 ports MX1.25 format
- HS 1.0 pitch i2c port

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

Minimum configuration required for the Guition JC-ESP32-P4-M3-Dev:

```yaml file=config.yaml
```

## ESP32 Hosted Configuration

ESP32 Hosted ESP32-C6 coprocessor configuration:

```yaml file=esp32-hosted.yaml
```

## Wi-Fi Configuration

The ESP32-C6 coprocessor enables Wi-Fi functionality:

```yaml file=wifi.yaml
```

## Bluetooth Proxy Configuration

The ESP32-C6 coprocessor enables Bluetooth proxy functionality - could require a C6 firmware update to work:

```yaml file=bluetooth-proxy.yaml
```

## Ethernet Configuration

Configuration to use the onboard 100M Ethernet with IP101 PHY:

```yaml file=ethernet.yaml
```

## Coprocessor Firmware Update

The ESP32-C6 coprocessor firmware can be updated over-the-air using the esp32_hosted update platform:  
(see [esp32_hosted component](https://esphome.io/components/esp32_hosted/))

```yaml file=c6-firmware-update.yaml
```

The firmware binary is embedded into the ESP32-P4's flash at compile time and can be deployed to the
coprocessor on demand. The component automatically detects the current firmware version and compares it to
the embedded version. If they differ, an update becomes available in Home Assistant.

## Example configuration: Alarmo announcements + media playback

A playback satellite for this board: Home Assistant media playback and spoken
Alarmo state announcements through the onboard speaker header, networking over
the onboard 100M Ethernet. BLE is provided by the onboard ESP32-C6 through
`esp32_hosted`. There is no local wake-word/Assist capture here - see the build
note below on why - so trigger Assist from another satellite or automation
targeting this device's `media_player` entity.

Add your own `api:`, `ota:` and network credentials after adopting. Set the
`ha_media_player` substitution to the `media_player` entity Home Assistant
creates for this device, or TTS replies will not play.

```yaml file=voice-assistant.yaml

```

### Build notes from running this board

Audio pins in use on this board (ES8311 codec on the I2C bus):

| Signal            | GPIO   |
| ----------------- | ------ |
| I2S LRCLK (WS)    | GPIO10 |
| I2S BCLK          | GPIO12 |
| I2S MCLK          | GPIO13 |
| I2S DIN (mic)     | GPIO11 |
| I2S DOUT (speaker)| GPIO9  |
| Amplifier PA-CTRL | GPIO53 |

Speaker output through the onboard header works reliably. Microphone capture did
not: on the CoreBoard variant tested, the actual mic ADC is an ES7210 that never
answered on I2C, so only the ES8311 playback path could be brought up. If you
need wake-word capture, verify your board revision before relying on the onboard
mic. The config above is therefore an output-and-pipeline satellite - it hears
via a separate device and speaks through this one.

If the board bricks after a bad flash and drops off the network, OTA is no longer
an option. Recover over USB through the CH340 UART port:

```bash
esptool --chip esp32p4 write_flash 0x0 firmware.factory.bin
```

A cold-boot bricking issue was traced to the default 400MHz CPU frequency on this
board; running at 360MHz was stable. If you see boot failures only after a full
power cycle, that is worth trying first.

## Links

- [Product Page](https://www.aliexpress.com/item/1005009511796128.html)
- [Unofficial repo for device](https://github.com/p1ngb4ck/unofficial_guition_esp32p4_repo/tree/main/JC-ESP32P4-M3-Dev)
- [Schematic](https://github.com/p1ngb4ck/unofficial_guition_esp32p4_repo/tree/main/JC-ESP32P4-M3-Dev/schematics)
