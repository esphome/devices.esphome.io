---
title: TOPGREENER TGWF500D 3-Way Smart Dimmer Switch
date-published: 2021-05-12
type: dimmer
standard: us
board: esp8266
---

TOPGREENER TGWF500D 3-Way Smart Dimmer Switch![image](Topgreener-TGWF500D.png)

[Amazon Link](https://www.amazon.com/dp/B07BSX9SDF)

## Notes

This TuyaMCU requires a baud rate of 9600.

## GPIO Pinout

| Pin   | Function |
| ----- | -------- |
| GPI15 | Tuya Tx  |
| GPI15 | Tuya Rx  |

## Basic Configuration

```yaml
substitutions:
  device_name: familyroom_light_1 #change
  friendly_name: Family Room Light #change
  icon: "mdi:light-switch"

esphome:
  name: ${device_name}
  name_add_mac_suffix: true

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: true
  ap:
    ssid: ${device_name}
    password: !secret esphome_ap_password

logger:
  level: DEBUG
  baud_rate: 0

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret esphome_ota_password

web_server:
  port: 80

uart:
  rx_pin: GPIO13
  tx_pin: GPIO15
  baud_rate: 9600

tuya:

sensor:
  - platform: wifi_signal
    name: ${friendly_name} WiFi Signal
    update_interval: 60s

  - platform: uptime
    name: ${friendly_name} Uptime

light:
  - platform: "tuya"
    name: ${friendly_name}
    dimmer_datapoint: 3
    switch_datapoint: 1
    min_value: 10
    max_value: 255
```
