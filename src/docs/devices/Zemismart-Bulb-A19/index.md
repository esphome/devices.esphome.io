---
title: Zemismart 6W A19 Bulb
date-published: 2019-11-26
type: light
standard: eu
board: esp8266
---

RGBW smart light bulb, A19 shape, E27 base, RGB colors + cold white, 100-240V AC 50/60Hz, natively Tuya/Smart Life,
works with Tuya-convert to flash to ESPHome.

## GPIO Pinout

| Pin    | Function         |
| ------ | ---------------- |
| GPIO13 | my9231 data pin  |
| GPIO15 | my9231 clock pin |

## Basic Configuration

```yaml
#https://www.zemismart.com/zemismart-e27-6w-wifi-rgbw-led-bulb-light-compatible-with-echo-alexa-google-home-remote-control-by-ios-amp-android-app-with-feedback-white-color-p0040-p0040.html
substitutions:
  dev_name: zemismart_bulb_a19_001

esphome:
  name: ${dev_name}

esp8266:
  board: esp01_1m

wifi:

# Enable logging
logger:

api:

ota:

switch:
  - platform: shutdown
    name: "${dev_name}_shutdown"
  - platform: restart
    name: "${dev_name}_restart"

my9231:
  data_pin: GPIO13
  clock_pin: GPIO15
  num_channels: 4
  num_chips: 1

output:
  - platform: my9231
    id: output_white
    channel: 0
  - platform: my9231
    id: output_blue
    channel: 1
  - platform: my9231
    id: output_green
    channel: 2
  - platform: my9231
    id: output_red
    channel: 3

light:
  - platform: rgbw
    id: light_01
    name: "${dev_name}_light"
    default_transition_length: 0s
    restore_mode: ALWAYS_ON #Start with light on after reboot/power-loss event, so that it works from a dumb lightswitch
    red: output_red
    green: output_green
    blue: output_blue
    white: output_white

sensor:
  - platform: wifi_signal
    name: "${dev_name}_wifi_signal"
    update_interval: 30s
  - platform: uptime
    name: "${dev_name}_uptime"
    update_interval: 120s

text_sensor:
  - platform: version
    name: "${dev_name}_version"
```
