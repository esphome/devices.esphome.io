---
title: Tuya AP-Future-RGBCCT LED Controller (AP-02-5CH-V1)
date-published: 2024-01-28
type: light
standard: global
board: ESP8266
---


This controller is a RGB CCT PWM Controller based on the ESP8266, it's the previous version of the AP-02-5CH-V2 which
uses BK72xx Tuya chip.

For flashing this device, you have to flash it manually. You can do it with a 3D printed Jig pogo pins. You can follow
this tutorial on [YT. Tuya Convert Not Working? NO Solder Jig | Flash Tasmota & ESPHome][1] (you need a 3D printer),
or you can solder the pins following this [Tasmota pinout guide][2]

[1]: https://youtu.be/imKZbhJ8lvU?si=FfhMAgJAtsvwrhut
[2]: https://tasmota.github.io/docs/devices/TYWE3S/

![Product Image](image.png "Product Image")

## Sample configuration

``` yaml
esphome:
  name: tuya-rgbcct-5ch-controller
  friendly_name: Tuya RGBCCT 5ch Controller

esp8266:
  board: esp01_1m

# Enable logging
logger:

# Enable Home Assistant API
api:
ota:

web_server:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

output:
  - platform: esp8266_pwm
    pin: GPIO13
    frequency: 1000 Hz
    id: ledc_cw
  - platform: esp8266_pwm
    pin: GPIO5
    frequency: 1000 Hz
    id: ledc_ww
  - platform: esp8266_pwm
    pin: GPIO14
    frequency: 1000 Hz
    id: ledc_b
  - platform: esp8266_pwm
    pin: GPIO12
    frequency: 1000 Hz
    id: ledc_g
  - platform: esp8266_pwm
    pin: GPIO4
    frequency: 1000 Hz
    id: ledc_r

light:
  - platform: rgbww
    name: "LED-strip"
    color_interlock: true
    warm_white: ledc_ww
    cold_white: ledc_cw
    red: ledc_r
    green: ledc_g
    blue: ledc_b
    cold_white_color_temperature: 5000K
    warm_white_color_temperature: 3000K

captive_portal:

```
