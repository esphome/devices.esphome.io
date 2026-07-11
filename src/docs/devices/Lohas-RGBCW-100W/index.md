---
title: Lohas LH-ZN006 RGBCW 100W Equiv Dimmable
date-published: 2019-11-21
type: light
standard: us
board: esp8266
---

## Update Warning

New versions with the same model do not have ESP chips in them, and can't be flashed with ESPHome.

## GPIO Pinout

| Pin       | Function      |
| --------- | ------------- |
| GPIO13    | Data channel  |
| GPIO15    | Clock channel |
| Channel 0 | CW0 channel   |
| Channel 1 | CW1 channel   |
| Channel 2 | CW2 channel   |
| Channel 3 | Blue channel  |
| Channel 4 | Green channel |
| Channel 5 | Red channel   |

## Basic Configuration

```yaml
#
# Better description of config nuances from https://github.com/digiblur/ESPHome_LOHAS_LED
#
#
# Basic Config
# https://www.lohas-led.com/lohas-smart-led-bulb-a21-e26-100w-equivalent-14w-rgb-cool-white-dimmable-wifi-app-controlled-alexa-google-assistant-compatible-p0230-p0230.html
# https://www.amazon.com/dp/B07P6M2FT3
esphome:
  name: light_name
  includes:
    - copychan3.h
    # See https://github.com/digiblur/ESPHome_LOHAS_LED for details on copychan3.h

esp8266:
  board: esp01_1m
  restore_from_flash: true

substitutions:
  display_name: LightName

wifi:
  ssid: "ssid"
  password: "password"

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "Light Fallback Hotspot"
    password: "1234567890"

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:

web_server:

my9231:
  data_pin: GPIO13
  clock_pin: GPIO15
  num_channels: 6
  num_chips: 2

output:
  - platform: my9231
    id: output_blue
    channel: 3
  - platform: my9231
    id: output_red
    channel: 5
  - platform: my9231
    id: output_green
    channel: 4
  - platform: my9231
    id: output_cw0
    channel: 0
  - platform: my9231
    id: output_cw1
    channel: 1
  - platform: my9231
    id: output_cw2
    channel: 2
  - platform: custom
    type: float
    lambda: |-
      auto *copy = new CopyOutput();
      copy->channel_a = id(output_cw0);
      copy->channel_b = id(output_cw1);
      copy->channel_c = id(output_cw2);
      return {copy};
    outputs:
      - id: cw

light:
  - platform: rgbw
    name: lightname
    default_transition_length: 0s
    red: output_red
    green: output_green
    blue: output_blue
    white: cw
```
