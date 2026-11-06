---
title: DETA Outdoor Double Powerpoint (6294HA Series 2)
date-published: 2025-08-31
type: plug
standard: au
board: bk72xx
---

## Overview

The [DETA Outdoor Double Powerpoint Series 2][1] comes with a CB2S module.

[1]: https://www.bunnings.com.au/deta-grid-connect-smart-outdoor-double-powerpoint_p0172781

This is in contrast to the series 1 device which has a WB2S module. The associated pins for each function have changed
slightly as a result.

### Using Cloudcutter

[Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) is a tool that simplifies flashing Tuya-based
devices. It allows you to flash the firmware remotely, eliminating the need to physically open the device.
[Follow these instructions](https://github.com/tuya-cloudcutter/tuya-cloudcutter) to flash your Deta 6294HA device using
Cloudcutter.

---

### Note on Power Monitoring

Power measurement uses the HLW8032 or CSE7766 protocol at 4800 baud. Program the device before installing the module as
the RX pin is used.

---

### GPIO Pinout

#### ESP-Based Pinout

| Pin    | Function            |
| ------ | ------------------- |
| GPIO03 | RX for CSE7766      |
| GPIO04 | Button 1 (inverted) |
| GPIO05 | LED (inverted)      |
| GPIO12 | Button 2 (inverted) |
| GPIO13 | Relay 1             |
| GPIO14 | Relay 2             |

#### BK72XX-Based Pinout

| Pin | Function            |
| --- | ------------------- |
| RX1 | RX for CSE7766      |
| P7  | Button 1 (inverted) |
| P6  | LED (inverted)      |
| P24 | Button 2 (inverted) |
| P8  | Relay 1             |
| P26 | Relay 2             |

---

### Calibration

For calibration, check out Frenck's
[comprehensive guide](https://frenck.dev/calibrating-an-esphome-flashed-power-plug/#7-applying-corrections-to-the-firmware).

---

### Configuration

> **Note:** The configuration examples include calibration data. Modify as needed.

```yaml
substitutions:
  devicename: "patio-power-point-1"
  deviceid: patio_power_point_1
  friendlyname: "Patio Power Point 1"
  devicemodel: Deta Grid Connect 6294HA Series 2

  # Left Socket
  friendlyname_left: Socket 1
  # Right Socket
  friendlyname_right: Socket 2

  update_interval: 1s

#################################

wifi:
  ap:
    ssid: DETA Outdoor Double Power Point
    password: ""
  reboot_timeout: 0s

api:
  reboot_timeout: 0s

captive_portal:

ota:
  platform: esphome

esphome:
  name: ${devicename}

bk72xx:
  board: cb2s

#################################

## ---------------- ##
##    Status LED    ##
## ---------------- ##
status_led:
  pin:
    number: P6
    inverted: true

## ----------------- ##
##      Buttons      ##
## ----------------- ##
binary_sensor:
  # Left Button
  - platform: gpio
    pin:
      number: P7
      mode: INPUT
      inverted: True
    id: left_button
    on_press:
      then:
        - switch.toggle: left_outlet
    # on_click:
    #   - min_length: 300ms
    #     max_length: 1000ms
    #     then:
    #       - switch.toggle: left_outlet
    internal: True

  # Right Button
  - platform: gpio
    pin:
      number: P24
      mode: INPUT
      inverted: True
    id: right_button
    on_press:
      then:
        - switch.toggle: right_outlet
    # on_click:
    #   - min_length: 300ms
    #     max_length: 1000ms
    #     then:
    #       - switch.toggle: left_outlet
    internal: True

## -------------------------------------------
## Switch & template for switch

switch:
  ## ---------------- ##
  ##      Relays      ##
  ## ---------------- ##
  # Left Relay
  - platform: gpio
    pin: P8
    id: relay_1

  # Right Relay
  - platform: gpio
    pin: P26
    id: relay_2

  ## ---------------- ##
  ##     Switches     ##
  ## ---------------- ##
  # Left Switch (Templated)
  - platform: template
    name: ${friendlyname_left}
    id: left_outlet
    lambda: |-
      if (id(relay_1).state) {
        return true;
      } else {
        return false;
      }
    turn_on_action:
      - switch.turn_on: relay_1
    turn_off_action:
      - switch.turn_off: relay_1

    # Right Switch (Templated)
  - platform: template
    name: ${friendlyname_right}
    id: right_outlet
    lambda: |-
      if (id(relay_2).state) {
        return true;
      } else {
        return false;
      }
    turn_on_action:
      - switch.turn_on: relay_2
    turn_off_action:
      - switch.turn_off: relay_2

## ------------------ ##
##  Power Monitoring  ##
## ------------------ ##
logger:
  baud_rate: 0

uart:
  rx_pin: RX1
  baud_rate: 4800
  parity: EVEN

sensor:
  - platform: cse7766
    current:
      name: "${friendlyname} Current"
      filters:
        - throttle_average: ${update_interval}
    voltage:
      name: "${friendlyname} Voltage"
      filters:
        - throttle_average: ${update_interval}
        - calibrate_linear:
            - 0.0 -> 0.0
            - 120.0 -> 230.0
    power:
      name: "${friendlyname} Power"
      filters:
        - throttle_average: ${update_interval}
    energy:
      name: "${friendlyname} Energy"
      filters:
        - throttle_average: ${update_interval}
```
