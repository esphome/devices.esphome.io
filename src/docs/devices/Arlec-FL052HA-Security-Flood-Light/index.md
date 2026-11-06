---
title: Arlec FL052HA Security Flood Light
date-published: 2021-02-14
type: light
standard: au
board: esp8266
---

![Product Image](./Arlec-FL052HA-Security-Flood-Light.png "Product Image")

The Arlec FL052HA security flood light is part of the [Grid Connect ecosystem](https://grid-connect.com.au/) and is sold
at Bunnings in Australia.

As of the time of writing, versions `1019` or `0320` can be flashed using tuya-convert, however if it is version `0520`
OTA flashing **will not work**.

You can check these versions by looking at the bottom left of the Arlec product plaque. See below examples;

![1019](./1019.jpg) ![0320](./0320.jpg) ![0520](./0520.jpg)

## GPIO Pinout

| Pin    | Function                  |
| ------ | ------------------------- |
| GPIO14 | LED Light (Monochromatic) |

## Getting it up and running

### Tuya Convert

As the flood lights do not have any physical buttons, you will follow the same flashing method that a Tuya Edison or
Bayonet bulb will follow by turning the flood light on and off three times. This will cause the flood light to start
flashing indicating you have entered pairing mode.

- Connect and disconnect power from flood light three times.
- Flood light will start flashing - this indicates the device has entered pairing mode successfully and is ready to see
  tuya-convert.
- Follow tuya-convert [flashing procedure](https://github.com/ct-Open-Source/tuya-convert).

## Configuration

```yaml
# Basic Config
esphome:
  name: fl052ha_flood_light

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

logger:

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: "password"

output:
  - platform: esp8266_pwm
    pin: GPIO14
    frequency: 1000 Hz
    id: pwm_output

light:
  - platform: monochromatic
    output: pwm_output
    name: "fl052ha_flood_light"
```
