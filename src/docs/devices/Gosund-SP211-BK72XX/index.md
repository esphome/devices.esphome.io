---
title: Gosund SP211 BK72xx
date-published: 2024-09-28
type: plug
standard: eu
board: bk72xx
---

## General Notes

This device have two versions, with ESP or Bekken microcontroller.
You are now looking at Bekken configuration, ESP version can be found [in the Gosund SP211 ESP documentation](../Gosund-SP211/).

## Configuration

```yaml
esphome:
  name: sp211

bk72xx:
  board: generic-bk7231n-qfn32-tuya
  framework:
    version: latest

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  # domain: !secret domain
  # use_address: 192.168.6.52
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${plug_name} Fallback Hotspot"
    password: !secret fallback_password

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:

time:
  - platform: homeassistant
    id: homeassistant_time

substitutions:
  plug_name: sp211
  # Higher value gives lower watt readout
  #current_res: "0.00520"
  current_res: "0.00130"
  # Lower value gives lower voltage readout
  #voltage_div: "750"
  voltage_div: "950"

# Enable Web server
web_server:
  port: 80

sensor:
  - platform: wifi_signal
    name: "${plug_name} - WiFi Signal"
    update_interval: 60s

  - platform: uptime
    name: "${plug_name} - Uptime"
    icon: mdi:clock-outline
    update_interval: 60s

  - platform: hlw8012
    sel_pin:
      number: P11
      inverted: true
    cf_pin:
      number: P8
      inverted: true
    cf1_pin:
      number: P9
      inverted: true
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}

    current:
      name: "${plug_name} - Ampere"
      unit_of_measurement: A
      accuracy_decimals: 3
      icon: mdi:flash-outline

    voltage:
      name: "${plug_name} - Volt"
      unit_of_measurement: V
      accuracy_decimals: 1
      icon: mdi:flash-outline

    power:
      name: "${plug_name} - Watt"
      unit_of_measurement: W
      id: "${plug_name}_power"
      icon: mdi:flash-outline

    change_mode_every: 4
    update_interval: 10s

  - platform: total_daily_energy
    name: "${plug_name} - Daily energy consumed"
    power_id: "${plug_name}_power"
    filters:
        # Multiplication factor from W to kW is 0.001
        - multiply: 0.001
    unit_of_measurement: kWh
    icon: mdi:clock-alert

text_sensor:
  - platform: version
    name: "${plug_name} - ESPHome Version"

status_led:
  pin:
    number: P10
    inverted: true

binary_sensor:
  - platform: gpio
    id: button1
    internal: true
    pin:
      number: P7
      mode: INPUT_PULLUP
      inverted: true
    #on_state:
    on_press:
      - switch.toggle: relay1

  - platform: gpio
    id: button2
    internal: true
    pin:
      number: P26
      mode: INPUT_PULLUP
      inverted: true
    #on_state:
    on_press:
      - switch.toggle: relay2

output:
  - platform: gpio
    pin: P24
    inverted: true
    id: led1

  - platform: gpio
    pin: P6
    inverted: true
    id: led2

switch:
  - platform: gpio
    pin: P22
    id: relay1
    restore_mode: RESTORE_DEFAULT_OFF
    name: '${plug_name} - Switch 2'
    icon: mdi:power-socket-eu
    on_turn_on:
      - output.turn_on: led1
    on_turn_off:
      - output.turn_off: led1

  - platform: gpio
    pin: P14
    id: relay2
    restore_mode: RESTORE_DEFAULT_OFF
    name: '${plug_name} - Switch 1'
    icon: mdi:power-socket-eu
    on_turn_on:
      - output.turn_on: led2
    on_turn_off:
      - output.turn_off: led2
```
