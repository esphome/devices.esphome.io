---
title: Mirabella Genio Wi-Fi Dimmable 9W LED CCT Downlight I002741
date-published: 2025-05-24
type: light
standard: au
board: bk72xx
made-for-esphome: False
---

## General Notes

[Mirabella Genio Wi-Fi Dimmable 9W LED CCT Downlight](https://www.mirabellagenio.com.au/product-range/mirabella-genio-wi-fi-dimmable-9w-led/)

![Mirabella Genio Wi-Fi Dimmable 9W LED CCT Downlight](Mirabella-Genio-Downlight-9W-I002741.jpg 'Mirabella Genio Wi-Fi Dimmable 9W LED CCT Downlight')

This contains a Tuya Beken Chip CB2L which can be flashed with [ESPHome](https://esphome.io/) and a USB to UART
converter by soldering to the RX and TX pads on the back of the board, plus VCC and GND pins. It is not necassary to
remove the CB2L chip from the unit to flash it.

It might be possible to flash (especially older units) [OTA using tuya-convert](/devices/tuya-convert). If you attempt
to flash a current unit OTA, you should update this page specify if it's still possible or not.

To open the downlight you need to take the difuser out. This can be done with a sharp knife or a small screwdriver buy
may leave minor damage. A suction cup might work to pull it out unharmed.

## Basic Configuration

```yaml
esphome:
  name: downlight
  name_add_mac_suffix: true

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: 'downlight'
    password: 'ap_password'

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

ota:
  password: 'ota_password'

# Platform
bk72xx:
  board: cb2l

# LED driver
bp5758d:
  data_pin: GPIO7
  clock_pin: GPIO8

# Individual outputs
output:
  - platform: bp5758d
    id: output_red
    channel: 1
    current: 10 # 10mA measured on unmodified unit
  - platform: bp5758d
    id: output_green
    channel: 2
    current: 7 # 7.5mA measured on unmodified unit
  - platform: bp5758d
    id: output_blue
    channel: 3
    current: 7 # 7mA measured on unmodified unit
  - platform: bp5758d
    id: output_warmwhite
    channel: 4
    current: 25 # 25mA measured on unmodified unit
  - platform: bp5758d
    id: output_white
    channel: 5
    current: 25 # 25mA measured on unmodified unit

light:
  - platform: rgbww
    name: 'downlight'
    id: 'downlight'
    red: output_red
    green: output_green
    blue: output_blue
    warm_white: output_warmwhite
    cold_white: output_white
    warm_white_color_temperature: 2700 K
    cold_white_color_temperature: 6500 K
    color_interlock: true
```
