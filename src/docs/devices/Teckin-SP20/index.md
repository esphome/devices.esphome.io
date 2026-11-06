---
title: Teckin SP20
date-published: 2019-10-11
type: plug
standard: us
board: esp8266
---

[Amazon Link](https://www.amazon.com/dp/B07CVFD2KC)

## GPIO Pinout

| Pin    | Function          |
| ------ | ----------------- |
| GPIO0  | Status LED - Red  |
| GPIO12 | sel_pin hlw8012   |
| GPIO5  | cf_pin hlw8012    |
| GPIO14 | cf1_pin hlw8012   |
| GPIO2  | Status LED - Blue |
| GPIO13 | Button            |
| GPIO4  | Relay             |

## Alternate GPIO Pinout

Unit from 2018/April (Amazon) had a diffent pinout. Visually, the QR code was on the "Live" plug side, and programming
pins were slighlty different layout.

Worth a try if standard pin out isn't working properly (relay will constantly click due sel_pin difference)

| Pin    | Function          |
| ------ | ----------------- |
| GPIO0  | Status LED - Red  |
| GPIO3  | sel_pin hlw8012   |
| GPIO5  | cf_pin hlw8012    |
| GPIO14 | cf1_pin hlw8012   |
| GPIO15 | Status LED - Blue |
| GPIO13 | Button            |
| GPIO12 | Relay             |

Basic configuration below assumes standard pinout, update accordingly if using alternate pinout.

## Basic Configuration

```yaml
# Basic Config

substitutions:
  device_name: sp20
  friendly_name: SP20
  ip_address: <assigned static ip address for this device>

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m
  restore_from_flash: true

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: ${ip_address}
    gateway: !secret wifigateway
    subnet: !secret wifisubnet
    dns1: !secret wifidns
  ap:
    ssid: ${friendly_name}_AP
    password: !secret wifi_password

web_server:
  port: 80

logger:

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret espotapass

time:
  - platform: homeassistant
    id: homeassistant_time

sensor:
  - platform: hlw8012
    sel_pin:
      number: GPIO12
      inverted: True
    cf_pin: GPIO5
    cf1_pin: GPIO14
    current:
      name: ${friendly_name} Current
    power:
      name: ${friendly_name} Power
      id: power_monitor_value
      filters:
        - lambda: return (x / 2.2);
    voltage:
      name: ${friendly_name} Voltage
    current_resistor: 0.001 # default 0.001
    voltage_divider: 910 # default 2351
    change_mode_every: 3 # default 8
    update_interval: 3s # default 60s

  - platform: total_daily_energy
    # https://esphome.io/components/sensor/total_daily_energy/
    name: ${friendly_name} Total Daily Energy
    power_id: power_monitor_value
    filters:
      - multiply: 0.001 # convert Wh to kWh
    unit_of_measurement: kWh

  - platform: uptime
    name: ${friendly_name} Uptime

  - platform: wifi_signal
    name: ${friendly_name} Wifi Signal
    update_interval: 60s

text_sensor:
  - platform: version
    name: ${friendly_name} ESPHome Version
  - platform: wifi_info
    ip_address:
      name: ${friendly_name} IP

status_led:
  pin:
    number: GPIO0 # Red LED
    inverted: True

output:
  - platform: esp8266_pwm
    id: blue_led_output
    pin:
      number: GPIO2
      inverted: True

light:
  - platform: monochromatic
    name: ${friendly_name} Blue LED
    output: blue_led_output
    id: blue_led
    default_transition_length: 1ms # default 1s
    internal: True

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
    id: button
    name: ${friendly_name} Button
    on_press:
      - switch.toggle: relay_template
    internal: True

switch:
  - platform: gpio
    pin: GPIO4
    id: relay

  - platform: template
    # https://esphome.io/components/switch/template/
    name: ${friendly_name}
    id: relay_template
    lambda: |-
      if (id(relay).state) {
        return true;
      } else {
        return false;
      }
    turn_on_action:
      - light.turn_on: blue_led
      - switch.turn_on: relay
    turn_off_action:
      - light.turn_off: blue_led
      - switch.turn_off: relay
```
