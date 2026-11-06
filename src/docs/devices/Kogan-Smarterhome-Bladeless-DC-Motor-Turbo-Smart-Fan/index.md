---
title: Kogan SmarterHome Bladeless DC Motor Turbo Smart Fan
Model: KASBLSTFANSA
date-published: 2022-08-02
type: misc
standard: au
board: esp8266
---

![Product Image](Kogan-Smarterhome-Bladeless-DC-Motor-Turbo-Smart-Fan.jpg "Kogan SmarterHome Bladeless DC Motor Turbo Smart Fan")

[Product Listing](https://www.kogan.com/au/buy/kogan-smarterhome-bladeless-dc-motor-turbo-smart-fan-silver/)

## GPIO Pinout

| Pin   | Function |
| ----- | -------- |
| GPIO3 | RX       |
| GPIO1 | TX       |

## Basic Config

```yaml
substitutions:
  name: Kogan Smart Bladeless Fan

esphome:
  name: "${name}"

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

# Enable logging
logger:
  baud_rate: 0

# Enable Home Assistant API
api:

# Allow OTA updates
ota:

uart:
  rx_pin: GPIO3
  tx_pin: GPIO1
  baud_rate: 9600

tuya:

fan:
  - platform: tuya
    name: Your Fan Name
    switch_datapoint: 1
    speed_datapoint: 2
    speed_count: 9
    oscillation_datapoint: 8
```
