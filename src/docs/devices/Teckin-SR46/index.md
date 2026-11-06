---
title: Teckin SR46
date-published: 2020-10-29
type: dimmer
standard: us
board: esp8266
---

## General Notes

This plug use tuya so you can [use tuya-convert to flash ESPHome](/devices/tuya-convert).
The UART ports is connected to GPIO1 and GPIO3.
The on/off switch is on datapoint 20 and the dimmer is on datapoint 22.

## GPIO Pinout

| Pin   | Function |
| ----- | -------- |
| GPIO1 | UART Tx  |
| GPIO3 | UART Rx  |

## Basic Configuration

```yaml
esphome:
  name: dimmable_light

esp8266:
  board: esp8285

ota:
  safe_mode: True
  password: OTA_PASSWORD

api:
  encryption:
    key: !secret api_encryption_key

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
#  use_address: X.X.X.X

mqtt:
  broker: X.X.X.X
  username: device_pub
  password: "MQTT_PASSWORD"

uart:
  tx_pin: GPIO1
  rx_pin: GPIO3
  baud_rate: 9600

logger:
  baud_rate: 0

tuya:

light:
  - platform: "tuya"
    name: "dimmer"
    switch_datapoint: 20
    dimmer_datapoint: 22
    min_value: 1
    max_value: 1024
```
