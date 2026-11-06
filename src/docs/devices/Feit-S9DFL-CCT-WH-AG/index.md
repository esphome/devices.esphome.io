---
title: Feit Electric S9DFL/CCT/WH/AG
date-published: 2024-04-05
type: light
standard: us
board: bk72xx
difficulty: 3
---

## Basic Configuration

```yaml
substitutions:
  devicename: feit_electric_s9dfl-cct-wh-ag

esphome:
  name: $devicename
  friendly_name: Feit Electric S9DFL/CCT/WH/AG
   
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
  board: cb3s

output:
  - platform: libretiny_pwm
    # BP2308
    pin: P7
    frequency: 1 kHz
    id: br_pwm
    min_power: 0.005
    max_power: 1.00
    zero_means_zero: true
  - platform: libretiny_pwm
    # BP5926X
    pin: P6
    frequency: 1 kHz
    id: ct_pwm
    inverted: true
    min_power: 0.000
    max_power: 0.995
    
light:
  - platform: color_temperature
    name: $devicename
    brightness: br_pwm
    color_temperature: ct_pwm
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
```
