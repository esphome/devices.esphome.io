---
title: Aoycocr EU6S
Model: EU6S
date-published: 2024-05-08
type: plug
standard: eu
board: esp8266
---

- Can be flashed with Tuya-Convert
- Change IP Setting or if using DHCP delete the manual_ip setting under WIFI!

```yaml
substitutions:
  devicename: "aoycocr-eu6s"
  friendly_name: "Aoycocr EU6S"
  device_description: Aoycocr EU6S Power Monitoring Plug
  sp1_current_resistor: "0.00221"
  sp1_voltage_divider: "871"
  #############
  # Note: These numbers were found online
  # BW SHP2 Current Resistor: 0.0028
  # BW SHP2 Voltage Devider: 960
  # Gosund SP1 Current Resistor: 0.00221
  # Gosund SP1 Voltage Devider: 871
  # Gosund SP1 Current Resistor ALT: 0.00103
  # Gosund SP1 Voltage Devider ALT: 2160
  #############
  led_pin: GPIO02
esphome:
  name: ${devicename}
  comment: ${device_description}
  friendly_name: ${friendly_name}

esp8266:
  board: esp8285

# Enable logging
logger:

# WiFi connection
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

# Enable over-the-air updates
ota:
  password: !secret ota_password

web_server:
  port: 80

# Time used for daily KWh usage  
time:
  - platform: homeassistant
    id: homeassistant_time

# Text sensors with general information
text_sensor:
  - platform: version
    name: ${friendly_name} Version
  - platform: wifi_info
    ip_address:
      name: ${friendly_name} IP Address

sensor:
  # Uptime sensor
  - platform: uptime
    name: ${friendly_name} Uptime
  # WiFi Signal sensor
  - platform: wifi_signal
    name: ${friendly_name} Wifi Signal
    update_interval: 60s
  # Gosund SP1 Config
  # Power sensor
  - platform: hlw8012
    sel_pin:
      number: GPIO12
      inverted: true
    cf_pin: GPIO05
    cf1_pin: GPIO14
    current_resistor: ${sp1_current_resistor}
    voltage_divider: ${sp1_voltage_divider}
    change_mode_every: 8
    update_interval: 60s
    # Current sensor
    current:
      name: ${friendly_name} Current
      unit_of_measurement: A
      accuracy_decimals: 2
    # Voltage sensor
    voltage:
      name: ${friendly_name} Voltage
      unit_of_measurement: V
      accuracy_decimals: 1
    # Power sensor
    power:
      id: power
      name: ${friendly_name} Power
      unit_of_measurement: W
      accuracy_decimals: 0
    # Energy sensor
    energy:
      id: energy
      name: ${friendly_name} Energy
      unit_of_measurement: Wh
      accuracy_decimals: 0  
  # Total daily energy sensor
  - platform: total_daily_energy
    name: ${friendly_name} Daily Energy Usage
    power_id: power
    filters:
      # Multiplication factor from W to kW is 0.001
      - multiply: 0.001
    unit_of_measurement: kWh

# Binary sensor for the power button
binary_sensor:
  - platform: gpio
    name: ${friendly_name} Power Button
    id: button
    pin:
      number: GPIO13
      inverted: true
    on_press:
      - switch.toggle: relay

switch:
  # Switch to restart the plug
  - platform: restart
    name: ${friendly_name} Restart Switch
  # Switch for the relay
  - platform: gpio
    id: relay
    name: ${friendly_name} Power Switch
    pin: GPIO15
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_on:
      - switch.turn_on: led
    on_turn_off:
      - switch.turn_off: led

  - platform: gpio
    pin: GPIO2
    id: led
    inverted: True
```
