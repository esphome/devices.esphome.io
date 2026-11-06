---
title: CurrySmarter 16A v1.1 Plug
date-published: 2023-09-21
type: plug
standard: eu
board: esp8266
made-for-esphome: False
difficulty: 2
---

![alt text](currysmarter.jpg "CurrySmarter 16A v1.1 Plug")
Maker: [https://currysmarter.com/](https://currysmarter.com/)

Available on Amazon (preflashed with Tasmota)

## GPIO Pinout

| Pin    | Function    |
| ------ | ----------- |
| GPIO3  | HLWBL Sel_i |
| GPIO4  | Button_i    |
| GPIO5  | Led_i       |
| GPIO12 | Relay       |
| GPIO13 | BL0937 CF   |
| GIPO14 | HLWBL CF1   |

## Basic Configuration

```yaml
esphome:
  name: currysmarter16a
  friendly_name: CurrySmarter16a

esp8266:
  board: esp8285

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:

time:
  - platform: sntp
    timezone: Europe/Madrid

switch:
  - platform: gpio
    pin: 12
    name: "Relay"
    id: relay

binary_sensor:
  - platform: gpio
    pin:
      number: 4
      mode: INPUT_PULLUP
      inverted: true
    name: "Button"
    disabled_by_default: true
    internal: True
    on_multi_click:
      - timing:
          - ON for at most 1s
          - OFF for at least 0.2s
        then:
          - switch.toggle: relay

sensor:
  - platform: hlw8012
    model: BL0937
    voltage_divider: 1670
    sel_pin:
      number: 3
      inverted: true
    cf_pin: 13
    cf1_pin: 14
    power:
      name: "Power"
      id: power
      filters:
        - calibrate_linear:
            - 0.0000 -> 0.0000
            - 17.7014 -> 16.000
    update_interval: 10s

  - platform: total_daily_energy
    name: "Energy"
    power_id: power
    device_class: energy
    state_class: total_increasing
    filters:
      - multiply: 0.001
    unit_of_measurement: kWh

  - platform: wifi_signal
    name: WiFi Strength
    update_interval: 60s
    id: signal_strength
    internal: True

  - platform: copy # Reports the WiFi signal strength in %
    source_id: signal_strength
    name: "WiFi Strength"
    filters:
      - lambda: return min(max(2 * (x + 100.0), 0.0), 100.0);
    unit_of_measurement: "%"
    entity_category: "diagnostic"

  - platform: uptime
    name: Uptime

text_sensor:
  - platform: wifi_info
    ip_address:
      name: IP Address
      icon: mdi:ip-network

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "currysmarter16a-Hotspot"
    password: ""

captive_portal:
```
