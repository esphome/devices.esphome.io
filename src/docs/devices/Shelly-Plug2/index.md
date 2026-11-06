---
title: Shelly Plug 2
date-published: 2020-12-24
type: plug
standard: eu
board: esp8266
---

## GPIO Pinout

| Pin    | Function       |
| ------ | -------------- |
| GPIO4  | Button         |
| GPIO5  | HLW8012 CF Pin |
| GPIO13 | Green Led 1    |
| GPIO14 | Red Led 1      |
| GPIO16 | Blue Led 1     |
| GPIO12 | Relay / Led 2  |

## Configuration as relay with overpower protection

```yaml
substitutions:
  devicename: shelly_plug_2
  channel_1: Relay
  max_power: "3500"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

# Enable logging
logger:

# Enable Home Assistant API
api:
ota:

time:
  - platform: homeassistant
    id: my_time

esphome:
  name: ${devicename}

esp8266:
  board: esp8285

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO12
      inverted: True
    name: "${devicename}_button"
    on_press:
      - switch.toggle: relay

output:
  - platform: gpio
    pin: GPIO13
    id: led_g
  - platform: gpio
    pin: GPIO14
    id: led_r
  - platform: gpio
    pin: GPIO16
    id: led_b

interval:
  - interval: 1s
    then:
      if:
        condition:
          wifi.connected:
        then:
          - output.turn_on: led_g
          - output.turn_off: led_r
        else:
          - output.turn_on: led_r
          - output.turn_off: led_g

switch:
  - platform: gpio
    pin: GPIO4
    id: relay
    restore_mode: RESTORE_DEFAULT_ON
    name: "${channel_1}"

sensor:
  - platform: hlw8012
    sel_pin: GPIO1 # not connected
    cf_pin: GPIO5
    cf1_pin: GPIO3 # not connected
    current:
      name: "${channel_1} current"
      internal: true
    voltage:
      name: "${channel_1} voltage"
      internal: true
    power:
      name: "${channel_1} power"
      id: power
      unit_of_measurement: "W"
      icon: mdi:flash-outline
      on_value_range:
        - above: ${max_power}
          then:
            - switch.turn_off: relay
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: Message from ${devicename}
                data_template:
                  message: Switch turned off because power exceeded ${max_power}W
    update_interval: 10s

  - platform: total_daily_energy
    name: "${channel_1} daily energy"
    power_id: power
    filters:
      # Multiplication factor from W to kW is 0.001
      - multiply: 0.001
    unit_of_measurement: kWh
```
