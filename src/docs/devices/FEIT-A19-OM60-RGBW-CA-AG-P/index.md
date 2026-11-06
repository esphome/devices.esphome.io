---
title: FEIT A19 OM60/RGBW/CA/AG(P)
date-published: 2020-03-06
type: light
standard: us
board: esp8266
---

The Costco Variant:

```yaml
sm16716:
  data_pin: GPIO04
  clock_pin: GPIO05
  num_channels: 3
  num_chips: 1

output:
  - platform: sm16716
    id: output_red
    channel: 2
    power_supply: rgb_power
  - platform: sm16716
    id: output_green
    channel: 1
    power_supply: rgb_power
  - platform: sm16716
    id: output_blue
    channel: 0
    power_supply: rgb_power
  - platform: esp8266_pwm
    id: output_cold_white
    pin: GPIO12
  - platform: esp8266_pwm
    id: output_warm_white
    pin: GPIO14

light:
  - platform: rgbww
    name: "Bulb1"
    id: light1
    red: output_red
    green: output_green
    blue: output_blue
    cold_white: output_cold_white
    warm_white: output_warm_white
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K

power_supply:
  - id: rgb_power
    pin: GPIO13
```
