---
title: Teckin SB50 (rgbww version)
date-published: 2023-04-11
type: light
standard: global
board: esp8266
---

![image](./teckin_sb50.jpg)

#### Note

It is not currently possible to flash these bulbs with `tuya-convert`
due to shipping with an updated/patched firmware. Please check [this
issue](https://github.com/ct-Open-Source/tuya-convert/issues/483) for
details and progress on a workaround.

The Teckin SB50 Bulb\'s are a great option for lighting that could
previously be flashed with tuya-convert. More details can be found at
tuya-convert [github
page](https://github.com/ct-Open-Source/tuya-convert). Below is the
ESPHome configuration file that will get you up and running. This
assumes you have a `secret.yaml` with ssid, password, api_password and
ota_password keys.

``` yaml
esp8266:
  board: esp01_1m

output:
  - platform: esp8266_pwm
    id: output_red
    pin: GPIO4
  - platform: esp8266_pwm
    id: output_green
    pin: GPIO12
  - platform: esp8266_pwm
    id: output_blue
    pin: GPIO14
  - platform: esp8266_pwm
    id: output_warm_white
    pin: GPIO13
  - platform: esp8266_pwm
    id: output_cold_white
    pin: GPIO5

light:
  - platform: rgbww
    name: $devicename
    id: $devicename
    red: output_red
    green: output_green
    blue: output_blue
    warm_white: output_warm_white
    cold_white: output_cold_white
    cold_white_color_temperature: 6200 K
    warm_white_color_temperature: 2800 K
    color_interlock: true # avoids simultaneous RGB and W/W
```
