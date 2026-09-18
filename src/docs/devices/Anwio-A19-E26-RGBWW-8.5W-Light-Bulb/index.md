---
title: Anwio A19 E26 RGBWW 8.5 Watt Light Bulb
date-published: 2024-11-09
type: light
standard: us
board: bk72xx
---
[Amazon Link](https://www.amazon.com/dp/B08BR51MG3)

## Flashing With Cloudcutter

1. [Setup tuya-cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter)
1. Create an Esphome configuration and download the version compiled for cloudcutter.
1. Place the bin file in the custom firmware directory for cloudcutter.
1. Start the cloudcutter process
1. Choose firmware version 2.9.16 (doule check your version in the Tuya app!)
1. When prompted, choose the custom firmware you just compiled.

## Images

![top down](./anwio-a19-top-down.jpg)
![board view 1](./anwio-a19-board-view.jpg)
![board view 2](./anwio-a19-board-view-2.jpg)

## Links

[SM2135 Specs](https://www.mikrocontroller.net/attachment/430042/SM2135E_zh-CN_en-US_translated.pdf)

[WB3L Information](https://docs.libretiny.eu/boards/wb3l/)

[Amazon Product Page](https://www.amazon.com/dp/B08BR51MG3)

[Esphome Discord Discussion](https://discord.com/channels/429907082951524364/1298333872710225952/1298333874082021476)

## Configuration

```yaml
api:
  encryption:
    key: !secret api_key

ota:
  - platform: esphome
    password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "Bar-Pendant-Left"
    password: !secret hotspot_password

substitutions:
  name: bar-pendant-left
  device: bar_pendant_left
  friendly_name: Bar Pendant Left

esphome:
  name: ${name}
  friendly_name: ${friendly_name}
  on_boot:
    priority: 600
    then:
      - light.turn_on:
          id: ${device}
          brightness: 100%
          color_brightness: 0%
          color_temperature: 2200K

bk72xx:
  board: wb3l

logger:

captive_portal:

debug:
  update_interval: 30s

text_sensor:
  - platform: debug
    device:
      name: Device Info
    reset_reason:
      name: Reset Reason
  - platform: libretiny
    version:
      name: LibreTiny Version

button:
  - platform: restart
    name: Restart

sensor:
  - platform: uptime
    device_class: duration
    name: Uptime

sm2135:
  data_pin: GPIO6
  clock_pin: GPIO7
  separate_modes: false
  cw_current: 30mA
  rgb_current: 20mA

output:
  - platform: sm2135
    id: output_blue
    channel: 0
  - platform: sm2135
    id: output_green
    channel: 1
  - platform: sm2135
    id: output_red
    channel: 2
  - platform: sm2135
    id: warm_white
    channel: 3
  - platform: sm2135
    id: cold_white
    channel: 4

light:
  - platform: rgbww
    name: Light
    id: ${device}
    color_interlock: true
    red: output_red
    green: output_green
    blue: output_blue
    warm_white: warm_white
    cold_white: cold_white
    cold_white_color_temperature: 6200K
    warm_white_color_temperature: 2000K
```
