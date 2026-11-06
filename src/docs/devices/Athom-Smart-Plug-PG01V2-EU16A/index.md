---
title: Athom Smart Plug PG01V2 EU16A
date-published: 2023-05-05
type: plug
standard: eu
board: esp8266
---

![alt text](athom_PG01V2-EU16A.webp "Athom Smart Plug PG01V2 EU16A")
Maker: [https://www.athom.tech/](https://www.athom.tech/)

Also on Aliexpress, with preflashed Tasmota or Homekit.

## GPIO Pinout

| Pin    | Function   |
| ------ | ---------- |
| GPIO3  | CSE7766 Rx |
| GPIO5  | Button     |
| GPIO12 | Relay      |
| GPIO13 | LedLink    |

## Basic Configuration

```yaml
substitutions:
  devicename: athomsmartplug
  upper_devicename: Athom Smart Plug

esphome:
  name: $devicename

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Enable logging
logger:
  baud_rate: 0

# Enable Home Assistant API
api:

ota:

web_server:
  port: 80

# Time used for daily KWh usage
time:
  - platform: homeassistant
    id: homeassistant_time

status_led:
  pin:
    number: GPIO0
    inverted: yes

binary_sensor:
  # Button 1 configuration
  - id: button_1
    platform: gpio
    pin:
      number: GPIO05
    on_press:
      then:
        - switch.toggle: relay_1
    on_click:
      min_length: 5000ms
      max_length: 10000ms
      then:
        - switch.turn_on: reset
  - platform: status
    name: "${upper_devicename} Status"

switch:
  # Set relays as switches
  - id: relay_1
    platform: gpio
    pin: GPIO12
    icon: mdi:power-socket-fr
    name: "${upper_devicename} Switch"
    on_turn_on:
      - switch.turn_on: sw_led1
    on_turn_off:
      - switch.turn_off: sw_led1
  # Register LED on GPIO
  - id: sw_led1
    platform: gpio
    pin: GPIO13
  - platform: restart
    name: "${upper_devicename} Restart"
    id: reset

uart:
  id: cse7766_uart_bus
  rx_pin: GPIO03
  baud_rate: 4800

sensor:
  - platform: cse7766
    uart_id: cse7766_uart_bus
    current:
      name: "${upper_devicename} Amperage"
      id: "${devicename}Amperage"
      unit_of_measurement: A
      accuracy_decimals: 3
      icon: mdi:flash-circle
    voltage:
      name: "${upper_devicename} Voltage"
      id: "${devicename}Voltage"
      unit_of_measurement: V
      icon: mdi:flash-circle
    power:
      name: "${upper_devicename} Wattage"
      id: "${devicename}Wattage"
      unit_of_measurement: W
      icon: mdi:flash-circle
    energy:
      name: "${upper_devicename} Energy"
      id: "${devicename}Energy"
      unit_of_measurement: Wh
      icon: mdi:flash-circle
    update_interval: 5s
  - platform: total_daily_energy
    name: "${upper_devicename} Total Daily Energy"
    power_id: "${devicename}Wattage"
    filters:
      # Multiplication factor from W to kW is 0.001
      - multiply: 0.001
    unit_of_measurement: kWh
    icon: mdi:clock-alert
  - platform: uptime
    name: "${upper_devicename} Uptime"
    icon: mdi:clock-outline
  - platform: wifi_signal
    name: "${upper_devicename} Wifi Signal"
    update_interval: 60s
```
