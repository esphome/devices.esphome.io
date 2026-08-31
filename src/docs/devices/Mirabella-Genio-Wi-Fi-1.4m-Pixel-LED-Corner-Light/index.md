---
title: Mirabella Genio Wi-Fi 1.4m Pixel LED Corner Light
date-published: 2024-07-13
type: light
standard: au
board: rtl87xx
made-for-esphome: False
---

## General Notes

The [Mirabella Genio Wi-Fi 1.4m Pixel LED Corner Light][3] is a Tuya-based smart home lamp, featuring a strip of
individually addressable leds with a corner stand frame.

[3]: https://www.mirabellagenio.com.au/product-range/mirabella-genio-wi-fi-1-4m-pixel-led-corner-light/

![Mirabella Genio Wi-Fi 1.4m Pixel LED Corner Light][1]

They are sold at [Kmart NZ](https://www.kmart.co.nz/product/mirabella-genio-wi-fi-1.4m-pixel-led-corner-light-43205363/)
and [Kmart AU](https://www.kmart.com.au/product/mirabella-genio-wi-fi-14m-pixel-led-corner-light-43205363/).

Inside is a [T103_V1.0](https://docs.libretiny.eu/boards/t103-v1.0/) module based on the RTL8710BX MCU. This
is prossible to reflash using [LibreTiny](https://docs.libretiny.eu/docs/platform/realtek-ambz/), but both FastLED and NeoPixelBus led drivers are unsupported on this platform so it's not possible to drive the LEDs.

![Mirabella Genio Wi-Fi 1.4m Pixel LED Corner Light Teardown][2]

## GPIO Pinout

| Pin   | Function          |
| ----- | ----------------- |
| PA12  | PWR Push Button   |
| PA05  | LED Push Button   |
| PA00  | Sound Push Button |
| PA23? | Light - Data      |

## Basic Configuration

```yaml
# Config for Mirabella Genio Wi-Fi 1.4m Pixel LED Corner Light
# https://devices.esphome.io/devices/Mirabella-Genio Wi-Fi-1.4m-Pixel-LED-Corner-Light/

rtl87xx:
  board: t103-v1.0

binary_sensor:
  - platform: gpio
    pin:
      number: PA12
      mode: INPUT_PULLUP
      inverted: true
    name: "Power Button"
    on_press:
      - light.toggle: corner_light

  - platform: gpio
    pin:
      number: PA05
      mode: INPUT_PULLUP
      inverted: true
    name: "LED Button"
    on_press:
      - light.toggle: corner_light

  - platform: gpio
    pin:
      number: PA00
      mode: INPUT_PULLUP
      inverted: true
    name: "Sound Button"
    on_press:
      - switch.toggle: sound_reactive_mode

switch:
  - platform: template
    name: "Sound Reactive Mode"
    id: sound_reactive_mode
    optimistic: true
    restore_mode: RESTORE_DEFAULT_OFF

sensor:
  - platform: adc
    pin: ADC2
    name: "Microphone Raw"
    id: mic_raw
    update_interval: 50ms

light:
  - platform: fastled_clockless
    id: corner_light
    name: "Corner Light"
    chipset: UCS1903
    pin: PA23
    rgb_order: BRG
    num_leds: 28
    restore_mode: RESTORE_DEFAULT_OFF
    default_transition_length: 0s
    effects:
      - addressable_rainbow:
      - pulse:
```

[1]: ./Mirabella-Genio-Wi-Fi-1.4m-Pixel-LED-Corner-Light-Packaging.png "Mirabella Genio Wi-Fi 1.4m Pixel LED Corner Light"
[2]: ./Mirabella-Genio-Wi-Fi-1.4m-Pixel-LED-Corner-Light-Teardown.jpg "Mirabella Genio Wi-Fi 1.4m Pixel LED Corner Light Teardown"
