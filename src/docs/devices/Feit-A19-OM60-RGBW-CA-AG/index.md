---
title: Feit A19 OM60-RGBW-CA-CR
date-published: 2019-10-17
type: light
standard: us
board: esp8266
---

## Basic Configuration for pure warm/cold white

```yaml
esphome:
  name: example-device
  friendly_name: Example Device
    
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

sm16716:
  data_pin: GPIO14
  clock_pin: GPIO4
  num_channels: 3
  num_chips: 1

output:
  - platform: sm16716
    id: output_red
    channel: 0
    power_supply: rgb_power
  - platform: sm16716
    id: output_green
    channel: 1
    power_supply: rgb_power
  - platform: sm16716
    id: output_blue
    channel: 2
    power_supply: rgb_power
  - platform: esp8266_pwm
    id: output_cold_white
    pin: GPIO5
  - platform: esp8266_pwm
    id: output_warm_white
    pin: GPIO12

light:
  - platform: cwww
    name: $devicename
    cold_white: output_cold_white
    warm_white: output_warm_white
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K

power_supply:
  - id: rgb_power
    pin: GPIO13
```
