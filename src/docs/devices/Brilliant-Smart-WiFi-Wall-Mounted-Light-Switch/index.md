---
title: Brilliant Smart WiFi Wall Mounted Light Switch
date-published: 2021-10-21
type: switch
standard: au
board: esp8266
---

The Brilliant Smart WiFi wall mounted light switch is available in Australia. They come in single gang, twin, triple and
quad gang configurations. They're a smooth glass front with round touch switches to control the lights.

## Getting Started

These devices are obstensibly Tuya-controlled switches, but after re-flashing them with Tuya-Convert, they work
nicely with ESPHome. I flashed mine directly from the existing Tuya to ESPHome. (Some people go to Tasmota first –
there's no need.)

Ref:
[https://thehomeautomator.com.au/running-esphome-with-home-assistant/](https://thehomeautomator.com.au/running-esphome-with-home-assistant/)

## Code

This YAML is cobbled together from:

- [DETA Grid Connect Smart Switch template][brilliant-deta] (for the WiFi signal and uptime sensors and the restart
  option)
- [ESPHome Tuya component documentation][brilliant-tuya]
- [ESPHome Tuya switch documentation][brilliant-tuya-switch]

[brilliant-deta]: https://devices.esphome.io/devices/DETA-Grid-Connect-Smart-Switch/
[brilliant-tuya]: https://esphome.io/components/tuya/
[brilliant-tuya-switch]: https://esphome.io/components/switch/tuya/

```yaml
substitutions:
  device_name: garage-light-switch
  friendly_name: "Light Switch - Garage"

#################################################

esphome:
  name: ${device_name}

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
  baud_rate: 0

# Enable Home Assistant API
api:

# Enable the captive portal
captive_portal:

uart:
  rx_pin: GPIO3
  tx_pin: GPIO1
  baud_rate: 9600

# Register the Tuya MCU connection
tuya:

sensor:

  - platform: uptime
    name: ${device_name} Uptime

switch:
  - platform: restart
    name: "${friendly_name} REBOOT"

  # Define the switch we want to control.
  # This works perfectly for a single gang light switch.
  - platform: "tuya"
    name: "${friendly_name}"
    switch_datapoint: 1
# For Multi gang light switches:
#  - platform: "tuya"
#    name: "${friendly_name} 1"
#    switch_datapoint: 1
#
#  - platform: "tuya"
#    name: "${friendly_name} 2"
#    switch_datapoint: 2
#
#  - platform: "tuya"
#    name: "${friendly_name} 3"
#    switch_datapoint: 3
#
#  - platform: "tuya"
#    name: "${friendly_name} 4"
#    switch_datapoint: 4
