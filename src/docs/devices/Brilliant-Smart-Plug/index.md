---
title: Brilliant Smart Plug
date-published: 2019-10-12
type: plug
standard: au
board: esp8266
---

## GPIO Pinout

| Pin    | Function                     |
| ------ | ---------------------------- |
| GPIO5  | Relay                        |
| GPIO14 | Push Button (Inverted: true) |
| GPIO12 | Red LED (Inverted: true)     |

## Basic Configuration

```yaml
# https://brilliantlighting.com.au/product/smart-wifi-plug-with-usb-charger-8e7c49
# Brilliant Smart WiFi Plug with USB charger model: 20676/05
substitutions:
  devicename: brilliant-1
  friendlyname: brilliant_1

esphome:
  name: $devicename
  friendly_name: $friendlyname

esp8266:
  board: esp01_1m
  board_flash_mode: dout

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret ota_password

logger:

web_server:

sensor:
  - platform: wifi_signal
    name: $devicename WiFi Signal
    update_interval: 60s

#------------------------------------
# Button toggles relay
binary_sensor:
  - platform: gpio
    pin:
      number: GPIO14
      mode: INPUT_PULLUP
      inverted: True
    name: $friendlyname Button
    on_press:
      - switch.toggle: relay
  - platform: status
    name: $friendlyname Status

# Relay output of plug
switch:
  - platform: gpio
    name: Relay
    pin: GPIO5
    id: relay
    on_turn_on:
      - output.turn_off: light_output #turn status led OFF so LED is blue when relay is on
    on_turn_off:
      - output.turn_on: light_output #turn status led ON so LED is red when relay==off && status==ok

# Red LED status when module initialising and connecting
light:
  - platform: status_led # status_led type can be overwritten by output if status==ok.
    name: status
    internal: True #don't expose a user controllable switch to HomeAssistant interface
    pin:
      number: GPIO12
      inverted: False

output:
  - id: light_output
    platform: gpio
    pin:
      number: GPIO12
      inverted: True
```
