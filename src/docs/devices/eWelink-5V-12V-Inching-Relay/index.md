---
title: eWelink 5V/12V Inching Relay
date-published: 2025-01-08
type: relay
standard: global
board: esp8266
difficulty: 4
---

## Notes

- This device is advertised in eWelink as _Coolkit 0185_, which is a generic name used for more devices
- Has a red LED attached to the relay output that cannot be controlled independently
- Has a button for RF pairing, but the unit tested had no RF radio meaning it's a useless button

## Product Images

![device](./device.png "Device")

## Programming

This device is powered by a [PSF-B01](https://templates.blakadder.com/PSF-B.html) board (ESP8285). You can flash it
through the programming pins:

![/programming-pins.png](./programming-pins.png "Programming pins")

The button which is aligned with the micro-USB port is connected to GPIO0. You can use it to boot the board into
flashing mode.

You can also use the micro-USB to power the board with 5V during the flash, just make sure to still bridge GND with your
programmer.

## GPIO Pinout

| Pin    | Function |
| ------ | -------- |
| GPIO00 | Button   |
| GPIO12 | Relay    |
| GPIO13 | Red LED  |

## Board Configuration

```yaml
esphome:
  project:
    name: eWelink.5V/12V Inching Relay

esp8266:
  board: esp8285

binary_sensor:
  - platform: gpio
    id: button0
    pin:
      number: GPIO0
      mode:
        input: true
        pullup: true
      inverted: true
    on_multi_click:
      - timing:
          - ON for at most 1s
          - OFF for at least 0.2s
        then:
          - switch.turn_on: relay

light:
  - platform: status_led
    id: wifi_led
    pin:
      number: GPIO13
      inverted: true

switch:
  - platform: gpio
    id: relay
    pin: GPIO12
    on_turn_on:
      - delay: 1s
      - switch.turn_off: relay
```
