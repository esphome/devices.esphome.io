---
title: Yagala SM-SO301
date-published: 2020-10-12
type: plug
standard: us
board: esp8266
---

## Product Images

![Product Image](product_image.jpg "Product Image")

## GPIO Pinout

| Pin    | Function                     |
| ------ | ---------------------------- |
| GPIO00 | Status LED inverted          |
| GPIO04 | Relay 1 inverted             |
| GPIO05 | Push Button                  |
| GPIO12 | Relay 3 inverted             |
| GPIO13 | Relay 2 inverted             |
| GPIO14 | Relay 4 inverted             |
| GPIO16 | USB Power Relay not inverted |

## Basic Configuration

```yaml
# Basic Config
---
substitutions:
  displayname: "Power Strip"
  unique_id: "yagala_sm-so301_01"

esphome:
  name: ${unique_id}

esp8266:
  board: esp01_1m
  restore_from_flash: true

# WiFi connection
wifi:
  ssid: !secret iot_wifi_ssid
  password: !secret iot_wifi_password
  power_save_mode: none
  fast_connect: true
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${displayname}"
    password: !secret ap_mode_password

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:
  reboot_timeout: 0s
  encryption:
    key: !secret api_encryption_key

# Enable Web server
web_server:
  port: 80

text_sensor:
  - platform: wifi_info
    ip_address:
      name: "${displayname} IP Address"

ota:
  password: !secret ota_password

switch:
  - platform: gpio
    name: "${displayname} USB Power"
    id: usb_power
    pin:
      number: GPIO16
  - platform: gpio
    name: "${displayname} Relay 1"
    id: relay1
    inverted: true
    pin:
      number: GPIO4
  - platform: gpio
    name: "${displayname} Relay 2"
    inverted: true
    pin:
      number: GPIO13
    id: relay2
  - platform: gpio
    name: "${displayname} Relay 3"
    inverted: true
    id: relay3
    pin:
      number: GPIO12
  - platform: gpio
    name: "${displayname} Relay 4"
    inverted: true
    id: relay4
    pin:
      number: GPIO14
  # Switch to restart strip
  - platform: restart
    name: "${displayname} Restart"

light:
  # Blue LED PWM
  # GPIO0
  - platform: monochromatic
    name: "${displayname} Blue LED"
    output: output_component_blue

output:
  #Blue LED
  - platform: esp8266_pwm
    id: output_component_blue
    pin: GPIO0
    inverted: true

binary_sensor:
  # Button & Automation to toggle all switches
  # GPIO5
  - platform: gpio
    pin: GPIO5
    id: button
    name: "${displayname} Button"
    on_press:
      - switch.toggle: relay1
      - switch.toggle: relay2
      - switch.toggle: relay3
      - switch.toggle: relay4
      - switch.toggle: usb_power
    internal: True

  # Binary sensor to display the connected status
  - platform: status
    name: "${displayname} Status"
```
