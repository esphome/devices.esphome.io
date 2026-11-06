---
title: ESP-01S 1 Channel Relay
date-published: 2022-01-13
type: relay
standard: global
board: esp8266
---
![Product Image](./ESP-01S-1-Channel-Relay.jpg "Product Image")

## Product description

This is a 5V 1-relay board with an ESP-01S.

The relay has COM+NO+NC exposed.

Working voltage: DC 5V

Relay Load: 10A 250VAC 10A 125VAC 10A 30VDC 10A 28VDC.

Available on UK Amazon, eBay and Aliexpress, very cheap and small

Size:approx. 36 x 25 x 16MM/1.4 x 0.9 x 0.6inch

ESP-01S is removable with 4x2 header, cheap USB adapters available, but GND and GPIO0 needs connecting for flashing

Config has a few more additions than basic

## Basic Config

```yaml
substitutions:
  # Modify variables based on your settings
  hostname: "heart"
  devicename: heart light

esphome:
  name: heart

esp8266:
  board: esp01_1m

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:
  - platform: esphome
    password: ""

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "Heart Fallback Hotspot"
    password: "f2MTBkrPhnmX"

captive_portal:

switch:
  - platform: gpio
    pin: GPIO0
    name: "Heart switch"
    inverted: true

  # The following can be omitted
  - platform: restart
    name: ${devicename} restart

sensor:
  - platform: wifi_signal
    name: ${devicename} wifi signal
    update_interval: 600s

  # human readable uptime sensor output to the text sensor above
  - platform: uptime
    name: ${devicename} Uptime in Days
    id: uptime_sensor_days
    update_interval: 60s
    on_raw_value:
      then:
        - text_sensor.template.publish:
            id: uptime_human
            state: !lambda |-
              int seconds = round(id(uptime_sensor_days).raw_state);
              int days = seconds / (24 * 3600);
              seconds = seconds % (24 * 3600);
              int hours = seconds / 3600;
              seconds = seconds % 3600;
              int minutes = seconds /  60;
              seconds = seconds % 60;
              return (
                (days ? String(days) + "d " : "") +
                (hours ? String(hours) + "h " : "") +
                (minutes ? String(minutes) + "m " : "") +
                (String(seconds) + "s")
              ).c_str();

time:
  - platform: homeassistant
    id: homeassistant_time

# Text sensors with general information.
text_sensor:
  # Expose ESPHome version as sensor.
  - platform: version
    name: $devicename Version
  # Expose WiFi information as sensors.
  - platform: wifi_info
    ip_address:
      name: $devicename IP
    bssid:
      name: $devicename BSSID

  # human readable update text sensor from sensor:uptime
  - platform: template
    name: Uptime Human Readable
    id: uptime_human
    icon: mdi:clock-start
```
