---
title: Mirabella Genio White Bulb
date-published: 2019-10-11
type: light
standard: au
board: esp8266
---

## GPIO Pinout

| Pin | Function |
|---------|------------------------------------| |
| GPIO13 | Light |

## Basic Configuration

```yaml
# Basic Config
# https://mirabellagenio.net.au/es-%2F-bc-cool-white-specs
esphome:
  name: mirabella_1
  on_boot:
    priority: 100 # Highest priority, ensures light turns on without delay.
    then:
      - light.turn_on: light

esp8266:
  board: esp01_1m
wifi:
  ssid: "sid"
  password: "wifi_password"
  ap:
    ssid: "mirabella1"
    password: "ap_password"
  domain: ".mydomain.com"

esp8266:
  board: esp01_1m

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

# Enable the Web Server component 
webserver:

switch:
  - platform: restart
    name: "Mirabella 1 Restart"

output:
  - platform: esp8266_pwm
    id: output1
    pin: GPIO13

light:
  - platform: monochromatic
    name: "Mirabella_1 Light"
    output: output1
    id: light
```
