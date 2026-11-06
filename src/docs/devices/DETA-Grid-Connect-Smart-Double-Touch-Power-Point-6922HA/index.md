---
title: Deta Grid Connect Double Powerpoint 6922HA
date-published: 2023-10-23
type: plug
standard: au
board: bk72xx
---

## Deta Grid Connect Smart Double Touch Power Point

Sold by [Bunnings Warehouse](https://www.bunnings.com.au/deta-grid-connect-smart-double-touch-power-point_p0098813)
this is a AU/NZ standard wall outlet/powerpoint based on the Beken BK7231T module. Now that ESPHome natively supports
BK72XX microcontrollers, you can also put ESPHome directly onto the device.

## Getting it up and running

### Using Cloudcutter

[Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) is a tool designed to simplify the process of
flashing Tuya-based devices. It allows you to bypass the need for physically opening the device and swapping out chips.
By leveraging the cloud APIs, Cloudcutter enables you to flash the firmware remotely, making it a convenient and less
intrusive option. Follow the instructions on the
[Cloudcutter GitHub repository](https://github.com/tuya-cloudcutter/tuya-cloudcutter) to use this method for flashing
your Deta 6294HA device.

### Disassembly

If you can't or don't wish to use Cloudcutter, you can flash directly to the outlet with USB to serial adapter.

To disassemble the outlet in order to flash, remove the front plastic face (secured by clips on each side),
then remove the two exposed screws. Remove the clear panel and then carefully remove the small thin PCB
that sat underneath the panel.

## GPIO pinout

| GPIO # |   Component   |
|:------:|--------------:|
| P8     |    Status LED |
| P14    |      Button 1 |
| P24    |      Button 2 |
| P6     |       Relay 1 |
| P26    |       Relay 2 |

## Basic Configuration

```yaml
substitutions:
  device_name: deta_double_powerpoint
  friendly_name: "Deta Double Powerpoint"

#################################

esphome:
  name: ${devicename}

bk72xx:
  board: generic-bk7231t-qfn32-tuya

packages:
  device_base: !include { file: common/device_base.yaml, vars: { friendlyname : 'Deta Double Power Point'} }

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
      number: P14
      # number: P7
      mode: INPUT
      inverted: True
    id: left_button
    on_press:
      then:
        - switch.toggle: switch_left
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
        - switch.toggle: switch_right
    internal: True

switch:
  ## ---------------- ##
  ##      Relays      ##
  ## ---------------- ##
  # Left Switch
  - platform: gpio
    pin: P6
    id: relay_left

  # Right Switch
  - platform: gpio
    pin: P26
    id: relay_right

  ## ---------------- ##
  ##     Switches     ##
  ## ---------------- ##
  # Left Switch
  # Left Switch (Templated)
  - platform: template
    id: switch_left
    name: ${friendlyname_left}
    icon: ${deviceicon_left}
    lambda: |-
      if (id(relay_left).state) {
        return true;
      } else {
        return false;
      }
    turn_on_action:
      - switch.turn_on: relay_left
    turn_off_action:
      - switch.turn_off: relay_left

  # Right Switch (Templated)
  - platform: template
    id: switch_right
    name: ${friendlyname_right}
    icon: ${deviceicon_right}
    lambda: |-
      if (id(relay_right).state) {
        return true;
      } else {
        return false;
      }
    turn_on_action:
      - switch.turn_on: relay_right
    turn_off_action:
      - switch.turn_off: relay_right
```
