---
title: LoraTap SC500W
Model: SC500W
date-published: 2021-11-29
type: relay
standard: global
board: esp8266
difficulty: 4
---

![alt text](LoraTap-SC500W.png "Product Image")

[https://www.loratap.com/sc500w-p0108.html)

## GPIO Pinout

| Pin    | Function                   |
| ------ | -------------------------- |
| GPIO03 | LED (inverted)             |
| GPIO04 | S1 (external switch input) |
| GPIO05 | S2 (external switch input) |
| GPIO12 | Relay L1                   |
| GPIO13 | Button                     |
| GPIO14 | Relay L2                   |

## Basic Config

The configuration below will simply set up the device as a 2-gang switch for lights.

```yaml
#SC500W
substitutions:
  device_name: SC500W
  friendly_name: "SC500W"
  device_description: "SC500W"

esphome:
  name: ${device_name}
  comment: "${device_description}"

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "ESPHOME"
    password: "12345678"

logger:

api:
  reboot_timeout: 15min
  encryption:
    key: !secret encryption_key

ota:
  password: !secret ota_password

# the web_server & sensor components can be removed without affecting core functionaility.

web_server:
  port: 80

sensor:
  - platform: wifi_signal
    name: ${device_name} Wifi Signal Strength
    update_interval: 60s
  - platform: uptime
    name: ${device_name} Uptime
#######################################
# Device specific Config Begins Below #
#######################################

binary_sensor:
  - platform: gpio
    name: ${friendly_name} button
    pin: GPIO13
    internal: true

  - platform: gpio
    name: ${friendly_name} S1 switch input
    pin: GPIO4
    id: button1
    disabled_by_default: true
    filters:
      - invert:
    on_press:
      if:
        condition:
          binary_sensor.is_on: button1
        then:
          - light.turn_on: light1
    on_release:
      if:
        condition:
          binary_sensor.is_off: button1
        then:
          - light.turn_off: light1
  - platform: gpio
    name: ${friendly_name} S2 switch input
    pin: GPIO5
    id: button2
    disabled_by_default: true
    filters:
      - invert:
    on_press:
      if:
        condition:
          binary_sensor.is_on: button2
        then:
          - light.turn_on: light2
    on_release:
      if:
        condition:
          binary_sensor.is_off: button2
        then:
          - light.turn_off: light2

output:
  - platform: gpio
    pin: GPIO12
    id: relay1
  - platform: gpio
    pin: GPIO14
    id: relay2

light:
  - platform: binary
    name: ${friendly_name} L1 output
    id: light1
    output: relay1
  - platform: binary
    name: ${friendly_name} L2 output
    id: light2
    output: relay2

status_led:
  pin:
    number: GPIO3
    inverted: true
```
