---
title: Shelly DUO GU10
date-published: 2022-06-14
type: light
standard: eu
board: esp8266
---

## GPIO Pinout

| Pin   | Function   |
| ----- | ---------- |
| GPIO4 | Temprature |
| GPIO5 | Brightness |

This template was made using [the Tasmota template](https://github.com/arendst/mgos-to-tasmota) with the
[GPIO conversion in the Tasmota docs](https://tasmota.github.io/docs/GPIO-Conversion/#gpio-conversion).

```yaml
esphome:
  name: your-name

esp8266:
  board: esp01_1m
  restore_from_flash: true
    
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

output:
  - platform: esp8266_pwm
    id: warm_white
    pin: GPIO4
  - platform: esp8266_pwm
    id: brightness
    pin: GPIO5

light:
  - platform: cwww
    name: Your device name
    warm_white: warm_white
    cold_white: brightness
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
```
