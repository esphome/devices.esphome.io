---
title: Orno Triple-Phase Energy meter OR-WE-520
date-published: 2022-03-30
type: misc
standard: eu
board: esp8266
---

## GPIO Pinout

| Pin    | Function             |
| ------ | -------------------- |
| GPIO15 | Input (HIGH = pulse) |

## Connection

Pull's D8 high on pluse from energy meter (800 per kilowatt)

- Connect S0+ to 3.3
- Connect S0- to D8

```yaml
esphome:
  name: energy_meter

esp8266:
  board: nodemcuv2

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:
  password: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "Fallback Hotspot"
    password: "xxxxxxxxxxxx"

captive_portal:

sensor:
  - platform: pulse_meter
    pin: D8
    unit_of_measurement: "kW"
    name: "Active Power"
    internal_filter: 100ms
    accuracy_decimals: 3
    id: orno_we_520_active_power
    filters:
      - multiply: 0.075 # 800 pulses/kW
    total:
      name: "Active Energy"
      id: orno_we_520_power_active_energy
      unit_of_measurement: "kWh"
      accuracy_decimals: 3
      filters:
        - multiply: 0.00125

  - platform: total_daily_energy
    name: "Daily Energy"
    power_id: orno_we_520_active_power
```
