---
title: Sonoff S26
date-published: 2019-10-11
type: plug
standard: uk, us, eu, au
board: esp8266
---

## GPIO Pinout

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO0  | Push Button (HIGH = off, LOW = on) |
| GPIO12 | Relay and Red LED                  |
| GPIO13 | Blue Status LED                    |

## Flashing via serial

To put the device into flash mode:

- hold the button
- connect board to the 5V (do not connect it to the AC)
- release the button
- start flashing

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: sonoffs26_1

esp8266:
  board: esp01_1m
  board_flash_mode: dout
    
# OTA flashing
ota:
  - platform: esphome

wifi: # Your Wifi network details
  
# Enable fallback hotspot in case wifi connection fails  
  ap:

# Enabling the logging component
logger:

# Enable Home Assistant API
api:

# Enable the captive portal
captive_portal:

# Enable the Web Server component 
webserver:

status_led:
  pin:
    number: GPIO13
    inverted: false

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    name: "Sonoff S26_1 Button"
    on_press:
      - switch.toggle: relay
  - platform: status
    name: "Sonoff S26_1 Status"

switch:
  - platform: gpio
    name: "Sonoff S26_1 Relay"
    pin: GPIO12
    id: "relay"
  - platform: restart
    name: "sonoffs26_1 Restart"
```
