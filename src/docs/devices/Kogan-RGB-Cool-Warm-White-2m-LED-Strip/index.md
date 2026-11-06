---
title: Kogan RGB + Cool & Warm White 2m LED Strip
Model: KSH2MLEDSPA
date-published: 2020-07-09
type: light
standard: au
board: esp8266
---
  ![alt text](./Kogan-RGB-Cool-Warm-White-2m-LED-Strip.jpg "Product Image")

[https://www.kogan.com/au/buy/kogan-smarterhome-rgb-cool-warm-white-smart-led-light-strip-2m/](https://www.kogan.com/au/buy/kogan-smarterhome-rgb-cool-warm-white-smart-led-light-strip-2m/)

## GPIO Pinout

| Pin    | Function                   |
|--------|----------------------------|
| GPIO04 | RED                        |
| GPIO05 | Cold White                 |
| GPIO12 | GREEN                      |
| GPIO13 | Warm White                 |
| GPIO14 | BLUE                       |

## Basic Config

```yaml
substitutions:
  device_name: kogan_RGBWWSTRIP_1
  device_ip: 192.168.x.x

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: ${device_ip}
    gateway: 192.168.x.x
    subnet: 255.255.255.0

logger:

api:
  reboot_timeout: 15min
  encryption:
    key: !secret encryption_key

ota:
  password: !secret ota_password

binary_sensor:
  - platform: gpio
    pin:
      number: 03
      mode: INPUT_PULLUP
      inverted: true
    name: "${device_name}_button"
    on_press:
      - switch.toggle: relay

  - platform: status
    name: "${device_name}_status"

output:
  - platform: esp8266_pwm
    pin: 14
    id: output_blue
  - platform: esp8266_pwm
    pin: 12
    id: output_green
  - platform: esp8266_pwm
    pin: 4
    id: output_red
  - platform: esp8266_pwm
    pin: 5
    id: output_coldwhite
  - platform: esp8266_pwm
    pin: 13
    id: output_warmwhite

light:
  - platform: rgbww
    name: '${device_name}'
    id: ${device_name}
    default_transition_length: 0s
    red: output_red
    green: output_green
    blue: output_blue
    cold_white: output_coldwhite
    warm_white: output_warmwhite
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K

time:
  - platform: homeassistant
    id: homeassistant_time
```
