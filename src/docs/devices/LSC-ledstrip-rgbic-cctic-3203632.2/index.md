---
title: LSC Smart Connect Ledstrip RGBIC + CCTIC (3203632.2)
date-published: 2026-11-09
type: light
standard: eu
board: bk72xx
difficulty: 4
---

## General Notes

This is the newer revision of the [LSC Smart Connect Ledstrip RGBIC + CCTIC](/devices/LSC-ledstrip-rgbic-cctic/) (Action article 3203632). The strip itself looks the same, but the controller board is different and so is the pinout, so the config for the 3203632.1 leaves this one completely dark.

How to recognise it: the controller PCB is marked `RGBMICIR_V1.0 2024.06.21` and it has a 3-pin connector to the strip (GND / DO / V+). The BK7231N is soldered directly on the board.

The strip has 25 segments of 20 cm. Each segment has two SM16703 chips: one for the RGB LEDs (even addresses) and one for the white LEDs (odd addresses), so 50 addresses in total. On the white chips, channel 1 is unused, channel 2 is warm white and channel 3 is cold white.

## GPIO Pinout

| Pin | Function |
| --- | -------- |
| P16 | Data (SM16703, colour order RBG) |
| P22 | 24 V power for the strip (high = on) |
| P26 | IR receiver (not tested) |

Microphone and button pins are not known yet.

## Flashing

The Tuya firmware (1.0.2 on my unit) is not supported by tuya-cloudcutter, so it has to be flashed over UART. The back of the board has labelled pads: CEN, 1TX, 1RX, 2TX, GND, 3.3V, P21, P1. Use 1TX, 1RX, 3.3V and GND, with the 24 V supply disconnected. I used ltchiptool with a CP2102 adapter, and restarted the chip by briefly disconnecting 3.3V.

## Notes

- The white LEDs are exposed as a real colour temperature light: a `cwww` light drives two template outputs, which set an internal partition of the odd addresses (blue = warm, green = cold).
- The `e131` effect on the RGB partition works for ambilight with HyperHDR or Hyperion (25 RGB pixels, universe 1). For that use, `gamma_correct: 1.0` on the RGB partition helps: with the default 2.8, dim colours almost disappear.
- Pinout first reported in the [Home Assistant community](https://community.home-assistant.io/t/using-lsc-3203632-1-rgbic-cctic-ledstrip-with-esphome/812822/35) and in an [OpenBeken template on Elektroda](https://www.elektroda.com/rtvforum/topic4136779.html).

## Configuration

```yaml
esphome:
  name: lsc-3203632-2
  friendly_name: LSC LED strip

bk72xx:
  board: generic-bk7231n-qfn32-tuya

logger:

api:
  encryption:
    key: !secret api_encryption_key

ota:
  - platform: esphome
    password: !secret ota_password

# BK7231N is 2.4 GHz only
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    password: !secret fallback_ap_password

captive_portal:

web_server:

# E1.31 (sACN) receiver, e.g. for HyperHDR / Hyperion: universe 1, 25 RGB pixels
e131:
  method: unicast

power_supply:
  - id: led_power
    pin: P22

globals:
  - id: cw_level
    type: float
    initial_value: "0.0"
  - id: ww_level
    type: float
    initial_value: "0.0"

# The white chips are driven as an internal RGB partition (blue = warm, green = cold).
# A cwww light on top of it gives Home Assistant a real colour-temperature light.
output:
  - platform: template
    id: out_cold
    type: float
    write_action:
      - lambda: |-
          id(cw_level) = state;
          id(apply_whites).execute();
  - platform: template
    id: out_warm
    type: float
    write_action:
      - lambda: |-
          id(ww_level) = state;
          id(apply_whites).execute();

script:
  - id: apply_whites
    mode: queued
    max_runs: 4
    then:
      - lambda: |-
          const float c = id(cw_level), w = id(ww_level);
          const float m = std::max(c, w);
          if (m <= 0.001f) {
            auto call = id(whites_raw).turn_off();
            call.set_transition_length(0);
            call.perform();
            return;
          }
          auto call = id(whites_raw).turn_on();
          call.set_transition_length(0);
          call.set_brightness(m);
          call.set_rgb(0.0f, c / m, w / m);
          call.perform();

light:
  - platform: beken_spi_led_strip
    id: strip
    pin: P16
    num_leds: 50
    channel_colors: RBG
    chipset: SM16703
    power_supply: led_power
    internal: true
    default_transition_length: 0s

  - platform: partition
    id: rgb
    name: "RGB"
    # Linear output: HyperHDR does its own gamma; ESPHome's default 2.8 crushed dim screen colours
    gamma_correct: 1.0
    effects:
      - e131:
          name: "HyperHDR (E1.31)"
          universe: 1
          channels: RGB
      - addressable_rainbow:
      - addressable_color_wipe:
      - addressable_scan:
      - addressable_twinkle:
      - addressable_fireworks:
    segments:
      - {id: strip, from: 0, to: 0}
      - {id: strip, from: 2, to: 2}
      - {id: strip, from: 4, to: 4}
      - {id: strip, from: 6, to: 6}
      - {id: strip, from: 8, to: 8}
      - {id: strip, from: 10, to: 10}
      - {id: strip, from: 12, to: 12}
      - {id: strip, from: 14, to: 14}
      - {id: strip, from: 16, to: 16}
      - {id: strip, from: 18, to: 18}
      - {id: strip, from: 20, to: 20}
      - {id: strip, from: 22, to: 22}
      - {id: strip, from: 24, to: 24}
      - {id: strip, from: 26, to: 26}
      - {id: strip, from: 28, to: 28}
      - {id: strip, from: 30, to: 30}
      - {id: strip, from: 32, to: 32}
      - {id: strip, from: 34, to: 34}
      - {id: strip, from: 36, to: 36}
      - {id: strip, from: 38, to: 38}
      - {id: strip, from: 40, to: 40}
      - {id: strip, from: 42, to: 42}
      - {id: strip, from: 44, to: 44}
      - {id: strip, from: 46, to: 46}
      - {id: strip, from: 48, to: 48}

  - platform: partition
    id: whites_raw
    name: "White chips (raw)"
    internal: true
    gamma_correct: 1.0
    default_transition_length: 0s
    segments:
      - {id: strip, from: 1, to: 1}
      - {id: strip, from: 3, to: 3}
      - {id: strip, from: 5, to: 5}
      - {id: strip, from: 7, to: 7}
      - {id: strip, from: 9, to: 9}
      - {id: strip, from: 11, to: 11}
      - {id: strip, from: 13, to: 13}
      - {id: strip, from: 15, to: 15}
      - {id: strip, from: 17, to: 17}
      - {id: strip, from: 19, to: 19}
      - {id: strip, from: 21, to: 21}
      - {id: strip, from: 23, to: 23}
      - {id: strip, from: 25, to: 25}
      - {id: strip, from: 27, to: 27}
      - {id: strip, from: 29, to: 29}
      - {id: strip, from: 31, to: 31}
      - {id: strip, from: 33, to: 33}
      - {id: strip, from: 35, to: 35}
      - {id: strip, from: 37, to: 37}
      - {id: strip, from: 39, to: 39}
      - {id: strip, from: 41, to: 41}
      - {id: strip, from: 43, to: 43}
      - {id: strip, from: 45, to: 45}
      - {id: strip, from: 47, to: 47}
      - {id: strip, from: 49, to: 49}

  - platform: cwww
    id: whites
    name: "White"
    cold_white: out_cold
    warm_white: out_warm
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
    constant_brightness: false
```
