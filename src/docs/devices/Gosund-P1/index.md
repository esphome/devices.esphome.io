---
title: Gosund P1
Model: P1
date-published: 2021-03-21
type: relay
standard: UK
board: esp8266
---

## ATTENTION! Be aware that some of these devices can do "sudden power toggles". Meaning the relays will very shortly "toggle" and thus might harm you equipment

## Use this totally at you own risk

## Although this risk is there the full functionality of these P1's can be achieved by using this ESPHome yaml. Good luck

```yaml
esphome:
  name: p1_01

esp8266:
  board: esp8285
  restore_from_flash: true

substitutions:
  plug_name: p1_01

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Enable logging
logger:
  #level: VERY_VERBOSE
  #baud_rate: 0
  #level: DEBUG
  baud_rate: 0
  logs:
    adc: INFO

# Enable Home Assistant API
api:

ota:

time:
  - platform: homeassistant
    id: homeassistant_time

status_led:
  pin:
    number: GPIO02
    inverted: True

uart:
  rx_pin: GPIO03
  #tx_pin: GPIO01
  baud_rate: 4800
  
sensor:
  - platform: wifi_signal
    name: "${plug_name} - WiFi Signal"
    update_interval: 60s
  - platform: uptime
    name: "${plug_name} - Uptime"
    icon: mdi:clock-outline
    update_interval: 60s
  - platform: cse7766
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
      filters:
        - lambda: return x * 2.34245;
    power:
      name: "${plug_name} - Watt"
      unit_of_measurement: W
      id: "${plug_name}_Wattage"
      icon: mdi:flash-outline
      filters:
        - lambda: return x * 2.34245;
    update_interval: 3s
  - platform: total_daily_energy
    name: "${plug_name} - Dagverbruik"
    power_id: "${plug_name}_Wattage"
    filters:
        # Multiplication factor from W to kW is 0.001
        - multiply: 0.001
    unit_of_measurement: kWh
    icon: mdi:clock-alert
  - platform: adc
    pin: GPIO17
    id: gpio17
    internal: true
    update_interval: 0.1s
    filters:
      - lambda: |-
          if(x >= 0.60 && x < 0.90){
            id(buttonrelay1).publish_state(true);
          } else if(x >= 0.30 && x < 0.60){
            id(buttonrelay2).publish_state(true);
          }
          else if(x > 0.10 && x < 0.30){
            id(buttonrelay3).publish_state(true);
          } else {
            id(buttonrelay1).publish_state(false);
            id(buttonrelay2).publish_state(false);
            id(buttonrelay3).publish_state(false);
          }
          return{};

binary_sensor:
  - platform: gpio
    id: button
    internal: true
    pin:
      number: GPIO16
      mode: INPUT_PULLUP
      inverted: true
    #on_state:
    on_press:
      - switch.toggle: relay4
  - platform: template
    id: buttonrelay1
    internal: true
    on_press:
      - switch.toggle: relay1
    filters:
      - delayed_off: 100ms
  - platform: template
    id: buttonrelay2
    internal: true
    on_press:
      - switch.toggle: relay2
    filters:
      - delayed_off: 100ms
  - platform: template
    id: buttonrelay3
    internal: true
    on_press:
      - switch.toggle: relay3
    filters:
      - delayed_off: 100ms

text_sensor:
  - platform: version
    name: "${plug_name} - ESPHome Version"

switch:
  - platform: gpio
    pin: GPIO14
    id: relay1
    restore_mode: RESTORE_DEFAULT_ON
    name: '${plug_name} - Switch1'
    icon: mdi:power-socket-eu
  - platform: gpio
    pin: GPIO12
    id: relay2
    restore_mode: RESTORE_DEFAULT_ON
    name: '${plug_name} - Switch2'
    icon: mdi:power-socket-eu
  - platform: gpio
    pin: GPIO13
    id: relay3
    restore_mode: RESTORE_DEFAULT_ON
    name: '${plug_name} - Switch3'
    icon: mdi:power-socket-eu
  - platform: gpio
    pin: GPIO05
    id: relay4
    restore_mode: RESTORE_DEFAULT_ON
    name: '${plug_name} - Switch USB'
    icon: mdi:power-socket-eu
    inverted: yes
  - platform: restart
    name: "${plug_name} - ESP Restart"
  - platform: template
    name: '${plug_name} - Switch off 60s (reset!)'
    turn_on_action:
        - switch.turn_off: relay3
        - delay: 60s
        - switch.turn_on: relay3
```
