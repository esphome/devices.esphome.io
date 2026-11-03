---
title: Panlee ZX3D95CE01S-TR-4848 480*480 Smart Screen
date-published: 2026-10-25
type: misc
standard: global
board: esp32
difficulty: 3
alias:
  - title: Wireless-Tag WT32S3-86S
    slug: Wireless-Tag-WT32S3-86S
---

A 480\*480 IPS touch screen in a square wall-box housing, built around an ESP32-S3. It is sold by Panlee as
ZX3D95CE01S-TR-4848 and by Wireless-Tag as WT32S3-86S.

## Product specs

| Feature       | Spec                                                      |
| ------------- | --------------------------------------------------------- |
| Screen        | 3.95" IPS, 480\*480, GC9503V driver, 16-bit RGB interface |
| Touch screen  | FT6336U capacitive (I2C address 0x38)                     |
| CPU           | ESP32-S3                                                  |
| Flash         | 16MB                                                      |
| PSRAM         | 8MB, octal                                                |
| Temp/humidity | SHT20 on the I2C bus (address 0x40)                       |
| Other         | RS-485 transceiver                                        |
| Size          | 86 x 86 x 37mm                                            |
| Power         | 5V DC                                                     |

## Product description

The ZX3D95CE01S is sold in several variants that share the same display but differ in the extra hardware and in some
pin assignments:

| Variant | Extras                                       |
| ------- | -------------------------------------------- |
| AR      | Speaker, microphones, audio codec and RS-485 |
| UR      | USB connector and RS-485                     |
| T       | RS-485 only                                  |
| TR      | SHT20 temperature/humidity sensor and RS-485 |

This page covers the **TR** variant only. The I2C and touch pins are reported to differ from the UR variant, so the
configuration below will not work unchanged on the other variants.

Datasheet (TR and AR variants):
[ZX3D95CE01S-TR-4848.pdf](ZX3D95CE01S-TR-4848.pdf)

More background on this family of devices, including the other variants, is collected in the
[openHASP hardware thread](https://github.com/HASwitchPlate/openHASP/discussions/435).

## Flashing

The device has an onboard 2mm pitch programming connector, and unpopulated flash header pins.
Connect 5V, GND, TX0 to the adapter's RX and RX0 to the adapter's TX, and tie `IO0` to GND while powering up to
  enter download mode.

## Basic Config

Support for this board is provided by the `ZX3D95CE01S-TR-4848` model of the
[`mipi_rgb`](https://esphome.io/components/display/mipi_rgb/) display platform. The model already contains the
pins, timings and init sequence, so only the model name is needed.

```yaml file=config.yaml

```

This configuration shows the built-in colour-bar test card. Remove `show_test_card` when you add your own content
with `lvgl` or a display lambda.

### Pinout

| Function               | GPIO                                   |
| ---------------------- | -------------------------------------- |
| Backlight (PWM)        | GPIO5                                  |
| I2C SDA / SCL          | GPIO15 / GPIO6                         |
| Touch interrupt        | GPIO4                                  |
| Display SPI clk / MOSI | GPIO45 / GPIO48 (shared with RGB data) |
| Display SPI CS         | GPIO38                                 |
| RGB DE / VSYNC / HSYNC | GPIO40 / GPIO41 / GPIO42               |
| RGB PCLK               | GPIO39                                 |
| RGB red 1-5            | GPIO18, 8, 3, 46, 10                   |
| RGB green 0-5          | GPIO14, 13, 12, 11, 16, 17             |
| RGB blue 1-5           | GPIO45, 48, 47, 0, 21                  |

The display needs a 3-wire SPI bus only to send its init sequence. Because GPIO45 and GPIO48 are also RGB data
lines, the `spi` pins must be declared with `allow_other_uses`, as in the configuration above. The display model
sends the init sequence before the RGB interface starts, which is required for this sharing to work.

## Temperature and humidity sensor

The TR variant has an SHT20 at I2C address 0x40, which works with the `htu21d` platform ([docs](https://esphome.io/components/sensor/htu21d/)):

```yaml inline
sensor:
  - platform: htu21d
    temperature:
      name: Temperature
    humidity:
      name: Humidity
    update_interval: 60s
```

The sensor sits inside the enclosure next to the ESP32 and the display, so it will read higher than the room
temperature. The offset differs from unit to unit, so calibrate each device against a reference sensor, for example
with a `filters:` offset.
