---
title: Sonoff RF Bridge
date-published: 2019-10-11
type: misc
standard: global
board: esp8266
difficulty: 3
---

## GPIO Pinout

| Pin    | Function                        |
| ------ | ------------------------------- |
| GPIO13 | Blue LED (HIGH = off, LOW = on) |
| GPIO0  | Button 1                        |
| 4      | Remote Receiver                 |
| 5      | Remote Transmitter              |

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: sonoff_rf_bridge01

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:
api:
ota:

# Device Specific Config

binary_sensor:
- platform: status
    name: "RF Bridge Status"

# use esphome log viewer to get binary transmission for sensor state.  Below are examples when using either single state or dual state sensors.

# use this for single state sensors (single trigger)
  - platform: remote_receiver
    name: "Sensor1"
    rc_switch_raw:
      code: '100110011100011010101001'
      protocol: 1



# use this for dual state sensors (open/closed trigger)
  - platform: remote_receiver
    name: "Sensor 2 Open"
    internal: yes
    rc_switch_raw:
      code: '001111111110111100101110'
      protocol: 1
    on_press:
      - binary_sensor.template.publish:
          id: Sensor2
          state: ON
  - platform: remote_receiver
    name: "Sensor 2 Closed"
    internal: yes
    rc_switch_raw:
      code: '001111111110111100100111'
      protocol: 1
    on_press:
      - binary_sensor.template.publish:
          id: Sensor2
          state: OFF
  - platform: template
    name: "Sensor2 State"
    device_class: window
    id: Sensor2


remote_receiver:
  pin: 4
#  dump: all
  dump: rc_switch
  filter: 100us
  tolerance: 50%
  idle: 2ms

remote_transmitter:
  pin: 5
  carrier_duty_percent: 100%

status_led:
  pin:
    number: GPIO13
    inverted: yes
```
