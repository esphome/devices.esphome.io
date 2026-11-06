---
title: Globe Electric 2-Outlet Outdoor Plug (50029)
date-published: 2021-12-04
type: plug
standard: us
board: esp8266
---

These devices are based on the popular Tuya platform, model on the back sticker is SK509-W-2S, the bottom of the box
lists them as 50029. FCC-ID is [2AQUQGE50029](https://fccid.io/2AQUQGE50029).

Old stock can easily be flashed OTA using tuya-convert if you never pair them with the Smart app. Newer boards will have
to be flashed over a UART serial connection if Tuya-Convert does not work.

This template was built using ESPHome 2021.11.3 and does not expose the LEDs or the button to Home Assistant as that was
not deemed to add any value to the automation.

Inspired by the Tasmota template ([https://templates.blakadder.com/globe_50029.html](https://templates.blakadder.com/globe_50029.html))

## GPIO Pinout

| Pin    | Function          |
| ------ | ----------------- |
| GPIO3  | LED 2 (inverted)  |
| GPIO4  | Relay 2           |
| GPIO12 | Button (inverted) |
| GPIO13 | Relay 1           |
| GPIO14 | LED 1 (inverted)  |

## Basic Configuration

```yaml
# Globe Electric 50029 smart plug with board SK509-W-2S
substitutions:
  device_name: globe-plug-1
  device_description: Globe Electric 50029 Smart plug 1
  friendly_name: Plug 1

esphome:
  name: ${device_name}
  comment: ${device_description}

esp8266:
  board: esp8285

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:
  password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: ${device_name} Fallback Hotspot
    password: !secret wifi_password

captive_portal:

web_server:
  port: 80
  auth:
    username: admin
    password: !secret web_server_password

time:
  - platform: homeassistant
    id: homeassistant_time

sensor:
  - platform: uptime
    name: ${friendly_name} Uptime
    unit_of_measurement: minutes
    filters:
      - lambda: return x / 60.0;

  - platform: wifi_signal
    name: ${friendly_name} Signal
    update_interval: 60s

light:
  - platform: monochromatic
    id: led_left
    internal: True
    output: gpio14
    default_transition_length: 0s
    restore_mode: always off

  - platform: monochromatic
    id: led_right
    internal: True
    output: gpio3
    default_transition_length: 0s
    restore_mode: always off

output:
  - platform: esp8266_pwm
    id: gpio14
    pin:
      number: GPIO14
      inverted: True

  - platform: esp8266_pwm
    id: gpio3
    pin:
      number: GPIO3
      inverted: True

interval:
  - interval: 500ms
    then:
      - if:
          condition:
            not:
              wifi.connected:
          then:
            - light.turn_on:
                id: led_left
                brightness: 100%
                transition_length: 0s
            - light.turn_on:
                id: led_right
                brightness: 100%
                transition_length: 0s
            - delay: 250ms
            - light.turn_off:
                id: led_left
                transition_length: 250ms
            - light.turn_off:
                id: led_right
                transition_length: 250ms

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO12
      inverted: true
    id: button1
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
    on_multi_click:
      - timing:
          - ON for at most 1s
          - OFF for at least 0.5s
        then:
          - logger.log: "Single Clicked"
          - switch.toggle: outlet_left
      - timing:
          - ON for at most 1s
          - OFF for at most 1s
          - ON for at most 1s
          - OFF for at least 0.2s
        then:
          - logger.log: "Double Clicked"
          - switch.toggle: outlet_right

  - platform: status
    name: ${friendly_name} status

switch:
  - platform: gpio
    name: ${friendly_name} Left Outlet
    id: outlet_left
    pin: GPIO13
    icon: mdi:power-socket-us
    on_turn_on:
      - light.turn_on:
          id: led_left
    on_turn_off:
      - light.turn_off:
          id: led_left

  - platform: gpio
    name: ${friendly_name} Right Outlet
    id: outlet_right
    pin: GPIO4
    icon: mdi:power-socket-us
    on_turn_on:
      - light.turn_on:
          id: led_right
    on_turn_off:
      - light.turn_off:
          id: led_right
```

## Split Configuration

If you have many of these you can take the esphome section and below and place it a sub-folder so that the ESPHome
dashboard will not attempt to display it. The template can then be included in to the configuration file for each
device.

```yaml
substitutions:
  device_name: globe-plug-1
  device_description: Globe Electric 50029 Smart plug 1
  friendly_name: Plug 1

&lt;&lt;: !include templates/ge50029.yaml
```

If you do that you will need to create a symbolic list to the secrets.yaml file in the same folder or the !secret syntax
will not be able to resolve the secrets.
