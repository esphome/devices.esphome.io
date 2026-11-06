---
title: Connect SmartHome Wi-Fi Plug with USB Ports (CSH-PLGUSB)
date-published: 2025-05-24
type: plug
standard: au
board: bk72xx
made-for-esphome: False
---

## General Notes

[Connect SmartHome Wi-Fi Plug with USB Ports](https://www.connectsmarthome.com.au/smart-power/connect-smart-wi-fi-plug-with-usb-ports-alexa-google-compatible/)

![Connect SmartHome Wi-Fi Plug with USB Ports](CSH-PLGUSB.png 'Connect SmartHome Wi-Fi Plug with USB Ports')

This contains a Tuya Beken Chip WB2S which can be flashed with [ESPHome](https://esphome.io/) and a USB to UART
converter by soldering to the chip's RX, TX, VCC and GND pins.

It might be possible to flash (especially older units) [OTA using tuya-convert](/devices/tuya-convert). If you attempt
to flash a current unit OTA, you should update this page specify if it's still possible or not.

## Basic Configuration

```yaml
esphome:
  name: smart-plug
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
  board: wb2s

# Button
binary_sensor:
  - platform: gpio
    pin:
      number: P10
      inverted: true
    name: 'Push Button'
    on_press:
      then:
        - homeassistant.event:
            event: esphome.button_pressed

# Switch
switch:
  - platform: gpio
    pin: P26
    name: 'Switch'
```
