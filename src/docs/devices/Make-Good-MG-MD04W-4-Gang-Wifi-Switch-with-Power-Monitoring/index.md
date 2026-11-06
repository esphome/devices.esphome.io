---
title: Make Good MG-MD04W 4-Gang Wifi Switch with Power Monitoring
date-published: 2021-02-19
type: switch
standard: au

board: esp8266
---

## TuyaMCU Pinout

| Dpid # | Component |
|:------:|----------:|
| D1 | Switch1 |
| D2 | Switch2 |
| D3 | Switch3 |
| D4 | Switch4 |
| D7 | SwitchTimer1 |
| D8 | SwitchTimer2 |
| D9 | SwitchTimer3 |
| D10 | SwitchTimer4 |
| D102 | Amps (x 0.001) |
| D103 | Watts (x 0.1) |
| D104 | Volts (x 0.1) |

## Getting it up and running

These switches can no longer be converted with Tuya-convert. See discussion here [https://github.com/sillyfrog/contact/issues/4](https://github.com/sillyfrog/contact/issues/4)

## Basic Functionality with Power Monitoring and Device status sensors (No Timers)

```yaml
substitutions:
  device_name: mg-md04w
  friendly_name: "Touch WIFI Light Switch"

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m
  restore_from_flash: true

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: on

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: ${device_name} Fallback
    password: ""

captive_portal:

logger:
  baud_rate: 0

api:

ota:

web_server:
  port: 80

time:
  - platform: sntp
    id: my_time

tuya:

uart:
  rx_pin: GPIO3
  tx_pin: GPIO1
  baud_rate: 9600

sensor:
  - platform: wifi_signal
    name: ${friendly_name} Wifi Signal Strength
    update_interval: 60s
  - platform: uptime
    name: ${friendly_name} Uptime
  - platform: tuya
    name: ${friendly_name} Watts
    id: total_watts
    sensor_datapoint: 103
    unit_of_measurement: W
    accuracy_decimals: 1
    filters:
    - multiply: 0.1
  - platform: tuya
    name: ${friendly_name} Amps
    sensor_datapoint: 102
    unit_of_measurement: A
    accuracy_decimals: 3
    filters:
    - multiply: 0.001
  - platform: tuya
    name: ${friendly_name} Volts
    sensor_datapoint: 104
    unit_of_measurement: VAC
    accuracy_decimals: 0
    filters:
    - multiply: 0.1
  - platform: total_daily_energy
    name: ${friendly_name} Total Daily Energy
    power_id: total_watts

text_sensor:
  - platform: wifi_info
    ip_address:
      name: ${friendly_name} IP
    ssid:
      name: ${friendly_name} SSID
    bssid:
      name: ${friendly_name} BSSID
    mac_address:
      name: ${friendly_name} Mac

switch:
  - platform: restart
    name: ${friendly_name} REBOOT
  - platform: tuya
    name: ${friendly_name} Switch 1
    switch_datapoint: 1
  - platform: tuya
    name: ${friendly_name} Switch 2
    switch_datapoint: 2
  - platform: tuya
    name: ${friendly_name} Switch 3
    switch_datapoint: 3
  - platform: tuya
    name: ${friendly_name} Switch 4
    switch_datapoint: 4

```
