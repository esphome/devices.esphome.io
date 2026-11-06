---
title: Yeron US101 Plug
date-published: 2020-01-27
type: plug
standard: us
board: esp8266
---

[Amazon Link](https://www.amazon.com/dp/B07DP12DQP)

```yaml
esphome:
  name: yeeron_plug

esp8266:
  board: esp01_1m

web_server: # Enable Web Server (optional)
  port: 80

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO3
      mode: INPUT_PULLUP
      inverted: true
    name: "Plug 1 Power Button"
    on_press:
      - switch.toggle: relay

  - platform: status
    name: "Plug 1 Status"

switch:
  - platform: gpio
    id: green_led
    pin:
      number: GPIO13
      inverted: true
    restore_mode: ALWAYS_OFF
    #Have not tinkered with this yet. Currently the light on the plug does not come on.

  - platform: gpio
    name: "Plug 1"
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
      name: "Plug 1 Current"
      unit_of_measurement: A
    voltage:
      name: "Plug 1 Voltage"
      unit_of_measurement: V
    power:
      id: plug_2_wattage
      name: "Plug 1 Power"
      unit_of_measurement: W
    current_resistor: "0.00087" ### HIGHER VALUE GIVES LOWER WATTAGE
    voltage_divider: "2030" ### LOWER VALUE GIVES LOWER VOLTAGE
    change_mode_every: 8
    update_interval: 30s

  - platform: total_daily_energy
    name: "Plug 1 Daily Energy"
    power_id: plug_2_wattage
    filters:
      - multiply: 0.001
    unit_of_measurement: kWh

time:
  - platform: homeassistant
    id: homeassistant_time
```
