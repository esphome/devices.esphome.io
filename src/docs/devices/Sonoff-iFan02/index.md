---
title: Sonoff iFan02
date-published: 2019-10-11
type: misc
standard: global
board: esp8266
---

## GPIO Pinout

| Pin    | Function      |
| ------ | ------------- |
| GPIO12 | Light Relay 1 |
| GPIO5  | Fan Relay 2   |
| GPIO4  | Fan Relay 3   |
| GPIO15 | Fan Relay 4   |

## Basic Configuration

```yaml
esphome:
  name: ifan02
  friendly_name: iFan02
  on_boot: #This toggle thing makes sure the states get restored on reboot
    priority: -100
    then:
      - delay: 200ms
      - fan.toggle: ifan02_fan
      - fan.toggle: ifan02_fan
      - delay: 200ms
      - light.toggle: ifan02_light
      - delay: 1ms
      - light.toggle: ifan02_light

esp8266:
  board: esp01_1m
  restore_from_flash: true

logger:
api:
ota:

wifi:
  networks:
    - ssid: !secret wifi_ssid
      password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "iFan02"
    password: !secret wifi_password

captive_portal:
  - platform: status
    name: "Sonoff iFan02 Status"

output:
  - platform: gpio
    pin: GPIO12
    id: lightrelay
  - platform: template
    type: float
    id: fan_decode
    write_action:
      - lambda: |-
          if (state < 0.25) {
            id(fan2sw).turn_off();
            id(fan3sw).turn_off();
            id(fan4sw).turn_off();
          }
          else if (state < 0.5) {
            id(fan2sw).turn_on();
            id(fan3sw).turn_off();
            id(fan4sw).turn_off();
          }
          else if (state < 0.75) {
            id(fan2sw).turn_on();
            id(fan3sw).turn_on();
            id(fan4sw).turn_off();
          }
          else {
            id(fan2sw).turn_on();
            id(fan3sw).turn_off();
            id(fan4sw).turn_on();
          }

light:
  - platform: binary
    name: "Fan Light"
    output: lightrelay
    restore_mode: RESTORE_DEFAULT_OFF
    id: ifan02_light

sensor:
  - platform: wifi_signal
    update_interval: 10s
    id: wifi_signal_db
  - platform: uptime
    name: Uptime
  - platform: copy
    source_id: wifi_signal_db
    name: "WiFi Signal Percent"
    filters:
      - lambda: return min(max(2 * (x + 100.0), 0.0), 100.0);
    unit_of_measurement: "%"
  - platform: adc
    pin: VCC
    name: "VCC Voltage"

button:
  - platform: restart
    name: "Restart"

time:
  - platform: homeassistant
    id: homeassistant_time

switch:
  - platform: gpio
    name: "Fan 3 Relay"
    pin: GPIO4
    id: fan3sw
    restore_mode: RESTORE_DEFAULT_OFF
    internal: true
  - platform: gpio
    name: "Fan 2 Relay"
    pin: GPIO5
    id: fan2sw
    restore_mode: RESTORE_DEFAULT_OFF
    internal: true
  - platform: gpio
    name: "Fan 4 Relay"
    pin: GPIO15
    id: fan4sw
    restore_mode: RESTORE_DEFAULT_OFF
    internal: true

fan:
  - platform: speed
    output: fan_decode
    name: "Fan"
    icon: mdi:fan
    restore_mode: RESTORE_DEFAULT_OFF
    speed_count: 3
    id: ifan02_fan

text_sensor:
  - platform: wifi_info
    ip_address:
      name: IP Address
    ssid:
      name: Connected SSID
```
