---
title: Sonoff T1 R2 Touch Wall Switch
date-published: 2020-04-06
type: switch
standard: eu
board: esp8266
---

## Notes

- to boot chip (blue led blinking):
  connect ftdi
- to enter flash mode (blue led not blinking):
  short resistor R19 to GND
  then connect ftdi

## GPIO Pinout

### 2-Gang Version

| Pin    | Function                              |
| ------ | ------------------------------------- |
| GPIO0  | Touch Sensor 1 (HIGH = off, LOW = on) |
| GPIO9  | Touch Sensor 2 (HIGH = off, LOW = on) |
| GPIO5  | Relay 1                               |
| GPIO12 | Relay 2                               |
| GPIO13 | Status LED                            |

### 1-Gang Version

| Pin    | Function                            |
| ------ | ----------------------------------- |
| GPIO0  | Touch Sensor (HIGH = off, LOW = on) |
| GPIO12 | Relay                               |
| GPIO13 | Status LED                          |

## Basic Configuration (2-Gang)

```yaml
esphome:
  name: sonoff_t1_r2

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: true

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret ota_secret

logger:
  esp8266_store_log_strings_in_flash: false

text_sensor:
  - platform: version
    name: Sonoff T1 R2 Version

sensor:
  - platform: uptime
    name: Sonoff T1 R2 Uptime
    update_interval: 60s

button:
  - platform: restart
    name: Sonoff T1 R2 Restart

switch:
  - platform: gpio
    name: Sonoff T1 R2 Switch 1
    pin: GPIO5
    id: relay_1
  - platform: gpio
    name: Sonoff T1 R2 Switch 2
    pin: GPIO12
    id: relay_2

binary_sensor:
  - platform: status
    name: Sonoff T1 R2 Status

  - platform: gpio
    name: Sonoff T1 R2 Touchpad 1
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    on_press:
      - switch.toggle: relay_2
  - platform: gpio
    pin:
      number: GPIO9
      mode: INPUT_PULLUP
      inverted: True
    name: Sonoff T1 R2 Touchpad 2
    on_press:
      - switch.toggle: relay_1

status_led:
  pin:
    number: GPIO13
    inverted: True
```
