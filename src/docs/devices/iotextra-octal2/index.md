---
title: 4 Digital Inputs + 4 NPN Digital Outputs - IoTextra Octal2
date-published: 2026-11-13
type: misc
standard: global
board: esp32, rp2040
difficulty: 2
project-url: https://makethingshappy.io/products/iotextra-octal2
---

![IoTextra Octal2 with IoTsmart ESP32-S3](iotextra-octal2-iotsmart-esp32-s3.png "IoTextra Octal2 with IoTsmart ESP32-S3")

## General Notes

IoTextra Octal2 is an 8-channel digital I/O module: four isolated digital inputs and four isolated NPN transistor
outputs, with individual galvanic isolation per channel (3750 Vrms). Inputs read limit switches, proximity sensors and
machine status contacts; outputs drive pilot lamps, small solenoids, contactor coils and indicators.

- 4 digital inputs up to 36 VDC, selectable bipolar or unipolar input mode
- 4 NPN Darlington outputs, up to 8 A (16 A peak) at up to 48 VDC, 20 W max dissipation
- Per-channel status LEDs; 5 VDC supply, 47 x 56 mm
- GPIO (AP0-AP7 on the HOST connector) and/or I2C (TCA9534) control, HOST and Qwiic connectors
- Works with Raspberry Pi, Raspberry Pi Pico / Pico 2 (RP2040 / RP2350) and ESP32; part of the IoTextra series,
  compatible with IoTsmart and IoTbase
- Open source hardware

Datasheet, schematic and 3D model: [IoTextra-Digital
repository](https://github.com/makethingshappy/IoTextra-Digital/tree/main/Octal2). ESPHome configurations for other
carriers: [MTH-for-ESPHome](https://github.com/makethingshappy/MTH-for-ESPHome). Tasmota templates:
[IoThome](https://github.com/makethingshappy/IoThome).

![IoTextra Octal2, top view](iotextra-octal2-top.png "IoTextra Octal2, top view")

## Supported carriers

| Octal2 version | Carrier | ESPHome configuration |
| --- | --- | --- |
| 3.02 | IoTsmart ESP32-S3 1.02 | [iotextra-octal2-v3-02-iotsmart-esp32s3-v1-02-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_ESP32-S3/iotextra-octal2-v3-02-iotsmart-esp32s3-v1-02-gpio.yaml) |
| 3.02 | IoTsmart ESP32-S3 2.01 | [iotextra-octal2-v3-02-iotsmart-esp32s3-v2-01-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_ESP32-S3/iotextra-octal2-v3-02-iotsmart-esp32s3-v2-01-gpio.yaml) |
| 3.02 | IoTsmart XIAO 1.02 + XIAO ESP32-S3 | [iotextra-octal2-v3-02-iotsmart-xiao-v1-02-xiao-esp32s3-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_XIAO_XIAO-ESP32-S3/iotextra-octal2-v3-02-iotsmart-xiao-v1-02-xiao-esp32s3-gpio.yaml) |
| 3.02 | IoTbase NANO 3.06 + Waveshare ESP32-S3-Nano | [iotextra-octal2-v3-02-iotbase-nano-v3-06-ws-esp32s3-nano-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTbase_NANO_Waveshare-ESP32-S3-NANO/iotextra-octal2-v3-02-iotbase-nano-v3-06-ws-esp32s3-nano-gpio.yaml) |
| 3.02 | IoTbase PICO 3.05 + Raspberry Pi Pico W | [iotextra-octal2-v3-02-iotbase-pico-v3-05-pico-w-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTbase_PICO_Raspberry-Pi-Pico-W/iotextra-octal2-v3-02-iotbase-pico-v3-05-pico-w-gpio.yaml) |

## GPIO

HOST connector lines AP0..AP7 carry inputs IN1..IN4 and NPN outputs DO1..DO4. GPIO numbers by carrier:

| Channel | HOST line | IoTsmart ESP32-S3 (1.02 and 2.01) | IoTsmart XIAO + XIAO ESP32-S3 | IoTbase NANO + Waveshare ESP32-S3-Nano | IoTbase PICO + Raspberry Pi Pico W |
| --- | --- | --- | --- | --- | --- |
| IN1 | AP0 | GPIO8 | GPIO8 | GPIO9 | GPIO10 |
| IN2 | AP1 | GPIO9 | GPIO9 | GPIO10 | GPIO11 |
| IN3 | AP2 | GPIO10 | GPIO7 | GPIO17 | GPIO12 |
| IN4 | AP3 | GPIO11 | GPIO44 | GPIO18 | GPIO13 |
| DO1 | AP4 | GPIO4 | GPIO1 | GPIO4 | GPIO14 |
| DO2 | AP5 | GPIO5 | GPIO2 | GPIO3 | GPIO15 |
| DO3 | AP6 | GPIO6 | GPIO3 | GPIO2 | GPIO18 |
| DO4 | AP7 | GPIO7 | GPIO4 | GPIO5 | GPIO19 |
| I2C SDA / SCL | HOST-P12 pins 11 / 12 | GPIO16 / GPIO15 | GPIO5 / GPIO6 | GPIO11 / GPIO12 | GPIO20 / GPIO21 |

All channels are active-low on the HOST line (an applied input reads as logical 0; logical 0 switches an output on), so
every pin is declared with `inverted: true`.

## Configuration

Hardware part of the ESPHome configuration for IoTsmart ESP32-S3 2.01, maintained by Make Things Happy: board, I2C and
the channel pins. Add your own `wifi`, `api` and `ota` settings.

```yaml file=config.yaml
```

The full ready-to-flash configuration (Wi-Fi, API, OTA, web server) is [on
GitHub](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_ESP32-S3/iotextra-octal2-v3-02-iotsmart-esp32s3-v2-01-gpio.yaml).
The other carriers have their own files, linked in the table above.

![IoTextra Octal2, bottom view](iotextra-octal2-bottom.png "IoTextra Octal2, bottom view")

## Notes

- Do not use `board: esp32-s3-devkitc-1` for IoTsmart ESP32-S3. Use `variant: esp32s3`, `flash_size: 4MB` and `psram:
  mode: quad`, as in the configuration above.
- IoTsmart ESP32-S3 has a native USB port (no UART bridge): flash the first firmware over USB, later updates over the
  air.
- IoTsmart XIAO uses the Seeed XIAO ESP32-S3, which has no on-board antenna: fit an external 2.4 GHz antenna with a U.FL
  plug before the first start.
- On IoTsmart XIAO, IN4 uses GPIO44 (UART0 RX) and DO3 uses GPIO3 (a strapping pin). On IoTbase NANO, DO2 uses GPIO3 (a
  strapping pin).
- IoTbase PICO with Raspberry Pi Pico W uses the RP2 platform (`rp2:`, `board: rpipicow`). First flash: hold BOOTSEL
  while plugging in USB and copy the `firmware.uf2` file to the RPI-RP2 drive; later updates over the air.
- Windows: if your user name contains a space, ESP-IDF builds can fail. Set `ESPHOME_ESP_IDF_PREFIX` and
  `ESPHOME_DATA_DIR` to a path without spaces.
- I2C mode (TCA9534) is not covered by these configurations yet.
