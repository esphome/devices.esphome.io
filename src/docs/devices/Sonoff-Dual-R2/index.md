---
title: Sonoff Dual R2
date-published: 2019-12-04
type: relay
standard: global
board: esp8266
---

## Product Images

![alt text](./inside_pcb_1_4.jpg "PCB v1.4")

## GPIO Pinout

### Sonoff Dual R2 - PCB version 1.0

| Pin    | Function        |
| ------ | --------------- |
| GPIO10 | Push Button     |
| GPIO12 | Relay #1        |
| GPIO05 | Relay #2        |
| GPIO13 | Blue Status LED |
| GPIO04 | Optional sensor |
| GPIO14 | Optional sensor |

### Sonoff Dual R2 - PCB version 1.4

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO10 | Push Button                        |
| GPIO00 | Pin "button 0" on expansion header |
| GPIO09 | Pin "button 1" on expansion header |
| GPIO12 | Relay #1 and red color on LED      |
| GPIO05 | Relay #2 and green color on LED    |
| GPIO13 | Blue Status LED                    |

## Basic Configuration

```yaml
substitutions:
  dev_name: sonoff_dualr2_001

esphome:
  name: ${dev_name}

esp8266:
  board: esp01_1m

wifi:

# Enable logging
logger:
  level: DEBUG

# Enable Home Assistant API
api:

ota:

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO10
      mode: INPUT_PULLUP
      inverted: True
    name: "${dev_name}_button"
    #toggle both relays on push
    on_press:
      - switch.toggle: relay
      - switch.toggle: relay2
  - platform: gpio
    pin:
      number: GPIO00
      mode: INPUT_PULLUP
      inverted: True
    name: "${dev_name}_button0"
    #toggle only relay1
    on_press:
      - switch.toggle: relay
  - platform: gpio
    pin:
      number: GPIO09
      mode: INPUT_PULLUP
      inverted: True
    name: "${dev_name}_button1"
    #toggle only relay2
    on_press:
      - switch.toggle: relay2

switch:
  - platform: gpio
    name: "${dev_name}_relay"
    pin: GPIO12
    id: relay
  - platform: gpio
    name: "${dev_name}_relay2"
    pin: GPIO05
    id: relay2
  - platform: shutdown
    name: "${dev_name}_shutdown"
  - platform: restart
    name: "${dev_name}_restart"

status_led:
  pin:
    number: GPIO13
    inverted: yes

sensor:
  - platform: wifi_signal
    name: "${dev_name}_wifi_signal"
    update_interval: 30s
  - platform: uptime
    name: "${dev_name}_uptime"
    update_interval: 120s

text_sensor:
  - platform: version
    name: "${dev_name}_version"
```
