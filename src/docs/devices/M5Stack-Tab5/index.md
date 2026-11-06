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

## Hardware Revisions

M5Stack has shipped the Tab5 with three display drivers ([change log](https://docs.m5stack.com/en/core/Tab5)).
The chip is printed on the sticker on the back.

- **ILI9881C + GT911** (units made before 14 October 2025): the base configuration below.
- **ST7123** (units made from 14 October 2025): ESPHome 2026.7.0 or later. Use the `display:` and `touchscreen:`
  sections from [ST7123 Revision](#st7123-revision) in place of the ones in the base configuration.
- **ST7121** (units made from 28 April 2026): ESPHome 2026.7.0 or later. Use the `display:` and `touchscreen:`
  sections from [ST7121 Revision](#st7121-revision) in place of the ones in the base configuration.

Some units carry a pre-production ESP32-P4 (chip revision below v3.0). Those need `engineering_sample: true` under
`esp32:`. ESPHome prints a warning about this when compiling, with how to check the chip revision.

## Example Configuration

The base configuration below covers all of the on-board hardware: the ESP32-P4, the ESP32-C6 hosted Wi-Fi
co-processor, the MIPI DSI display and GT911 touchscreen, the ES8388 DAC + ES7210 ADC audio path, the RX8130
RTC, the PI4IOE5V6408 IO expanders, and the INA226 battery monitor. Add your own `wifi:`, `api:`, and `ota:`
sections (or include them via `!include`/packages) before flashing.

```yaml file=config.yaml
```

## ST7123 Revision

Display and touchscreen sections for units with the ST7123 display driver. They replace the `display:` and
`touchscreen:` sections of the base configuration above.

```yaml file=st7123.yaml
```

## ST7121 Revision

Display and touchscreen sections for units with the ST7121 display driver. They replace the `display:` and
`touchscreen:` sections of the base configuration above. There is no ST7121 touchscreen platform: the `st7123` one
is used, a pairing reported working on ST7121 units (display and touch) in
[esphome/esphome#17471](https://github.com/esphome/esphome/issues/17471).

```yaml file=st7121.yaml
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
