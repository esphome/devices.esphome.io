---
title: Orvibo B25
date-published: 2022-02-04
type: plug
standard: uk, us, eu
board: esp8266
---

## GPIO Pinout

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO14 | Push Button (HIGH = off, LOW = on) |
| GPIO05 | Relay                              |
| GPIO12 | Red LED (Used for status)          |
| GPIO04 | Blue LED (Used for active state)   |

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: orvibo_b25

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:
api:
ota:

# Device Specific Config

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO14
      mode: INPUT_PULLUP
      inverted: True
    name: "B25 Plug button"
    on_press:
      - switch.toggle: relay
  - platform: status
    name: "B25 Plug Status"

switch:
  - platform: gpio
    name: "B25 Plug relay"
    pin: GPIO05
    id: relay
    on_turn_on:
      - output.turn_on: activity_led
    on_turn_off:
      - output.turn_off: activity_led

status_led:
  # Display red flashing LED when connecting to Wifi
  pin:
    number: GPIO12

sensor:
  - platform: wifi_signal
    name: "B25 WiFi signal"
    update_interval: 60s

  - platform: uptime
    name: "B25 Uptime"

output:
  # Blue LED, set for Off when switch = Off / On when switch = On
  - id: activity_led
    platform: gpio
    pin: GPIO04
```
