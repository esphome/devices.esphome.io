---
title: Martin Jerry MJ-ST02
date-published: 2023-12-11
type: switch
standard: us
board: esp8266
---

[Amazon Link](https://www.amazon.com/dp/B0BJ939TC2)

Martin Jerry MJ-ST02 3-Way Switch

I received mine when ordering Tasmota pre-flashed Martin Jerry 3-way switches from [Amazon](https://www.amazon.com/dp/B0BJ939TC2),
even though the listing shows them as MJ-ST01 switches.

## Notes

This product uses Tuya MCU to control the relay. It requires a baud rate of 9600.

## GPIO Pinout

| Pin   | Function |
| ----- | -------- |
| GPIO1 | Tuya Tx  |
| GPIO3 | Tuya Rx  |

## Tuya Datapoints

| Datapoint | Function  |
| --------- | --------- |
| 1         | switch    |
| 7         | int value |

## Basic Configuration

```yaml
esphome:
  name: mj-st02

esp8266:
  board: esp01_1m

# Enable HA API
api:
  encryption:
    key: !secret api_key

# Enable OTAs
ota:
  password: !secret api_password

# Sync RTC with HA
time:
  - platform: homeassistant
    timezone: America/Chicago

# Wi-Fi Setup
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case Wi-Fi connection fails
  ap:
    ssid: mj-st02 AP
    password: !secret ap_password

captive_portal:

logger:
  baud_rate: 0

uart:
  rx_pin: GPIO3
  tx_pin: GPIO1
  baud_rate: 9600

tuya:

light:
  - platform: tuya
    name: mj-st02 Switch
    switch_datapoint: 1
```
