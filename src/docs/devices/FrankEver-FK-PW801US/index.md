---
title: FrankEver FK-PW801US
date-published: 2025-12-01
type: plug
standard: us
board: esp8266
---
  ![alt text](./frankever-fk-pw801us.jpg "Product Image")

Model reference: FK-PW801US

Equivalent devices:

- [CloudFree CF-P1](../CloudFree-CF-P1/)

Manufacturer: [FrankEver](https://frankever.com/product/)

## GPIO Pinout

| Pin    | Function                   |
|--------|----------------------------|
| GPIO02 | Blue LED (Inverted: true)  |
| GPIO13 | Push Button                |
| GPIO15 | Relay                      |

## Basic Config

```yaml
substitutions:
  device_name: frankever-fk-pw801us
  friendly_name: FrankEver FK-PW801US
  device_description: FrankEver smart plug with button and blue led.

esphome:
  name: ${device_name}
  comment: ${device_description}

esp8266:
  board: esp01_1m

wifi:
  # Enable fallback hotspot (captive portal) for WiFi configuration
  ap:
    ssid: ${friendly_name}

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:

# Enable OTA
ota:

binary_sensor:
  - platform: gpio
    device_class: power
    id: button
    pin:
      number: GPIO13
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      - switch.toggle: relay

switch:
  - platform: gpio
    name: Relay
    pin: GPIO15
    id: relay
    on_turn_on:
      - output.turn_on: led
    on_turn_off:
      - output.turn_off: led

output:
  - platform: gpio
    id: led
    pin:
      number: GPIO02
      inverted: true
```
