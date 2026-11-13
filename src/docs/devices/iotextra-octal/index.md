---
title: 4 Digital Inputs + 2 NPN Digital Outputs + 2 SPST Relays - IoTextra Octal
date-published: 2026-11-05
type: misc
standard: global
board: esp32, rp2040
difficulty: 2
project-url: https://makethingshappy.io/products/iotextra-octal
---

![IoTextra Octal with IoTsmart ESP32-S3](iotextra-octal-iotsmart-esp32-s3.png "IoTextra Octal with IoTsmart ESP32-S3")

## General Notes

IoTextra Octal is a 4+2+2 digital I/O module: four isolated digital inputs, two isolated NPN transistor outputs and two
SPST relays, all with individual galvanic isolation (3750 Vrms). It suits conveyor and drive control, machine status
monitoring, greenhouse automation and access control, where fast logic signals and load switching are needed on one
board.

- 4 digital inputs up to 36 VDC; 2 NPN outputs up to 48 VDC / 8 A (16 A peak); 2 SPST (1 Form A) relays, 5 A at 250 VAC
  / 30 VDC
- Relay types Panasonic APAN3105 or Hongfa HF49FD; per-channel status LEDs; 5 VDC supply, 47 x 56 mm
- GPIO (AP0-AP7 on the HOST connector) and/or I2C (TCA9534) control, HOST and Qwiic connectors
- Works with Raspberry Pi, Raspberry Pi Pico / Pico 2 (RP2040 / RP2350) and ESP32; part of the IoTextra series,
  compatible with IoTsmart and IoTbase
- Open source hardware

Datasheet, schematic and 3D model: [IoTextra-Digital
repository](https://github.com/makethingshappy/IoTextra-Digital/tree/main/Octal). ESPHome configurations for other
carriers: [MTH-for-ESPHome](https://github.com/makethingshappy/MTH-for-ESPHome). Tasmota templates:
[IoThome](https://github.com/makethingshappy/IoThome).

![IoTextra Octal, top view](iotextra-octal-top.png "IoTextra Octal, top view")

## Supported carriers

| Octal version | Carrier | ESPHome configuration |
| --- | --- | --- |
| 3.04 | IoTsmart ESP32-S3 1.02 | [iotextra-octal-v3-04-iotsmart-esp32s3-v1-02-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_ESP32-S3/iotextra-octal-v3-04-iotsmart-esp32s3-v1-02-gpio.yaml) |
| 3.04 | IoTsmart ESP32-S3 2.01 | [iotextra-octal-v3-04-iotsmart-esp32s3-v2-01-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_ESP32-S3/iotextra-octal-v3-04-iotsmart-esp32s3-v2-01-gpio.yaml) |
| 3.04 | IoTsmart XIAO 1.02 + XIAO ESP32-S3 | [iotextra-octal-v3-04-iotsmart-xiao-v1-02-xiao-esp32s3-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_XIAO_XIAO-ESP32-S3/iotextra-octal-v3-04-iotsmart-xiao-v1-02-xiao-esp32s3-gpio.yaml) |
| 3.04 | IoTbase NANO 3.06 + Waveshare ESP32-S3-Nano | [iotextra-octal-v3-04-iotbase-nano-v3-06-ws-esp32s3-nano-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTbase_NANO_Waveshare-ESP32-S3-NANO/iotextra-octal-v3-04-iotbase-nano-v3-06-ws-esp32s3-nano-gpio.yaml) |
| 3.04 | IoTbase PICO 3.05 + Raspberry Pi Pico W | [iotextra-octal-v3-04-iotbase-pico-v3-05-pico-w-gpio.yaml](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTbase_PICO_Raspberry-Pi-Pico-W/iotextra-octal-v3-04-iotbase-pico-v3-05-pico-w-gpio.yaml) |

## GPIO

HOST connector lines AP0..AP7 carry inputs IN1..IN4, relays RL1..RL2 and NPN outputs DO1..DO2. GPIO numbers by carrier:

| Channel | HOST line | IoTsmart ESP32-S3 (1.02 and 2.01) | IoTsmart XIAO + XIAO ESP32-S3 | IoTbase NANO + Waveshare ESP32-S3-Nano | IoTbase PICO + Raspberry Pi Pico W |
| --- | --- | --- | --- | --- | --- |
| IN1 | AP0 | GPIO8 | GPIO8 | GPIO9 | GPIO10 |
| IN2 | AP1 | GPIO9 | GPIO9 | GPIO10 | GPIO11 |
| IN3 | AP2 | GPIO10 | GPIO7 | GPIO17 | GPIO12 |
| IN4 | AP3 | GPIO11 | GPIO44 | GPIO18 | GPIO13 |
| RL1 | AP4 | GPIO4 | GPIO1 | GPIO4 | GPIO14 |
| RL2 | AP5 | GPIO5 | GPIO2 | GPIO3 | GPIO15 |
| DO1 | AP6 | GPIO6 | GPIO3 | GPIO2 | GPIO18 |
| DO2 | AP7 | GPIO7 | GPIO4 | GPIO5 | GPIO19 |
| I2C SDA / SCL | HOST-P12 pins 11 / 12 | GPIO16 / GPIO15 | GPIO5 / GPIO6 | GPIO11 / GPIO12 | GPIO20 / GPIO21 |

All channels are active-low on the HOST line (an applied input reads as logical 0; logical 0 switches a relay or an
output on), so every pin is declared with `inverted: true`.

## Configuration

Hardware part of the ESPHome configuration for IoTsmart ESP32-S3 2.01, maintained by Make Things Happy: board, I2C and
the channel pins. Add your own `wifi`, `api` and `ota` settings.

```yaml file=config.yaml
```

The full ready-to-flash configuration (Wi-Fi, API, OTA, web server) is [on
GitHub](https://github.com/makethingshappy/MTH-for-ESPHome/blob/a9598457c831f702040e549e6b084459b9cce84a/Configs/IoTsmart_ESP32-S3/iotextra-octal-v3-04-iotsmart-esp32s3-v2-01-gpio.yaml).
The other carriers have their own files, linked in the table above.

![IoTextra Octal, bottom view](iotextra-octal-bottom.png "IoTextra Octal, bottom view")

## Notes

- RL1 is wired to HOST line AP4 only when solder bridge SB2 is closed. With SB1 closed, AP4 is the TCA9534 interrupt
  line and RL1 will not work.
- Do not use `board: esp32-s3-devkitc-1` for IoTsmart ESP32-S3. Use `variant: esp32s3`, `flash_size: 4MB` and `psram:
  mode: quad`, as in the configuration above.
- IoTsmart ESP32-S3 has a native USB port (no UART bridge): flash the first firmware over USB, later updates over the
  air.
- IoTsmart XIAO uses the Seeed XIAO ESP32-S3, which has no on-board antenna: fit an external 2.4 GHz antenna with a U.FL
  plug before the first start.
- On IoTsmart XIAO, IN4 uses GPIO44 (UART0 RX) and DO1 uses GPIO3 (a strapping pin). On IoTbase NANO, RL2 uses GPIO3 (a
  strapping pin).
- IoTbase PICO with Raspberry Pi Pico W uses the RP2 platform (`rp2:`, `board: rpipicow`). First flash: hold BOOTSEL
  while plugging in USB and copy the `firmware.uf2` file to the RPI-RP2 drive; later updates over the air.
- Windows: if your user name contains a space, ESP-IDF builds can fail. Set `ESPHOME_ESP_IDF_PREFIX` and
  `ESPHOME_DATA_DIR` to a path without spaces.
- I2C mode (TCA9534) is not covered by these configurations yet.
