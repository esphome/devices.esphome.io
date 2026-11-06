---
title: Kogan Smart Plug with Energy Monitoring
Model: KASPEMHA
date-published: 2019-10-18
type: plug
standard: au
board: esp8266
---
  ![alt text](./kogan-smarterhome-smart-plug-energy-meter.jpg "Product Image")
  
[https://www.kogan.com/au/buy/kogan-smarterhome-smart-plug-energy-meter/](https://www.kogan.com/au/buy/kogan-smarterhome-smart-plug-energy-meter/)

## GPIO Pinout

| Pin    | Function                   |
|--------|----------------------------|
| GPIO0  | Push Button                |
| GPIO13 | Green LED (Inverted: true) |
| GPIO14 | Relay                      |
| GPIO12 | HLW8012 SEL Pin            |
| GPIO04 | HLW8012 CF Pin             |
| GPIO05 | HLW8012 CF1 Pin            |

## Basic Config

```yaml
esphome:
  name: kogan_plug_1

esp8266:
  board: esp8285

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: 192.168.x.xx
    gateway: 192.168.x.x
    subnet: 255.255.255.0

# Enable logging
logger:

# Enable Web Server (optional)
web_server:
  port: 80
  
# Enable Home Assistant API
api:

ota:

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: true
    name: "Kogan Plug 1 Power Button"
    on_press:
      - switch.toggle: relay

  - platform: status
    name: "Kogan Plug 1 Status"

switch:
  - platform: gpio
    id: green_led
    pin:
      number: GPIO13
      inverted: true
    restore_mode: ALWAYS_OFF

  - platform: gpio
    name: "Kogan Plug 1"
    pin: GPIO14
    id: relay
    icon: mdi:television
    restore_mode: ALWAYS_OFF

sensor:
  - platform: hlw8012
    sel_pin:
      number: GPIO12
      inverted: true
    cf_pin: GPIO04
    cf1_pin: GPIO05
    current:
      name: "Kogan Plug 1 Current"
      unit_of_measurement: A
    voltage:
      name: "Kogan Plug 1 Voltage"
      unit_of_measurement: V
    power:
      id: kogan_plug_1_wattage
      name: "Kogan Plug 1 Power"
      unit_of_measurement: W
    current_resistor: "0.00087"   ### HIGHER VALUE GIVES LOWER WATTAGE
    voltage_divider: "2030"   ### LOWER VALUE GIVES LOWER VOLTAGE
    change_mode_every: 8
    update_interval: 5s

  - platform: total_daily_energy
    name: "Kogan Plug 1 Daily Energy"
    power_id: kogan_plug_1_wattage
    filters:
      - multiply: 0.001
    unit_of_measurement: kWh

time:
  - platform: homeassistant
    id: homeassistant_time
```
