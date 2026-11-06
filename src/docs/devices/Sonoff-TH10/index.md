---
title: Sonoff TH10/TH16
date-published: 2019-10-11
type: relay
standard: global
board: esp8266
---

## Information

The Sonoff TH10 and TH16 are 10A/16A smart WiFi switches with optional temperature and humidity monitoring.

## GPIO Pinout

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO0  | Push Button (HIGH = off, LOW = on) |
| GPIO12 | Relay and Red LED                  |
| GPIO13 | Blue Status LED                    |
| GPIO14 | Sensor                             |

## Basic Configuration

The following configuration also contains commented lines for adding a 1-Wire sensor via the 2.5 mm jack.

```yaml
# These substitutions allow for easy renaming
substitutions:
  name: "sonoff-th1X"
  friendly_name: "Sonoff TH1X"

# Basic Config
esphome:
  name: "${name}"
  friendly_name: "${friendly_name}"
  esp8266:
    board: esp01_1m

# Enable logging
logger:

# Enable Home Assistant API
api:

# Enable the web server
web_server:

# Enable over-the-air updates
ota:
  platform: esphome

# Wifi Setup
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

# One-Wire for 2.5mm jack sensors
# one_wire:
# - platform: gpio
# pin: GPIO14

sensor:
  - platform: wifi_signal
    name: "WiFi Signal"
    update_interval: 60s
# Example setup for a DS18B20
# - platform: dallas_temp
#   name: temperature
#   update_interval: 120s

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    name: "Button"
    on_press:
      - light.toggle: th1x_relay
  - platform: status
    name: "$Status"

switch:
  - platform: restart
    name: "$Restart"

output:
  - platform: esp8266_pwm
    id: blue_led
    pin:
      number: GPIO13
      inverted: True

  - platform: gpio
    id: relay
    pin: GPIO12

light:
  - platform: monochromatic
    name: "$Blue LED"
    id: blue_led
    restore_mode: RESTORE_DEFAULT_OFF
    output: blue_led
  - platform: binary
    name: "Relay"
    id: th1x_relay
    output: relay
```
