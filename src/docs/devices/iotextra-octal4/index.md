---
title: 4 Digital Inputs (ISO1211) + 4 SPST Relays - IoTextra Octal4
date-published: 2026-11-13
type: misc
standard: global
board: esp32
difficulty: 2
project-url: https://makethingshappy.io/products/iotextra-octal4
---

![IoTextra Octal4 with IoTsmart ESP32-S3](iotextra-octal4-iotsmart-esp32-s3.png "IoTextra Octal4 with IoTsmart ESP32-S3")

## General Notes

IoTextra Octal4 is an 8-channel digital I/O module: four isolated digital inputs on TI ISO1211 receivers and four SPST
relays. Inputs read field sensors, limit and proximity switches, e-stop loops and door interlocks at industrial voltage
levels; relays switch contactors, indicator lamps, pumps, valves and small actuators.

- 4 digital inputs, individual galvanic isolation per channel (ISO1211, 2500 Vrms), no field-side power supply required;
  input voltage class set per channel with solder jumpers (see the datasheet)
- 4 SPST (1 Form A) relays, Panasonic APAN3105 or Hongfa HF49FD, 5 A at 250 VAC / 30 VDC
- 5 VDC supply, 47 x 56 mm
- GPIO (AP0-AP7 on the HOST connector) and/or I2C (TCA9534) control, HOST-P12 and Qwiic connectors
- Works with Raspberry Pi, Raspberry Pi Pico / Pico 2 (RP2040 / RP2350) and ESP32; part of the IoTextra series,
  compatible with IoTsmart and IoTbase
- Open source hardware

Datasheet, schematic and 3D model: [IoTextra-Digital
repository](https://github.com/makethingshappy/IoTextra-Digital/tree/main/Octal4). ESPHome configurations for other
carriers: [MTH-for-ESPHome](https://github.com/makethingshappy/MTH-for-ESPHome). Tasmota templates:
[IoThome](https://github.com/makethingshappy/IoThome).

![IoTextra Octal4, top view](iotextra-octal4-top.png "IoTextra Octal4, top view")

## Supported carriers

| Octal4 version | Carrier | ESPHome configuration |
| --- | --- | --- |
| 3.02 | IoTsmart ESP32-S3 1.02 | [iotextra-octal4-v3-02-iotsmart-esp32s3-v1-02-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_ESP32-S3/iotextra-octal4-v3-02-iotsmart-esp32s3-v1-02-gpio.yaml) |
| 3.02 | IoTsmart ESP32-S3 2.01 | [iotextra-octal4-v3-02-iotsmart-esp32s3-v2-01-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_ESP32-S3/iotextra-octal4-v3-02-iotsmart-esp32s3-v2-01-gpio.yaml) |
| 3.02 | IoTsmart XIAO 1.02 + XIAO ESP32-S3 | [iotextra-octal4-v3-02-iotsmart-xiao-v1-02-xiao-esp32s3-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_XIAO_XIAO-ESP32-S3/iotextra-octal4-v3-02-iotsmart-xiao-v1-02-xiao-esp32s3-gpio.yaml) |
| 3.02 | IoTbase NANO 3.06 + Waveshare ESP32-S3-Nano | [iotextra-octal4-v3-02-iotbase-nano-v3-06-ws-esp32s3-nano-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTbase_NANO_Waveshare-ESP32-S3-NANO/iotextra-octal4-v3-02-iotbase-nano-v3-06-ws-esp32s3-nano-gpio.yaml) |
| 3.02 | IoTbase PICO 3.05 + Raspberry Pi Pico W | [iotextra-octal4-v3-02-iotbase-pico-v3-05-pico-w-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTbase_PICO_Raspberry-Pi-Pico-W/iotextra-octal4-v3-02-iotbase-pico-v3-05-pico-w-gpio.yaml) |

## GPIO

HOST connector lines AP0..AP7 carry inputs DI1..DI4 and relays K1..K4 (terminals RS1..RS4). GPIO numbers by carrier:

| Channel | HOST line | IoTsmart ESP32-S3 (1.02 and 2.01) | IoTsmart XIAO + XIAO ESP32-S3 | IoTbase NANO + Waveshare ESP32-S3-Nano | IoTbase PICO + Raspberry Pi Pico W |
| --- | --- | --- | --- | --- | --- |
| DI1 | AP0 | GPIO8 | GPIO8 | GPIO9 | GPIO10 |
| DI2 | AP1 | GPIO9 | GPIO9 | GPIO10 | GPIO11 |
| DI3 | AP2 | GPIO10 | GPIO7 | GPIO17 | GPIO12 |
| DI4 | AP3 | GPIO11 | GPIO44 | GPIO18 | GPIO13 |
| K1 | AP4 | GPIO4 | GPIO1 | GPIO4 | GPIO14 |
| K2 | AP5 | GPIO5 | GPIO2 | GPIO3 | GPIO15 |
| K3 | AP6 | GPIO6 | GPIO3 | GPIO2 | GPIO18 |
| K4 | AP7 | GPIO7 | GPIO4 | GPIO5 | GPIO19 |
| I2C SDA / SCL | HOST-P12 pins 11 / 12 | GPIO16 / GPIO15 | GPIO5 / GPIO6 | GPIO11 / GPIO12 | GPIO20 / GPIO21 |

Inputs are active-high on the HOST line (an applied input reads as logical 1), so they are declared without inversion.
Relays are active-low (logical 0 switches a relay on), so they are declared with `inverted: true`.

## Configuration

Hardware part of the ESPHome configuration for IoTsmart ESP32-S3 2.01, maintained by Make Things Happy: board, I2C and
the channel pins. Add your own `wifi`, `api` and `ota` settings.

```yaml file=config.yaml
```

The full ready-to-flash configuration (Wi-Fi, API, OTA, web server) is [on
GitHub](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_ESP32-S3/iotextra-octal4-v3-02-iotsmart-esp32s3-v2-01-gpio.yaml).
The other carriers have their own files, linked in the table above.

![IoTextra Octal4, 3D view](iotextra-octal4-3d.png "IoTextra Octal4, 3D view")

## Notes

- K1 is wired to HOST line AP4 only when solder jumper SB6 is closed (factory default). With SB5 closed, AP4 is the
  TCA9534 interrupt line and K1 will not work.
- Do not use `board: esp32-s3-devkitc-1` for IoTsmart ESP32-S3. Use `variant: esp32s3`, `flash_size: 4MB` and `psram:
  mode: quad`, as in the configuration above.
- IoTsmart ESP32-S3 has a native USB port (no UART bridge): flash the first firmware over USB, later updates over the
  air.
- IoTsmart XIAO uses the Seeed XIAO ESP32-S3, which has no on-board antenna: fit an external 2.4 GHz antenna with a U.FL
  plug before the first start.
- On IoTsmart XIAO, DI4 uses GPIO44 (UART0 RX) and K3 uses GPIO3 (a strapping pin). On IoTbase NANO, K2 uses GPIO3 (a
  strapping pin).
- IoTbase PICO with Raspberry Pi Pico W uses the RP2 platform (`rp2:`, `board: rpipicow`). First flash: hold BOOTSEL
  while plugging in USB and copy the `firmware.uf2` file to the RPI-RP2 drive; later updates over the air.
- Windows: if your user name contains a space, ESP-IDF builds can fail. Set `ESPHOME_ESP_IDF_PREFIX` and
  `ESPHOME_DATA_DIR` to a path without spaces.
- I2C mode (TCA9534) is not covered by these configurations yet.
