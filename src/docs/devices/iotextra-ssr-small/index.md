---
title: 8 Solid-State Relay Outputs (SMD4) - IoTextra SSR Small
date-published: 2026-11-13
type: misc
standard: global
board: esp32
difficulty: 2
project-url: https://makethingshappy.io/products/iotextra-ssr-small
---

![IoTextra SSR Small with IoTsmart ESP32-S3](iotextra-ssr-small-iotsmart-esp32-s3.png "IoTextra SSR Small with IoTsmart ESP32-S3")

## General Notes

IoTextra SSR Small is an 8-channel solid-state relay module (SPST-NO, 1 Form A) with individual galvanic isolation per
channel (5000 Vrms). No moving contacts, silent and spark-free switching: heating elements, solenoid valves, fans,
lighting and small AC/DC loads.

- 8 SSR outputs; load rating depends on the fitted SSR model: 60 V / 0.5 A, 40 V / 2 A, 30 V / 4 A or 350 V / 0.12 A;
  on-resistance from 0.05 Ω
- 5 VDC supply, 47 x 56 mm
- GPIO (AP0-AP7 on the HOST connector) and/or I2C (TCA9534) control, HOST and Qwiic connectors
- Works with Raspberry Pi, Raspberry Pi Pico / Pico 2 (RP2040 / RP2350) and ESP32; part of the IoTextra series,
  compatible with IoTsmart and IoTbase
- Open source hardware

Datasheet, schematic and 3D model: [IoTextra-Digital
repository](https://github.com/makethingshappy/IoTextra-Digital/tree/main/SSR%20Small). ESPHome configurations for other
carriers: [MTH-for-ESPHome](https://github.com/makethingshappy/MTH-for-ESPHome). Tasmota templates:
[IoThome](https://github.com/makethingshappy/IoThome).

![IoTextra SSR Small, top view](iotextra-ssr-small-top.png "IoTextra SSR Small, top view")

## Supported carriers

| SSR Small version | Carrier | ESPHome configuration |
| --- | --- | --- |
| 3.02 | IoTsmart ESP32-S3 1.02 | [iotextra-ssr-small-v3-02-iotsmart-esp32s3-v1-02-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_ESP32-S3/iotextra-ssr-small-v3-02-iotsmart-esp32s3-v1-02-gpio.yaml) |
| 3.02 | IoTsmart ESP32-S3 2.01 | [iotextra-ssr-small-v3-02-iotsmart-esp32s3-v2-01-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_ESP32-S3/iotextra-ssr-small-v3-02-iotsmart-esp32s3-v2-01-gpio.yaml) |
| 3.02 | IoTsmart XIAO 1.02 + XIAO ESP32-S3 | [iotextra-ssr-small-v3-02-iotsmart-xiao-v1-02-xiao-esp32s3-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_XIAO_XIAO-ESP32-S3/iotextra-ssr-small-v3-02-iotsmart-xiao-v1-02-xiao-esp32s3-gpio.yaml) |
| 3.02 | IoTbase NANO 3.06 + Waveshare ESP32-S3-Nano | [iotextra-ssr-small-v3-02-iotbase-nano-v3-06-ws-esp32s3-nano-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTbase_NANO_Waveshare-ESP32-S3-NANO/iotextra-ssr-small-v3-02-iotbase-nano-v3-06-ws-esp32s3-nano-gpio.yaml) |
| 3.02 | IoTbase PICO 3.05 + Raspberry Pi Pico W | [iotextra-ssr-small-v3-02-iotbase-pico-v3-05-pico-w-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTbase_PICO_Raspberry-Pi-Pico-W/iotextra-ssr-small-v3-02-iotbase-pico-v3-05-pico-w-gpio.yaml) |

## GPIO

HOST connector lines AP0..AP7 drive outputs RL1..RL8. GPIO numbers by carrier:

| Channel | HOST line | IoTsmart ESP32-S3 (1.02 and 2.01) | IoTsmart XIAO + XIAO ESP32-S3 | IoTbase NANO + Waveshare ESP32-S3-Nano | IoTbase PICO + Raspberry Pi Pico W |
| --- | --- | --- | --- | --- | --- |
| RL1 | AP0 | GPIO8 | GPIO8 | GPIO9 | GPIO10 |
| RL2 | AP1 | GPIO9 | GPIO9 | GPIO10 | GPIO11 |
| RL3 | AP2 | GPIO10 | GPIO7 | GPIO17 | GPIO12 |
| RL4 | AP3 | GPIO11 | GPIO44 | GPIO18 | GPIO13 |
| RL5 | AP4 | GPIO4 | GPIO1 | GPIO4 | GPIO14 |
| RL6 | AP5 | GPIO5 | GPIO2 | GPIO3 | GPIO15 |
| RL7 | AP6 | GPIO6 | GPIO3 | GPIO2 | GPIO18 |
| RL8 | AP7 | GPIO7 | GPIO4 | GPIO5 | GPIO19 |
| I2C SDA / SCL | HOST-P12 pins 11 / 12 | GPIO16 / GPIO15 | GPIO5 / GPIO6 | GPIO11 / GPIO12 | GPIO20 / GPIO21 |

All outputs are active-low on the HOST line (logical 0 switches an SSR on), so every pin is declared with
`inverted: true`.

## Configuration

Hardware part of the ESPHome configuration for IoTsmart ESP32-S3 2.01, maintained by Make Things Happy: board, I2C and
the channel pins. Add your own `wifi`, `api` and `ota` settings.

```yaml file=config.yaml
```

The full ready-to-flash configuration (Wi-Fi, API, OTA, web server) is [on
GitHub](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_ESP32-S3/iotextra-ssr-small-v3-02-iotsmart-esp32s3-v2-01-gpio.yaml).
The other carriers have their own files, linked in the table above.

![IoTextra SSR Small, bottom view](iotextra-ssr-small-bottom.png "IoTextra SSR Small, bottom view")

## Notes

- Do not use `board: esp32-s3-devkitc-1` for IoTsmart ESP32-S3. Use `variant: esp32s3`, `flash_size: 4MB` and `psram:
  mode: quad`, as in the configuration above.
- IoTsmart ESP32-S3 has a native USB port (no UART bridge): flash the first firmware over USB, later updates over the
  air.
- IoTsmart XIAO uses the Seeed XIAO ESP32-S3, which has no on-board antenna: fit an external 2.4 GHz antenna with a U.FL
  plug before the first start.
- On IoTsmart XIAO, RL4 uses GPIO44 (UART0 RX) and RL7 uses GPIO3 (a strapping pin). On IoTbase NANO, RL6 uses GPIO3 (a
  strapping pin).
- IoTbase PICO with Raspberry Pi Pico W uses the RP2 platform (`rp2:`, `board: rpipicow`). First flash: hold BOOTSEL
  while plugging in USB and copy the `firmware.uf2` file to the RPI-RP2 drive; later updates over the air.
- Windows: if your user name contains a space, ESP-IDF builds can fail. Set `ESPHOME_ESP_IDF_PREFIX` and
  `ESPHOME_DATA_DIR` to a path without spaces.
- I2C mode (TCA9534) is not covered by these configurations yet.
