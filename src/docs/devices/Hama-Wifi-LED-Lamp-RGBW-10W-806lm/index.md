---
title: Hama Wifi Led Lamp RGBW 10W 806lm
date-published: 2024-01-09
type: light
standard: eu
board: bk72xx
---

Can be flashed with esphome kickstart via tuya-cloudcutter!!
Profile name: 1.1.2 - BK7231T / oem_bk7231s_light_ty

## Product Images

![image](image.png)

## GPIO Pinout

| Function  | GPIO-Pin |
| --------- | -------- |
| PWM_red   | 26       |
| PWM_green | 6        |
| PWM_blue  | 24       |
| PWM_cold  | 8        |
| PWM_warn  | 6        |

## Basic Configuration

```yaml
#BASIC
Copy
substitutions:
  devicename: hama-bulb-10w

esphome:
  name: $devicename
  friendly_name: hama-bulb-10w
  
# OTA flashing
ota:
  - platform: esphome

wifi: # Your Wifi network details
  
# Enable fallback hotspot in case wifi connection fails  
  ap:

# Enabling the logging component
logger:

# Enable Home Assistant API
api:

# Enable the captive portal
captive_portal:

bk72xx:
  board: generic-bk7231t-qfn32-tuya

button:
  - platform: restart
    name: Restart

output:
  - platform: libretiny_pwm
    id: output_red
    pin: P26
  - platform: libretiny_pwm
    id: output_green
    pin: P6
  - platform: libretiny_pwm
    id: output_blue
    pin: P24
  - platform: libretiny_pwm
    id: output_cold
    pin: P8
  - platform: libretiny_pwm
    id: output_warm
    pin: P7

light:
  - platform: rgbww
    id: light_rgbww
    name: $devicename
    color_interlock: true
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
    red: output_red
    green: output_green
    blue: output_blue
    cold_white: output_cold
    warm_white: output_warm
```
