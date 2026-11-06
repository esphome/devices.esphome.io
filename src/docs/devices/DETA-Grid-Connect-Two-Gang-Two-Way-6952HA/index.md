---
title: DETA Grid Connect Smart Switch 2 Way 2 Gang (6952HA)
date-published: 2025-01-18
type: switch
standard: au
board: bk72xx
made-for-esphome: False
difficulty: 3
---

## Overview

The DETA [Smart Switch 2 Way 2 Gang (6952HA)](https://www.bunnings.com.au/deta-switch-smart-grid-2-way-2-gang_p0346911)
is part of the [Grid Connect ecosystem](https://grid-connect.com.au/), and is sold at Bunnings in Australia.

![6952HA packet](./6952HA-packet.jpg "DETA 6952HA packet, with 'Series 2' highlighted.")

Also known as:

- Smart Double Gang 2 Way Touch Light Switch
  ([Deta website](https://detaelectrical.com.au/product/deta-grid-connect-smart-double-gang-2-way-touch-light-switch/))
- Twin Gang 2 Way Touch Light Switch ([Grid Connect website](https://grid-connect.com.au/download/6952ha/))

### Variations

As shown on the front of the packet.

| Variation | Microcontroller | Board     | Firmware | Flashing methods |
| --------- | --------------- | --------- | -------- | ---------------- |
| Series 2  | Beken BK7231N   | Tuya CB3S | v1.3.5   | Manual flashing  |

## Setup Guide

### Manual Flashing

You'll need a USB to serial adapter.

1. Remove the front plastic face.
2. Unscrew the two exposed screws.
3. Remove the clear panel and the small PCB underneath.
4. Connect TX, RX, GND and 3V3 to the USB to serial adapter.

![6952HA manual flashing](./6952HA-manual-flashing.jpg "DETA 6952HA board connected to a USB to serial adapter.")

Follow the [ltchiptool](https://github.com/libretiny-eu/ltchiptool) documentation to flash the microcontroller with
[ESPHome Kickstart](https://github.com/libretiny-eu/esphome-kickstart/releases), or build an ESPHome package from the
configuration below.

## GPIO Pinouts

### Series 2 (CB3S) GPIO Pinouts

_See
[Pinouts on CB3S Module Datasheet](https://developer.tuya.com/docs/iot/cb3s?id=Kai94mec0s076#title-5-Pin%20definition) for more detail_

| Pin | Function                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| P24 | Status LED _(inverted)_                                                                                                                       |
| P26 | Button 1 _(inverted)_                                                                                                                         |
| P23 | Button 2 _(inverted)_                                                                                                                         |
| P14 | Relay 1 and Button 1 LED                                                                                                                      |
| P6  | Relay 2 and Button 2 LED                                                                                                                      |
| P7  | Light 1 activation status, taking into account the _local_ activation (this device) xor the _remote_ activation (another device) _(inverted)_ |
| P8  | Light 2 activation status, taking into account the _local_ activation (this device) xor the _remote_ activation (another device) _(inverted)_ |

## Configuration Examples

### Series 2 (CB3S) Configuration Examples

```yaml
substitutions:
  device_name: "deta-2-way-2-gang-switch"

  friendly_name: "DETA 2 Way 2 Gang Switch"
  light_1_name: "${friendly_name} 1"
  light_2_name: "${friendly_name} 2"
  light_1_icon: "mdi:light-recessed"
  light_2_icon: "mdi:light-recessed"

esphome:
  name: ${device_name}
  friendly_name: ${friendly_name}

bk72xx:
  board: cb3s

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:

status_led:
  pin:
    number: P24
    inverted: true

light:
  - platform: binary
    output: filter_1
    id: light_1
    name: "${light_1_name}"
    icon: "${light_1_icon}"

  - platform: binary
    output: filter_2
    id: light_2
    name: "${light_2_name}"
    icon: "${light_2_icon}"

binary_sensor:
  # Buttons
  - platform: gpio
    id: button_1
    pin:
      number: P26
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - light.toggle: light_1
    internal: true

  - platform: gpio
    id: button_2
    pin:
      number: P23
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - light.toggle: light_2
    internal: true

  # Activation statuses
  # Represents the "local" relay (this device) XOR the "remote" relay (another device).
  # It only shows TRUE if one of the "local" or "remote" relays are active, but not both.
  - platform: gpio
    id: activation_status_1
    pin:
      number: P7
      mode: INPUT
      inverted: true
    internal: true

  - platform: gpio
    id: activation_status_2
    pin:
      number: P8
      mode: INPUT
      inverted: true
    internal: true

switch:
  # Relays
  - platform: gpio
    id: relay_1
    pin: P14
    internal: true

  - platform: gpio
    id: relay_2
    pin: P6
    internal: true

output:
  # Filters
  # Triggered when the "light" entity is turned on or off. Will only toggle
  # the associated relay if the "light" entity is out of sync with the
  # "activation status"; otherwise do nothing as the state is already correct.Z
  - platform: template
    type: binary
    id: filter_1
    write_action:
      then:
        - if:
            condition:
              - lambda: "return state != id(activation_status_1).state;"
            then:
              - switch.toggle: relay_1

  - platform: template
    type: binary
    id: filter_2
    write_action:
      then:
        - if:
            condition:
              - lambda: "return state != id(activation_status_2).state;"
            then:
              - switch.toggle: relay_2
```

### Add Reboot button to HA

```yaml
switch:
  - platform: restart
    name: ${friendlyname} REBOOT
```
