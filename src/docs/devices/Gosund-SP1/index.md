---
title: Gosund SP1
Model: SP1
date-published: 2021-12-27
type: plug
standard: eu
board: esp8266
---

- Can be flashed with Tuya-Convert
- Change IP Setting or if using DHCP delete the manual_ip setting under WIFI!

```yaml
substitutions:
  device_name: gosund-sp1
  friendly_name: Gosund SP1
  device_description: Gosund SP01 Smart Plug
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
  red_led_pin: GPIO13
  blue_led_pin: GPIO1

esphome:
  name: ${device_name}
  comment: ${device_description}

esp8266:
  board: esp8285
  
# OTA flashing
ota:
  - platform: esphome

wifi: # Your Wifi network details
  
# Enable fallback hotspot in case wifi connection fails  
  ap:

# Enabling the logging component
logger:

# Enable Home Assistant API
api:

# Enable the captive portal
captive_portal:

# Enable the Web Server component 
webserver:

# Sync time with Home Assistant
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
  # Gosund SP1 Config
  # Power sensor
  - platform: hlw8012
    sel_pin:
      number: GPIO12
      inverted: true
    cf_pin: GPIO04
    cf1_pin: GPIO05
    current_resistor: ${sp1_current_resistor}
    voltage_divider: ${sp1_voltage_divider}
    change_mode_every: 8
    update_interval: 10s
    # Current sensor
    current:
      name: ${friendly_name} Energy Current
      unit_of_measurement: A
      accuracy_decimals: 2
    # Voltage sensor
    voltage:
      name: ${friendly_name} Energy Voltage
      unit_of_measurement: V
      accuracy_decimals: 1
    # Power sensor
    power:
      id: power
      name: ${friendly_name} Energy Power
      unit_of_measurement: W
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
      number: GPIO3
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
    pin: GPIO14
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_on:
      - light.turn_on: led
    on_turn_off:
      - light.turn_off: led

output:
  # esphome state led
  - platform: esp8266_pwm
    id: state_led
    pin:
      number: ${blue_led_pin}
      inverted: true

light:
  # Power state light
  - platform: monochromatic
    output: state_led
    id: led

# Uses the red LED as a status indicator
status_led:
  pin:
    number: ${red_led_pin}
    inverted: true
```
