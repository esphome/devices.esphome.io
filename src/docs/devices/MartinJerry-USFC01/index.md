---
title: Martin Jerry US-FC-01 Smart Ceiling Fan Controller
date-published: 2023-02-13
type: switch
standard: us
board: esp8266
---

Martin Jerry US-FC-01 Switch![image](MJ-usfc01.jpg)

[Amazon Link](https://www.amazon.com/dp/B0BFGL98K6)

## Notes

The Martin Jerry US-FC-01 is a 4 speed fan control switch. It comes pre-flashed with Tasmota firmware and can easily be
converted to ESPHome by uploading ESPHome firmware to the switch via Tasmota's web UI.

## GPIO Pinout

| Pin   | Function |
| ----- | -------- |
| GPIO1 | Tuya Tx  |
| GPIO3 | Tuya Rx  |

## Basic Configuration

```yaml
esphome:
  name: mj-fc01-fan

esp8266:
  board: esp01_1m

# Enable logging
logger:
  baud_rate: 0

# Enable Home Assistant API
api:
  encryption:
    key: <key>

ota:
  password: <password>

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "mj-fc01-fan Fallback Hotspot"
    password: <password>

captive_portal:

uart:
  rx_pin: GPIO3
  tx_pin: GPIO1
  baud_rate: 9600

tuya:

fan:
  - platform: "tuya"
    name: MJ FC01 Fan Speed
    switch_datapoint: 1
    speed_datapoint: 3
    speed_count: 4
```
