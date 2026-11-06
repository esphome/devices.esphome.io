---
title: C168 IP64 Outdoor Plug
date-published: 2021-03-07
type: plug
standard: us
board: esp8266
---

## GPIO Pinout

| Pin    | Function                             |
| ------ | ------------------------------------ |
| GPIO0  | Blue LED 1                           |
| GPIO2  | Blue LED 2                           |
| GPIO4  | Push Button 2 (HIGH = off, LOW = on) |
| GPIO12 | Relay 1                              |
| GPIO13 | Push Button 1 (HIGH = off, LOW = on) |
| GPIO14 | Status LED                           |
| GPIO15 | Relay 2                              |

## Basic Configuration

```yaml
# Basic Config
---
substitutions:
  device_name: c168
  outlet1_name: outlet1
  outlet2_name: outlet2

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m
  restore_from_flash: true

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "C168 Fallback Hotspot"
    password: !secret wifi_password
  fast_connect: true

  # Optional manual IP
#  manual_ip:
#    static_ip: 192.168.1.x
#     255.255.255.0

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret otapass

time:
  - platform: homeassistant
    id: homeassistant_time

sensor:
  - platform: wifi_signal
    name: ${device_name}_wifi
    update_interval: 60s

text_sensor:
  - platform: wifi_info
    ip_address:
      name: ${device_name}_IP
      icon: "mdi:ip"

status_led:
  pin:
    number: GPIO14
    inverted: True

binary_sensor:
  # Define the first Toggle Button
  - platform: gpio
    pin:
      number: GPIO13
    id: button1
    name: button1
    on_press:
      - switch.toggle: relay_template1
    internal: True

  # Define the second Toggle Button
  - platform: gpio
    pin:
      number: GPIO4
    id: button2
    name: button2
    on_press:
      - switch.toggle: relay_template2
    internal: True

output:
  # Control the first blue LED
  - platform: esp8266_pwm
    id: led1_output
    pin:
      number: GPIO0
      inverted: True

  # Control the second blue LED
  - platform: esp8266_pwm
    id: led2_output
    pin:
      number: GPIO2
      inverted: True

light:
  - platform: monochromatic
    name: led1
    output: led1_output
    id: blue_led1
    default_transition_length: 1ms # default 1s
    internal: True

  - platform: monochromatic
    name: led2
    output: led2_output
    id: blue_led2
    default_transition_length: 1ms # default 1s
    internal: True

switch:
  - platform: gpio
    pin: GPIO12
    id: relay1

  # tie the first led & relay operation together and report status based on relay state
  - platform: template
    name: ${device_name}_${outlet1_name}
    icon: mdi:power-socket-us
    id: relay_template1
    lambda: |-
      if (id(relay1).state) {
        return true;
      } else {
        return false;
      }
    turn_on_action:
      - light.turn_on: blue_led1
      - switch.turn_on: relay1
    turn_off_action:
      - light.turn_off: blue_led1
      - switch.turn_off: relay1

  - platform: gpio
    pin: GPIO15
    id: relay2

  # tie the second led & relay operation together and report status based on relay state
  - platform: template
    name: ${device_name}_${outlet2_name}
    icon: mdi:power-socketus
    id: relay_template2
    lambda: |-
      if (id(relay2).state) {
        return true;
      } else {
        return false;
      }
    turn_on_action:
      - light.turn_on: blue_led2
      - switch.turn_on: relay2
    turn_off_action:
      - light.turn_off: blue_led2
      - switch.turn_off: relay2
```
