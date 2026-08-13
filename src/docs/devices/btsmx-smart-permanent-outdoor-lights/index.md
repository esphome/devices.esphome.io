---
title: "BTSMX Smart Permanent Outdoor Lights"
date-published: 2026-08-13
type: light
standard: US
board: bk72xx
---

## General Notes

This setup was modeled after the [BTSMX Outdoor LED String Lights](https://www.amazon.com/Permanent-Waterproof-Christmas-Halloween-Assistant/dp/B0FNNGRVLK) which are advertised as Tuya/SmartHome compatible with RGB+IC addressing. Many other such clones are likely compatible with this setup, since the box has absolutely no branding.

## Basic Configuration

```yaml
# Board: Generic - BK7238 (Tuya T1)
# Definition: definitions/boards/generic-bk7238-tuya/manifest.yaml

esphome:
  name: porch-led-string
  friendly_name: Porch LED String

bk72xx:
  board: generic-bk7238-tuya

logger:

api:
  encryption:
    key: !secret porch_led_string__encryption_key

ota:
  - platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

mdns:

power_supply:
  - id: led_power
    pin: P6
  
light:
  - platform: beken_spi_led_strip
    name: "LED Strip"
    pin: P16
    chipset: SM16703
    num_leds: 24
    rgb_order: RBG
    power_supply: led_power
    effects:
     - random:
     - pulse:
     - strobe:
     - flicker:
     - addressable_rainbow:
     - addressable_color_wipe:
     - addressable_scan:
     - addressable_twinkle:
     - addressable_random_twinkle:
     - addressable_fireworks:

```
