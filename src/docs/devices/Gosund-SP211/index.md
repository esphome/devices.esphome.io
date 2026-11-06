---
title: Gosund SP211
date-published: 2021-06-18
type: plug
standard: eu
board: esp8266
---

## General Notes

This device have two versions, with ESP or Bekken microcontroller.
You are now looking at ESP configuration, Bekken version can be found [in the Gosund SP211 BK72XX documentation](../Gosund-SP211-BK72XX/).

## Configuration

```yaml
esphome:
  name: sp211

esp8266:
  board: esp8285

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

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
      number: GPIO03
      inverted: true
    cf_pin: GPIO04
    cf1_pin: GPIO05
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
    number: GPIO01
    inverted: true

binary_sensor:
  - platform: gpio
    id: button1
    internal: true
    pin:
      number: GPIO12
      mode: INPUT_PULLUP
      inverted: true
    #on_state:
    on_press:
      - switch.toggle: relay1

  - platform: gpio
    id: button2
    internal: true
    pin:
      number: GPIO00
      mode: INPUT_PULLUP
      inverted: true
    #on_state:
    on_press:
      - switch.toggle: relay2

    # Fix for overload bug in certain SP211 devices
  - platform: gpio
    id: gpio15_irq
    pin: GPIO15
    internal: true

output:
  - platform: gpio
    pin: GPIO02
    inverted: true
    id: led1

  - platform: gpio
    pin: GPIO13
    inverted: true
    id: led2

switch:
  - platform: gpio
    pin: GPIO14
    id: relay1
    restore_mode: RESTORE_DEFAULT_OFF
    name: '${plug_name} - Switch 1'
    icon: mdi:power-socket-eu
    on_turn_on:
      - output.turn_on: led1
    on_turn_off:
      - output.turn_off: led1

  - platform: gpio
    pin: GPIO16
    id: relay2
    restore_mode: RESTORE_DEFAULT_OFF
    name: '${plug_name} - Switch 2'
    icon: mdi:power-socket-eu
    on_turn_on:
      - output.turn_on: led2
    on_turn_off:
      - output.turn_off: led2
```
