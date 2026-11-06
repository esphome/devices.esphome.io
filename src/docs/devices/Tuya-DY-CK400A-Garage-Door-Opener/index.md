---
title: Tuya DY-CK400A Garage Door Opener
date-published: 2024-12-01
type: misc
standard: global
board: esp8266
difficulty: 3
---

## Product Images

![device](./device.jpg "Device")

![board](./board.jpg "Board")

## Programming

Tuya Convert was not able to work for this device (with firmware v3.1.4). If your device has an older firmware, it may
be worth a try.

This device is powered by a [TYWE1S](https://developer.tuya.com/docs/iot/wifie1smodule?id=K9605thnvg3e7) board
(ESP8266EX with 2MB flash), you can boot it in flash mode by grounding IO0. Then you can use U0TX and U0RX. You can
either power the device using the built-in USB, or power it through the 3.3V pin.

![/programming-pins.png](./programming-pins.png "Programming pins")

## GPIO Pinout

| Pin    | Function    |
|--------|-------------|
| GPIO13 | Tuya MCU RX |
| GPIO15 | Tuya MCU TX |

## Basic Configuration

```yaml
esphome:
  name: tuya-DY-CK400A-garage-door-opener

esp8266:
  board: esp_wroom_02

logger:

captive_portal:

uart:
  rx_pin: GPIO13
  tx_pin: GPIO15
  baud_rate: 9600

tuya:

binary_sensor:
  - platform: tuya
    id: contact
    sensor_datapoint: 101

switch:
  - platform: tuya
    id: mcu_cover
    switch_datapoint: 1

cover:
  - platform: template
    device_class: garage
    name: Garage Door
    lambda: 'return id(contact).state ? COVER_OPEN : COVER_CLOSED;'
    open_action:
      switch.turn_on: mcu_cover
    close_action:
      switch.turn_off: mcu_cover
```

Note that this device is affected by [https://github.com/esphome/issues/issues/6503](https://github.com/esphome/issues/issues/6503).
