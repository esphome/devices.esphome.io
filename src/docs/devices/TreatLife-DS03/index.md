---
title: TreatLife DS03 Fan Controller
date-published: 2021-01-06
type: dimmer
standard: us
board: esp8266
---

[Amazon Link](https://www.amazon.com/dp/B086PPRWL7)

## Notes

This TuyaMCU requires a baud rate of 115200. This will generate a error in the log saying 9600 is requested. This is to
be expected and will be ignored. Setting baud rate to 9600 will cause boot issues

## GPIO Pinout

| Pin   | Function |
| ----- | -------- |
| GPIO1 | Tuya Tx  |
| GPIO3 | Tuya Rx  |

## Basic Configuration

```yaml
substitutions:
  devicename: fan_switch
  friendly_name: Fan Switch

esphome:
  name: ${devicename}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret <ssid>
  password: !secret <password>

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: $friendly_name Fallback Hotspot
    password: <password>

captive_portal:

# Enable logging
logger:
  baud_rate: 0

# Enable Home Assistant API
api:

ota:

uart:
  rx_pin: GPIO3
  tx_pin: GPIO1
  baud_rate: 115200

tuya:

sensor:
  - platform: wifi_signal
    name: $friendly_name Wifi Signal
    update_interval: 60s

  - platform: uptime
    name: $friendly_name uptime

light:
  - platform: "tuya"
    name: $friendly_name Light
    dimmer_datapoint: 10
    switch_datapoint: 9
    min_value: 100
    max_value: 1000

fan:
  - platform: "tuya"
    name: $friendly_name Speed
    switch_datapoint: 1
    speed_datapoint: 3
    speed_count: 4
```
