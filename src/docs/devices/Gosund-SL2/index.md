---
title: Gosund SL2
Model: SL2
date-published: 2021-05-13
type: light
standard: eu
board: esp8266
---

![Product Image](Gosund_SL2.jpg "Product Image")

## Gosund SL2 LED light stripe

This is a cheap LED light stripe which can be bought at Amazon. Older versions of this LED controller allow to flash the
device using tuya-convert whereas newer version needs to be flashed using a cable connection to the pins on the
controller.

```yaml
# Define the name
substitutions:
  devicename: "markise_led"
  upper_devicename: "Markise LED"

esphome:
  name: ${devicename}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

ota:
  password: !secret esphome_api

web_server:
  port: 80

time:
  - platform: homeassistant
    id: homeassistant_time

# Enable switch for remote restart
switch:
  - platform: restart
    name: "${upper_devicename} Restart"

# Example configuration entry
light:
  - platform: rgb
    name: "${upper_devicename}"
    red: output_red
    green: output_green
    blue: output_blue
    id: led_strip

# Example output entry
output:
  - platform: esp8266_pwm
    id: output_red
    pin: GPIO12
  - platform: esp8266_pwm
    id: output_green
    pin: GPIO5
  - platform: esp8266_pwm
    id: output_blue
    pin: GPIO13

binary_sensor:
  - platform: status
    name: "${upper_devicename} - Status"
    device_class: connectivity
  - platform: gpio
    pin:
      number: GPIO4
      mode: INPUT_PULLUP
      inverted: true
    name: "${upper_devicename} Pushbutton"
    internal: true
    on_press:
      then:
        - light.toggle: led_strip

sensor:
  - platform: wifi_signal
    name: "${upper_devicename} - Wifi Signal"
    update_interval: 60s
    icon: mdi:wifi

  - platform: uptime
    name: "${upper_devicename} - Uptime"
    update_interval: 60s
    icon: mdi:clock-outline
```
