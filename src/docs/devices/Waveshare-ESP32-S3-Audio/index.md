---
title: Waveshare ESP32-S3 Audio Board
date-published: 2026-04-04
type: misc
standard: global
board: esp32
project-url: https://github.com/jensenbox/waveshare-esp32-s3-audio
---

![Waveshare ESP32-S3 Audio Board](https://www.waveshare.com/media/catalog/product/cache/1/image/800x800/9df78eab33525d08d6e5fb8d27136e95/e/s/esp32-s3-audio-board-1.jpg "Waveshare ESP32-S3 Audio Board")

## Product Description

The [Waveshare ESP32-S3 Audio Board](https://www.waveshare.com/esp32-s3-audio-board.htm) is a compact development board built around the ESP32-S3R8 module, designed for audio applications such as voice assistants, media players, and intercom systems. It integrates a quad-channel audio ADC (ES7210), a mono audio DAC/codec (ES8311), a Class-D speaker amplifier (NS4150B), a 7-LED WS2812B RGB ring, an RTC, and a TCA9555 I/O expander. Optional accessories include SPI/QSPI displays (1.47" to 3.5"), a DVP camera module, and an SD card.

## Hardware Specs

| Spec | Detail |
|------|--------|
| MCU | ESP32-S3R8 (dual-core Xtensa LX7, 240 MHz) |
| Flash | 16 MB (QIO, 80 MHz) |
| PSRAM | 8 MB (Octal, 80 MHz) |
| Wi-Fi | 2.4 GHz 802.11 b/g/n |
| Bluetooth | 5 (LE) |
| Audio ADC | ES7210 (4-channel, I2C 0x40) |
| Audio DAC | ES8311 (mono codec, I2C 0x18) |
| Speaker Amp | NS4150B (mono Class-D) |
| I/O Expander | TCA9555PWR (16-bit, I2C 0x20) |
| RTC | PCF85063 (I2C 0x51) |
| LEDs | 7x WS2812B RGB ring (GPIO38) |
| Buttons | BOOT (GPIO0) + 3 keys via TCA9555 |
| Power | USB-C 5V, 3.7V lithium battery (MX1.25), DC-DC buck 3.3V/2A |

## GPIO Pinout

### I2C Bus

| Function | GPIO |
|----------|------|
| SCL | GPIO10 |
| SDA | GPIO11 |

### I2S Audio Bus

| Function | GPIO |
|----------|------|
| MCLK | GPIO12 |
| BCLK | GPIO13 |
| LRCLK | GPIO14 |
| DIN (mic data in) | GPIO15 |
| DOUT (speaker data out) | GPIO16 |

### LED and Misc

| Function | GPIO |
|----------|------|
| WS2812B LED Ring | GPIO38 |
| BOOT Button | GPIO0 |
| Battery ADC | GPIO8 |
| USB D- | GPIO19 |
| USB D+ | GPIO20 |

### LCD (18-pin FPC)

| Function | GPIO |
|----------|------|
| CS | GPIO3 |
| SCLK | GPIO4 |
| Backlight | GPIO5 |
| SDA0 / MOSI | GPIO9 |
| SDA1 / MISO | GPIO8 |
| SDA2 / DC | GPIO7 |
| SDA3 | GPIO6 |

### SD Card (SDMMC 1-bit)

| Function | GPIO |
|----------|------|
| CLK | GPIO40 |
| CMD | GPIO42 |
| D0 | GPIO41 |

### TCA9555 I/O Expander Pin Assignments

| Pin | EXIO | Function |
|-----|------|----------|
| 0 | EXIO00 | LCD Reset |
| 1 | EXIO01 | Touch Panel Reset |
| 2 | EXIO02 | Touch Panel Interrupt |
| 3 | EXIO03 | SD Card CS |
| 4 | EXIO04 | Reserved |
| 5 | EXIO05 | Camera Power Down (active low) |
| 6 | EXIO06 | Camera Select (HIGH=Tx/Rx, LOW=USB) |
| 7 | EXIO07 | Camera/USB GPIO mux control |
| 8 | EXIO08 | Speaker amplifier enable (PA_CTRL) |
| 9 | EXIO09 | Key1 button (active low) |
| 10 | EXIO10 | Key2 button (active low) |
| 11 | EXIO11 | Key3 button (active low) |
| 12-15 | EXIO12-15 | Expansion header |

## I2C Devices

| Device | Address | Function |
|--------|---------|----------|
| ES8311 | 0x18 | Audio DAC (speaker output) |
| ES7210 | 0x40 | Audio ADC (microphone input) |
| TCA9555 | 0x20 | 16-bit I/O expander |
| PCF85063 | 0x51 | Real-time clock |

## Basic ESPHome Configuration

This minimal configuration sets up the audio hardware (microphone, speaker, DAC/ADC), the LED ring, buttons, and a voice assistant with on-device wake word detection. Note that `use_wake_word` is set to `false` because `micro_wake_word` handles wake word detection directly. Wake word restart happens in `on_tts_stream_end` (after the speaker finishes playing TTS audio) rather than `on_end`, which avoids an I2S bus conflict where restarting the microphone in `on_end` would preempt the speaker. For a full-featured configuration with LED animations for each voice assistant state, see the [project repository](https://github.com/jensenbox/waveshare-esp32-s3-audio).

```yaml
esphome:
  name: waveshare-audio
  friendly_name: Waveshare Audio

esp32:
  board: esp32-s3-devkitc-1
  variant: esp32s3
  flash_size: 16MB
  framework:
    type: esp-idf

psram:
  mode: octal
  speed: 80MHz

logger:
  level: DEBUG

api:
  encryption:
    key: !secret api_encryption_key

ota:
  - platform: esphome
    password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "Waveshare Audio Fallback"
    password: !secret fallback_ap_password

captive_portal:

# --- I2C bus (shared by ES8311, ES7210, TCA9555, PCF85063) ---
i2c:
  scl: GPIO10
  sda: GPIO11

# --- RTC ---
time:
  - platform: pcf85063
    id: pcf85063_time

# --- I2S audio bus ---
i2s_audio:
  - id: i2s_audio_bus
    i2s_mclk_pin: GPIO12
    i2s_bclk_pin: GPIO13
    i2s_lrclk_pin: GPIO14

# --- Audio ADC (ES7210 quad-channel mic input) ---
audio_adc:
  - platform: es7210
    id: es7210_adc

# --- Microphone ---
microphone:
  - platform: i2s_audio
    id: mic
    i2s_audio_id: i2s_audio_bus
    i2s_din_pin: GPIO15
    adc_type: external

# --- Audio DAC (ES8311 speaker output) ---
audio_dac:
  - platform: es8311
    id: es8311_dac

# --- Speaker ---
speaker:
  - platform: i2s_audio
    id: spkr
    i2s_audio_id: i2s_audio_bus
    i2s_dout_pin: GPIO16
    dac_type: external
    audio_dac: es8311_dac

# --- TCA9555 I/O expander ---
tca9555:
  - id: exio
    address: 0x20

# --- Speaker amplifier enable (TCA9555 pin 8) ---
switch:
  - platform: gpio
    id: pa_enable
    name: "Speaker Amplifier"
    pin:
      tca9555: exio
      number: 8
      mode: OUTPUT
    restore_mode: ALWAYS_ON

# --- Media player ---
media_player:
  - platform: speaker
    id: audio_player
    name: "Audio Player"
    announcement_pipeline:
      speaker: spkr
    on_announcement:
      - micro_wake_word.stop:
      - delay: 500ms
      - wait_until:
          not:
            media_player.is_announcing:
      - delay: 500ms
      - lambda: id(va).set_use_wake_word(false);
      - micro_wake_word.start:

# --- Buttons via TCA9555 ---
binary_sensor:
  - platform: gpio
    name: "Key1"
    pin:
      tca9555: exio
      number: 9
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "Key2"
    pin:
      tca9555: exio
      number: 10
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "Key3"
    pin:
      tca9555: exio
      number: 11
      mode: INPUT
      inverted: true

# --- WS2812B LED ring ---
light:
  - platform: esp32_rmt_led_strip
    id: rgb_ring
    name: "RGB Ring"
    pin: GPIO38
    num_leds: 7
    chipset: ws2812
    rgb_order: RGB

# --- Fallback script: restarts wake word after silent commands ---
# When a voice command produces no TTS response, on_tts_stream_end never
# fires, so the wake word engine stays stopped. This script is called from
# on_end as a safety net: it waits 5 s (giving on_tts_stream_end time to
# act first), then restarts wake word only if it is not already running.
script:
  - id: restart_mww_fallback
    mode: restart
    then:
      - delay: 5s
      - if:
          condition:
            not:
              micro_wake_word.is_running:
          then:
            - wait_until:
                not:
                  speaker.is_playing:
            - delay: 500ms
            - lambda: id(va).set_use_wake_word(false);
            - micro_wake_word.start:

# --- Wake word + voice assistant ---
micro_wake_word:
  id: mww
  microphone: mic
  vad:
    model: github://esphome/micro-wake-word-models/models/v2/vad.json
  models:
    - model: okay_nabu
  on_wake_word_detected:
    - voice_assistant.start:
        wake_word: !lambda return wake_word;

voice_assistant:
  id: va
  microphone: mic
  speaker: spkr
  micro_wake_word: mww
  use_wake_word: false
  noise_suppression_level: 2
  volume_multiplier: 2.0

  on_client_connected:
    - delay: 2s
    - lambda: id(va).set_use_wake_word(false);
    - micro_wake_word.start:

  on_tts_stream_end:
    - wait_until:
        not:
          speaker.is_playing:
    - delay: 500ms
    - lambda: id(va).set_use_wake_word(false);
    - micro_wake_word.start:

  on_end:
    - light.turn_off: rgb_ring
    - script.execute: restart_mww_fallback

  on_error:
    - wait_until:
        not:
          speaker.is_playing:
    - lambda: id(va).set_use_wake_word(false);
    - micro_wake_word.start:
```

## Links

- [Waveshare Product Page](https://www.waveshare.com/esp32-s3-audio-board.htm)
- [Waveshare Wiki](https://www.waveshare.com/wiki/ESP32-S3-AUDIO-Board)
- [ESPHome Configuration Project](https://github.com/jensenbox/waveshare-esp32-s3-audio)
