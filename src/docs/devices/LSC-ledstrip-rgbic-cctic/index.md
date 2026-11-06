---
title: LSC Smart Connect Ledstrip RGBIC + CCTIC
date-published: 2025-09-05
type: light
standard: eu
board: bk72xx
difficulty: 4
---

## General Notes

This configuration is for the [LSC Smart Connect Ledstrip 3203632.1](https://www.action.com/nl-nl/p/3203632/lsc-smart-connect-ledstrip/)
which comes as a colour and white changing LED strip with controller, IR remote and transformer.

![LSC Smart Connect Ledstrip 3203632.1](https://community-assets.home-assistant.io/original/4X/d/8/7/d877da0dbfad26879514ee561a48a09a1b6a1b51.png)

## GPIO Pinout

| Pin    | Function      |
| ------ | ------------- |
| P16    | Data RGB and CCT leds |
| P8     | Power for LEDs|
| P9     | Button 1      |
| P24     | Button 2     |
| P28     | Button 3     |
| P26    | IR-Receiver   |
| ADC3   | Mic           |

## Complete guide and walktrough flashing process

This [guide](https://www.twoenter.nl/blog/en/smarthome-en/flash-lscs-addressable-led-strip-with-esphome-and-use-it-in-home-assistant/)
walks through all steps needed to flash and integrate in Home Assistant.

## Config

```yaml
esphome:
  name: lsc-32036322-l
  friendly_name: Lsc 3203632-1
bk72xx:
  board: generic-bk7231n-qfn32-tuya
# Enable logging
logger:
# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key
ota:
  - platform: esphome
    password: !secret OTApassword
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  # Enable fallback hotspot (captive portal) in case wifi connection fails
captive_portal:
web_server:
power_supply:
    id: led_power
    pin: P8
  
light:
  - platform: beken_spi_led_strip
    rgb_order: BRG
    id: RGBIC_CCTIC_ledstrip
    pin: P16
    num_leds: 50
    chipset: SM16703 
    name: None
    power_supply: led_power
    internal: true

### ALL RGB LEDS IN 1 LIGHT
  - platform: partition
    name: "RGB"
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
    segments:
      # RGB LEDS AT EVEN ADDRESSES
      - id: RGBIC_CCTIC_ledstrip
        from: 0
        to: 0
      - id: RGBIC_CCTIC_ledstrip
        from: 2
        to: 2
      - id: RGBIC_CCTIC_ledstrip
        from: 4
        to: 4
      - id: RGBIC_CCTIC_ledstrip
        from: 6
        to: 6
      - id: RGBIC_CCTIC_ledstrip
        from: 8
        to: 8
      - id: RGBIC_CCTIC_ledstrip
        from: 10
        to: 10
      - id: RGBIC_CCTIC_ledstrip
        from: 12
        to: 12
      - id: RGBIC_CCTIC_ledstrip
        from: 14
        to: 14
      - id: RGBIC_CCTIC_ledstrip
        from: 16
        to: 16
      - id: RGBIC_CCTIC_ledstrip
        from: 18
        to: 18
      - id: RGBIC_CCTIC_ledstrip
        from: 20
        to: 20
      - id: RGBIC_CCTIC_ledstrip
        from: 22
        to: 22
      - id: RGBIC_CCTIC_ledstrip
        from: 24
        to: 24
      - id: RGBIC_CCTIC_ledstrip
        from: 26
        to: 26
      - id: RGBIC_CCTIC_ledstrip
        from: 28
        to: 28
      - id: RGBIC_CCTIC_ledstrip
        from: 30
        to: 30
      - id: RGBIC_CCTIC_ledstrip
        from: 32
        to: 32
      - id: RGBIC_CCTIC_ledstrip
        from: 34
        to: 34
      - id: RGBIC_CCTIC_ledstrip
        from: 36
        to: 36
      - id: RGBIC_CCTIC_ledstrip
        from: 38
        to: 38
      - id: RGBIC_CCTIC_ledstrip
        from: 40
        to: 40
      - id: RGBIC_CCTIC_ledstrip
        from: 42
        to: 42
      - id: RGBIC_CCTIC_ledstrip
        from: 44
        to: 44
      - id: RGBIC_CCTIC_ledstrip
        from: 46
        to: 46
      - id: RGBIC_CCTIC_ledstrip
        from: 48
        to: 48

## ALL CCT LEDS IN 1 LIGHT
  - platform: partition
    name: CCT
    segments:
      # CCT LEDS AT ODD ADDRESSES
      # RED CHANNEL = WARM WHITE
      # BLUE CHANNEL = COLD WHITE
      - id: RGBIC_CCTIC_ledstrip
        from: 1
        to: 1
      - id: RGBIC_CCTIC_ledstrip
        from: 3
        to: 3
      - id: RGBIC_CCTIC_ledstrip
        from: 5
        to: 5
      - id: RGBIC_CCTIC_ledstrip
        from: 7
        to: 7
      - id: RGBIC_CCTIC_ledstrip
        from: 9
        to: 9
      - id: RGBIC_CCTIC_ledstrip
        from: 11
        to: 11
      - id: RGBIC_CCTIC_ledstrip
        from: 13
        to: 13
      - id: RGBIC_CCTIC_ledstrip
        from: 15
        to: 15
      - id: RGBIC_CCTIC_ledstrip
        from: 17
        to: 17
      - id: RGBIC_CCTIC_ledstrip
        from: 19
        to: 19
      - id: RGBIC_CCTIC_ledstrip
        from: 21
        to: 21
      - id: RGBIC_CCTIC_ledstrip
        from: 23
        to: 23
      - id: RGBIC_CCTIC_ledstrip
        from: 25
        to: 25
      - id: RGBIC_CCTIC_ledstrip
        from: 27
        to: 27
      - id: RGBIC_CCTIC_ledstrip
        from: 29
        to: 29
      - id: RGBIC_CCTIC_ledstrip
        from: 31
        to: 31
      - id: RGBIC_CCTIC_ledstrip
        from: 33
        to: 33
      - id: RGBIC_CCTIC_ledstrip
        from: 35
        to: 35
      - id: RGBIC_CCTIC_ledstrip
        from: 37
        to: 37
      - id: RGBIC_CCTIC_ledstrip
        from: 39
        to: 39
      - id: RGBIC_CCTIC_ledstrip
        from: 41
        to: 41
      - id: RGBIC_CCTIC_ledstrip
        from: 43
        to: 43
      - id: RGBIC_CCTIC_ledstrip
        from: 45
        to: 45
      - id: RGBIC_CCTIC_ledstrip
        from: 47
        to: 47
      - id: RGBIC_CCTIC_ledstrip
        from: 49
        to: 49
```
