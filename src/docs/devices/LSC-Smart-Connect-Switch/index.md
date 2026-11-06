---
title: LSC Smart Connect Switch
date-published: 2021-07-14
type: plug
standard: eu
board: esp8266
---

## Warning

The latest LSC Smart Connect Switch devices use the Tuya WB2S module, which is not compatible with ESPHome!

## Notice

- This plug is flashable using the latest tuya-convert with a compiled ESPHome binary

## Product Images

![plug with box](https://www.action.com/globalassets/cmsarticleimages/79/77/2578677_8712879142799-111.png?preset=mediaSliderImageLargeHD)
![plug](https://www.action.com/globalassets/cmsarticleimages/79/78/2578677_8712879142799-110_02.png?preset=mediaSliderImageLargeHD)

## GPIO Pinout

| Pin    | Function                            |
| ------ | ----------------------------------- |
| GPIO4  | LED (on: 0 /off: 1)                 |
| GPIO12 | Relay (on: 1 /off: 0)               |
| GPIO13 | Switch/button (pressed: 0 / off: 1) |

## Basic configuration

```yml
substitutions:
  plug_name: lsc-powerplug1

esphome:
  name: ${plug_name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

api:
logger:
ota:

binary_sensor:
  # Binary sensor for the button press
  - platform: status
    name: ${plug_name}_status
  - platform: gpio
    pin:
      number: GPIO13
      mode: INPUT_PULLUP
      inverted: true
    name: ${plug_name}_button
    internal: true
    on_press:
      - switch.toggle: relay

output:
  # Relay state led
  - platform: esp8266_pwm
    id: state_led
    pin:
      number: GPIO4
      inverted: true

light:
  # Relay state light
  - platform: monochromatic
    id: led
    name: ${plug_name}_led
    output: state_led

switch:
  # Switch toggles relay
  - platform: gpio
    id: relay
    name: ${plug_name}_relay
    pin: GPIO12
    on_turn_on:
      - light.turn_on: led
    on_turn_off:
      - light.turn_off: led
```

[https://thibmaek.com/posts/flashing-esphome-to-lsc-smart-connect-action-switches-power-plugs](https://thibmaek.com/posts/flashing-esphome-to-lsc-smart-connect-action-switches-power-plugs)

[Tasmota template LSC power plug](https://templates.blakadder.com/lsc_smart_connect_power_plug.html)
