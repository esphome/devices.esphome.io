---
title: Mirabella Genio Monochromatic Bulbs
date-published: 2023-04-12
type: light
standard: global
board: esp8266
---

The Mirabella Genio is a Tuya-based smart bulb sold by Kmart in
Australia.

![mirabella-genio](./mirabella-genio-b22-rgbw.jpg)

## Basic Configuration

The brightness of the bulb can be controlled using the `esp8266_pwm`
output component.

``` yaml
esp8266:
  board: esp01_1m

light:
  - platform: monochromatic
    name: "Mirabella Genio Smart Bulb"
    id: light
    output: output_component1

    # Ensure the light turns on by default if the physical switch is actuated.
    restore_mode: ALWAYS_ON

output:
  - platform: esp8266_pwm
    id: output_component1
    # May need to use GPIO14 instead for certain globes
    pin: GPIO13
```
