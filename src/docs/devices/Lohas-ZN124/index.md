---
title: Lohas LH-ZN124 5000K 10W Dimmable
date-published: 2019-11-21
type: light
standard: us
board: esp8266
---

## GPIO Pinout

| Pin    | Function |
| ------ | -------- |
| GPIO14 | Light    |

## Basic Configuration

```yaml
# Basic Config
# https://www.lohas-led.com/lohas-smart-led-light-bulbs-google-home-siri-and-iftttno-hub-required-e26-daylight-5000k-dimmable-2-pack-p0238-p0238.html
# https://www.amazon.com/dp/B07KSB1KHP

esphome:
  name: lightname

esp8266:
  board: esp01_1m
  restore_from_flash: true

wifi:
  ssid: "ssid"
  password: "password"

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "light Fallback Hotspot"
    password: "1234567890"

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:

web_server:

output:
  - platform: esp8266_pwm
    id: pwm_output
    # frequency: 1000 Hz
    pin: GPIO14

light:
  - platform: monochromatic
    name: "lightname"
    default_transition_length: 1s
    output: pwm_output
```
