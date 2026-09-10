---
title: Teckin SP10
date-published: 2019-10-11
type: plug
standard: us
board: esp8266
---

## GPIO Pinout

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO0  | Status LED                         |
| GPIO2  | Blue LED                           |
| GPIO13 | Push Button (HIGH = off, LOW = on) |
| GPIO15 | Relay                              |

## Basic Configuration

```yaml
# Basic Config
---
esphome:
  name: SP10

esp8266:
  board: esp01_1m
  restore_from_flash: true

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  ap:
    ssid: SP10_AP
    password: !secret wifi_password
    channel: 1

logger:

api:
ota:
web_server:
  port: 80
  # https://esphome.io/web-api/

time:
  - platform: homeassistant
    # https://esphome.io/components/time/
    id: homeassistant_time

status_led:
  # https://esphome.io/components/status_led/
  pin:
    number: GPIO0
    inverted: True

output:
  # https://esphome.io/components/output/esp8266_pwm/
  - platform: esp8266_pwm
    id: blue_led_output
    pin:
      number: GPIO2
      inverted: True

light:
  # https://esphome.io/components/light/monochromatic/
  - platform: monochromatic
    name: SP10 Blue LED
    output: blue_led_output
    id: blue_led
    default_transition_length: 1ms # default 1s
    internal: True

sensor:
  - platform: uptime
    name: SP10 Uptime

  - platform: wifi_signal
    name: SP10 Wifi Signal
    update_interval: 60s

text_sensor:
  - platform: version
    name: SP10 ESPHome Version
  - platform: wifi_info
    ip_address:
      name: SP10 IP

binary_sensor:
  - platform: gpio
    # https://esphome.io/components/binary_sensor/gpio/
    pin:
      number: GPIO13
    id: button
    name: SP10 Button
    on_press:
      - switch.toggle: relay_template
    internal: True

switch:
  - platform: gpio
    # https://esphome.io/components/switch/gpio/
    pin: GPIO15
    id: relay

  # tie the led & relay operation together and report status based on relay state
  - platform: template
    # https://esphome.io/components/switch/template/
    name: SP10
    id: relay_template
    lambda: |-
      if (id(relay).state) {
        return true;
      } else {
        return false;
      }
    turn_on_action:
      - light.turn_on: blue_led
      - switch.turn_on: relay
    turn_off_action:
      - light.turn_off: blue_led
      - switch.turn_off: relay
```
