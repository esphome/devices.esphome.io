---
title: M5Stack Tab5
date-published: 2025-09-01
type: misc
standard: global
board: esp32
project-url: https://docs.m5stack.com/en/core/Tab5
---

## Description

The M5Stack Tab5 is a self contained, optionally battery powered 5 inch touchscreen display with an ESP32-P4 at the heart.
It has an ESP32-C6 co-processor that gives the P4 Wi-Fi capabilities.

The Tab5 has many peripherals built in including but not limited to:

- Display
- Touchscreen
- Microphone
- Speaker
- Camera
- IMU
- RTC

## Note

Only the original hardware revision (with the ILI9881C display driver and GT911 touchscreen) is currently
supported. Later revisions using the ST7123 or ST7121 display drivers are not yet supported.

## Example Configuration

The base configuration below covers all of the on-board hardware: the ESP32-P4, the ESP32-C6 hosted Wi-Fi
co-processor, the MIPI DSI display and GT911 touchscreen, the ES8388 DAC + ES7210 ADC audio path, the RX8130
RTC, the PI4IOE5V6408 IO expanders, and the INA226 battery monitor. Add your own `wifi:`, `api:`, and `ota:`
sections (or include them via `!include`/packages) before flashing.

```yaml file=config.yaml
```

## WiFi Antenna Selector

A template select that exposes the on-board antenna switch as an "Internal" / "External" option rather than the
raw GPIO toggle.

```yaml file=wifi-antenna.yaml
```

## Battery Percentage

A template sensor that derives a 0–100% reading from the INA226 battery voltage. Adjust the min/max voltages to
match your specific cell.

```yaml file=battery-percentage.yaml
```

## Voice Assistant

The voice assistant configuration below adds a `media_player`, `micro_wake_word`, and `voice_assistant` on top of
the audio hardware defined in the base config.

```yaml file=voice-assistant.yaml
```
