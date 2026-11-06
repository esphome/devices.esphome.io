---
title: DETA Outdoor Double Powerpoint (6294HA)
date-published: 2023-10-23
type: plug
standard: au
board: bk72xx
---

## Overview

The
[DETA Outdoor Double Powerpoint](https://www.bunnings.com.au/deta-grid-connect-smart-outdoor-double-powerpoint_p0172781)
comes with a WB2S module.

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
| P8  | LED (inverted)      |
| P24 | Button 2 (inverted) |
| P6  | Relay 1             |
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
  devicemodel: Deta Grid Connect 6294HA

  # Left Socket
  friendlyname_left: Pond Pump
  deviceicon_left: "mdi:fountain"
  # Right Socket
  friendlyname_right: Garden Lights
  deviceicon_right: "mdi:light-flood-up"

#################################

esphome:
  name: ${devicename}

bk72xx:
  board: generic-bk7231t-qfn32-tuya

packages:
  device_base:
    !include {
      file: common/device_base.yaml,
      vars: { friendlyname: "Patio Power Point 1" },
    }

#################################

## ---------------- ##
##    Status LED    ##
## ---------------- ##
status_led:
  pin:
    number: P8
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
      mode: INPUT_PULLUP
      inverted: True
    id: right_button
    # on_press:
    #   then:
    #     - light.toggle: right_outlet
    on_click:
      - min_length: 50ms
        max_length: 1000ms
        then:
          - light.toggle: right_outlet
    internal: True

## -------------------------------------------
## Switch & template for switch
## Light & output for light

## ---------------- ##
##      Relays      ##
## ---------------- ##
output:
  # Right Relay
  - platform: gpio
    pin: P26
    id: relay_2

switch:
  ## ---------------- ##
  ##      Relays      ##
  ## ---------------- ##
  # Left Relay
  - platform: gpio
    pin: P6
    id: relay_1

  ## ---------------- ##
  ##     Switches     ##
  ## ---------------- ##
  # Left Switch (Templated)
  - platform: template
    name: ${friendlyname_left}
    id: left_outlet
    icon: $deviceicon_left
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

## ---------------- ##
##     Switches     ##
## ---------------- ##
light:
  # Right Outlet
  - platform: binary
    name: ${friendlyname_right}
    icon: ${deviceicon_right}
    output: relay_2
    restore_mode: RESTORE_AND_OFF
    id: right_outlet

## ------------------ ##
##  Power Monitoring  ##
## ------------------ ##
logger:
  baud_rate: 0

uart:
  rx_pin: RX1
  baud_rate: 4800

sensor:
  - platform: cse7766
    current:
      name: "${friendlyname} Current"
    voltage:
      name: "${friendlyname} Voltage"
    power:
      name: "${friendlyname} Power"
    energy:
      name: "${friendlyname} Energy"
```
