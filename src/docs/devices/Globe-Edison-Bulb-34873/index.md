---
title: Globe Edison Bulb 34873
date-published: 2024-12-17
type: light
standard: us
board: esp8266
---

![Product Image](./Globe-34873.jpg "Product Image")

The LEDs are controlled by 2 PWM output (Cold and White channels).

## GPIO Pinout

| Pin    | Function         |
| ------ | ---------------- |
| GPIO12 | Warm White (PWM) |
| GPIO14 | Cold White (PWM) |

## Getting it up and running

### Tuya Convert

As the LED bulb do not have any physical buttons, by turning the bulb on and off three times, you will enter pairing
mode. This will cause the bulb to start flashing.

Then follow the [tuya-convert](/devices/tuya-convert) guide.

## Configuration

```yaml
# Basic Config
esphome:
  name: "globe-34873"

esp8266:
  board: esp01_1m
  restore_from_flash: true

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
    id: ww
    pin: GPIO12
  - platform: esp8266_pwm
    id: cw
    pin: GPIO14

light:
  - platform: cwww
    name: light
    cold_white: cw
    warm_white: ww
    cold_white_color_temperature: 5000 K
    warm_white_color_temperature: 2000 K
    restore_mode: RESTORE_DEFAULT_ON
    constant_brightness: true
```
