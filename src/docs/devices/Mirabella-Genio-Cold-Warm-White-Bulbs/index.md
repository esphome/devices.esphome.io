---
title: Mirabella Genio Cold + Warm White Bulbs
date-published: 2023-04-12
type: light
standard: global
board: esp8266
---

The Mirabella Genio is a Tuya-based smart bulb sold by Kmart in
Australia.

![mirabella-genio](./mirabella-genio-b22-rgbw.jpg)

## Basic Configuration

``` yaml
esp8266:
  board: esp01_1m

output:
  - platform: esp8266_pwm
    id: output_warm_white
    pin: GPIO13
  - platform: esp8266_pwm
    id: output_daylight
    pin: GPIO5

light:
  - platform: cwww
    name: "Mirabella Genio Smart Bulb"
    id: light
    cold_white: output_daylight
    warm_white: output_warm_white
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K

    # Ensure the light turns on by default if the physical switch is actuated.
    restore_mode: ALWAYS_ON
```
