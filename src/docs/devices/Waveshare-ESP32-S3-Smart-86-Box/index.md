---
title: Waveshare ESP32-S3 Smart 86 Box
date-published: 2026-05-22
type: misc
standard: global
board: esp32
project-url: https://github.com/salnajjar/Waveshare-ESP32-S3-Smart-86-Box-ESPHome-Home-Assistant
made-for-esphome: false
difficulty: 2
---

## Product Description

The Waveshare ESP32-S3 Smart 86 Box is a wall-panel style ESP32-S3 device with a 4 inch
480x480 capacitive touch display, ES7210 microphone ADC, ES8311 speaker DAC, onboard
speaker, 16MB flash, 8MB octal PSRAM, Wi-Fi, Bluetooth, and an AXP2101 power-management IC.

This base configuration covers the onboard display, GT911 touchscreen, backlight, I2C expander,
ES7210 microphone input, ES8311 speaker output, speaker amplifier enable, Wi-Fi fallback hotspot,
GPIO0 boot button, and the AXP2101 power key.

## Product Specs

| Feature | Spec |
| ------- | ---- |
| CPU | ESP32-S3 |
| Flash | 16MB |
| PSRAM | 8MB octal |
| Display | 4 inch 480x480 MIPI RGB LCD |
| Touchscreen | GT911 capacitive touch |
| Audio input | ES7210 ADC |
| Audio output | ES8311 DAC and onboard speaker |
| I/O expander | PCA9554 |
| Power management | AXP2101 |

## Basic Configuration

The base configuration below defines the device hardware. Add your own `api:`, `ota:`, and any
Home Assistant specific voice-assistant configuration before flashing.

```yaml file=config.yaml
```

## Full Voice Assistant Firmware

A full Home Assistant voice-assistant configuration with display pages, wake word support,
Bluetooth proxy, OTA progress display, timer UI, volume controls, and diagnostics is maintained
in the linked project repository.

## GPIO Pinout

| GPIO | Function |
| ---- | -------- |
| GPIO0 | BOOT / volume button |
| GPIO1 | Display red data |
| GPIO2 | Display red data |
| GPIO3 | Display VSYNC |
| GPIO4 | Backlight PWM |
| GPIO5 | I2S MCLK |
| GPIO6 | I2S DOUT to ES8311 |
| GPIO7 | I2S LRCLK |
| GPIO8 | Display green data |
| GPIO9 | Display PCLK |
| GPIO10-GPIO14 | Display blue data |
| GPIO15 | I2S DIN from ES7210 |
| GPIO16 | I2S BCLK |
| GPIO17 | Display DE |
| GPIO18 | Display green data |
| GPIO21 | Display green data |
| GPIO38-GPIO39 | Display green data |
| GPIO40-GPIO42 | Display red data |
| GPIO45 | Display green data |
| GPIO46 | Display HSYNC |
| GPIO47 | I2C SDA |
| GPIO48 | I2C SCL |

## Notes

- The display reset, display SPI control lines, and speaker amplifier enable are driven through
  the PCA9554 I/O expander.
- The speaker amplifier must be enabled before audio will play.
- The AXP2101 power key uses a small external ESPHome component from the linked project repository.
- PSRAM is required for reliable display and audio operation.
