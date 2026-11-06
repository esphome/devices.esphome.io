---
title: Etekcity Smart Outdoor WiFi Outlet Plug ESO15-TB
date-published: 2021-12-24
type: plug
standard: us
board: esp8266
---

Converted from [Tasmota](https://templates.blakadder.com/etekcity_ES015-TB.html).

[Etekcity Site](https://www.etekcity.com/products/smart-outdoor-wifi-outlet-eso15-tb)

## Flashing

Remove the four phillips head screws and remove the plastic clamshell.
Then, remove a few more screws to remove the circuitry from the plastic enclosure.
The Rx, Tx, 3.3v, and Ground solder pads will then be visible to use.
GPIO0 (Pin 8) must be grounded on boot to place the device into boot loader mode.  
GPIO0 also has a test pad which could be labeled "TI0" that is on the far right (looking at the board where test pads
for power is on the left, GND near center, and TX/RX the right) side near the RX/TX test pads.

## GPIO Pinout

|Pin   |Function   |
|------|-----------|
|GPIO4 |Relay 1    |
|GPIO5 |Relay 2    |
|GPIO9 |Led 1      |
|GPIO12|HLW8012 CF1|
|GPIO13|HLW8012 CF |
|GPIO14|Button 1   |
|GPIO15|HLW8012 SEL|
|GPIO16|Led 2      |

## Basic Configuration

```yaml
# Etekcity Smart Outdoor WiFi Outlet Plug (ESO15-TB)
substitutions:
  device_name: eso15_tb
  device_description: ESO15 TB Outlet 1
  friendly_name: Outdoor Outlet 1
  voltage_divider: "1980"
  current_resistor: "0.001"

esphome:
  name: ${device_name}
  comment: ${device_description}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: True

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
      ssid: ${device_name} Fallback Hotspot
      password: !secret ap_password

captive_portal:

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key
  
ota:
    password: !secret api_ota_password

# Enable logging
logger:

sensor:
  - platform: hlw8012
    sel_pin: GPIO15
    cf_pin: GPIO13
    cf1_pin: GPIO12
    current_resistor: ${current_resistor}
    voltage_divider: ${voltage_divider}
    current:
      name: "${friendly_name} Current"
    voltage:
      name: "${friendly_name} Voltage"
    power:
      name: "${friendly_name} Power"
    energy:
      name: "${friendly_name} Energy"
  - platform: wifi_signal
    name: "${friendly_name} WiFi signal"
    update_interval: 60s
  - platform: uptime
    name: "${friendly_name} Uptime"
    update_interval: 60s

binary_sensor:
  - platform: gpio
    pin:
      number: 14
      mode: INPUT_PULLUP
      inverted: true
    id: button1
    on_multi_click:
      - timing:
          - ON for at most 1s
          - OFF for at least 0.5s
        then:
          - logger.log: "Single Clicked"
          - switch.toggle: outlet_a
      - timing:
          - ON for at most 1s
          - OFF for at most 1s
          - ON for at most 1s
          - OFF for at least 0.2s
        then:
          - logger.log: "Double Clicked"
          - switch.toggle: outlet_b
  - platform: status
    name: "${friendly_name} Status"

switch:
  - platform: gpio
    pin: GPIO4
    name: "${friendly_name} Outlet A"
    id: outlet_a
    on_turn_on:
      - output.turn_on: led1_output
    on_turn_off:
      - output.turn_off: led1_output
  - platform: gpio
    pin: GPIO5
    name: "${friendly_name} Outlet B"
    id: outlet_b

output:
  - id: led1_output
    platform: gpio
    pin: GPIO9

status_led:
  pin:
    number: GPIO16
```
