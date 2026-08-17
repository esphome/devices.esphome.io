---
title: M5Stack AtomS3R
date-published: 2026-08-17
type: sensor
standard: global
board: esp32
difficulty: 2
made-for-esphome: false
---

![M5Stack AtomS3R](m5stack-atoms3r.jpg "M5Stack AtomS3R")

## Product Description

The M5Stack AtomS3R is a compact ESP32-S3 development board featuring:

- ESP32-S3 microcontroller (Xtensa dual-core 32-bit LX7)
- 128x128 ST7789V LCD display
- BMI270 6-axis IMU with a BMM150 magnetometer wired through its auxiliary I2C interface
- LP5562 LED driver for the display backlight
- USB-C connector
- Grove connector for expansion
- Single programmable button

Available from [M5Stack](https://docs.m5stack.com/en/core/AtomS3R).

## GPIO Pinout

| Pin     | Function       |
| ------- | -------------- |
| GPIO 0  | I2C SCL        |
| GPIO 14 | Display CS     |
| GPIO 15 | SPI CLK        |
| GPIO 21 | SPI MOSI       |
| GPIO 41 | Button         |
| GPIO 42 | Display DC     |
| GPIO 45 | I2C SDA        |
| GPIO 48 | Display Reset  |

## I2C Devices

| Address | Device                       |
| ------- | ---------------------------- |
| 0x30    | LP5562 (Display Backlight)   |
| 0x68    | BMI270 (IMU)                 |

The BMM150 magnetometer at 0x10 is accessed via the BMI270's auxiliary I2C interface rather than
appearing directly on the main bus.

## Basic Configuration

The IMU (`bmi270`, with BMM150 auxiliary support) and the display backlight driver (`lp5562`) are
both driven by upstream ESPHome platforms that are currently pending merge as
[esphome/esphome#18436](https://github.com/esphome/esphome/pull/18436) and
[esphome/esphome#18453](https://github.com/esphome/esphome/pull/18453). Until those land in a
release, the config below pulls them in directly via `external_components:` — remove that block
once both PRs are merged.

BMI270 also requires a large I2C buffer, hence the `build_flags: -DI2C_BUFFER_LENGTH=8193` under
`platformio_options`.

```yaml file=config.yaml
```

## Use Cases

- **IMU applications**: Motion sensing, orientation detection
- **Status displays**: Show sensor data or Home Assistant state on the built-in display
- **Compact IoT projects**: Small form factor with a display, IMU, and expansion port built in

## Resources

- [M5Stack AtomS3R Documentation](https://docs.m5stack.com/en/core/AtomS3R)
- [BMI270 Motion Platform](https://esphome.io/components/motion/bmi270/)
- [ESP32-S3 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf)
