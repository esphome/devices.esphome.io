---
title: Sonoff S20
date-published: 2019-10-10
type: plug
standard: uk, us, eu
board: esp8266
---

## GPIO Pinout

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO0  | Push Button (HIGH = off, LOW = on) |
| GPIO12 | Relay and its status LED           |
| GPIO13 | Green LED (HIGH = off, LOW = on)   |
| GPIO1  | RX pin (for external sensors)      |
| GPIO3  | TX pin (for external sensors)      |

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: sonoff_s20

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
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    name: "Sonoff S20 Button"
    on_press:
      - switch.toggle: relay
  - platform: status
    name: "Sonoff S20 Status"

sensor:
  - platform: wifi_signal
    name: "Sonoff S20 WiFi Signal"
    update_interval: 60s

switch:
  - platform: gpio
    name: "Sonoff S20 Relay"
    pin: GPIO12
    id: relay

status_led:
  pin:
    number: GPIO13
    inverted: true
```
