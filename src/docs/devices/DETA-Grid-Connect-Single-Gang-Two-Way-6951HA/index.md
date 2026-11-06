---
title: DETA Grid Connect Smart Switch Single Gang Two-Way (6951HA)
date-published: 2024-05-21
type: switch
standard: au
board: bk72xx
made-for-esphome: False
difficulty: 2
---

## Overview

The DETA [Smart Switch Single Gang Two-Way (6951HA)][1] is part of the [Grid Connect ecosystem][2], and is sold at
Bunnings in Australia.

[1]: https://www.bunnings.com.au/deta-grid-connect-smart-single-gang-2-way-touch-light-switch_p0346910
[2]: https://grid-connect.com.au/

Also known as:

- Smart Single Gang 2 Way Touch Light Switch
  ([Deta website](https://detaelectrical.com.au/product/deta-grid-connect-smart-single-gang-2-way-touch-light-switch/))
- Single Gang 2 Way Touch Light Switch ([Grid Connect website](https://grid-connect.com.au/download/6951ha/))

### Variations

As shown on the front of the packet.

| Variation | Microcontroller | Board     | Firmware | Flashing methods |
| --------- | --------------- | --------- | -------- | ---------------- |
| Series 1  | Beken BK7231T   | Tuya WB3S | v1.1.5   | Cloudcutter      |

## Setup Guide

### Cloudcutter

[Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) is a tool designed to simplify the flashing process.
Follow the [official guide](https://github.com/tuya-cloudcutter/tuya-cloudcutter) for instructions.

You can use the “Lonsonho” brand “X801A 1-Gang Switch” option in Cloudcutter.

### Manual Flashing

Manual Flashing has not been tested on this specific model, but other models with the same chip have been tested and
these manual steps work, you'll need a USB to serial adapter. Follow the disassembly steps below:

1. Remove the front plastic face.
2. Unscrew the two exposed screws.
3. Remove the clear panel and the small PCB underneath.

> **Tip**: You can convert these switches to ESPHome by replacing the WB3S chip with an ESP-12E or ESP-12F chip and
adding a 10k pull-down resistor on GPIO15.

## GPIO Pinouts

### Series 1 (WB3S) GPIO Pinouts

| Pin | Function                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| P24 | Status LED _(inverted)_                                                                                                                     |
| P26 | Button _(inverted)_                                                                                                                         |
| P14 | Relay and Button LED                                                                                                                        |
| P8  | Light activation status, taking into account the _local_ activation (this device) xor the _remote_ activation (another device) _(inverted)_ |

> **Note**: Each relay shares a pin with its associated LED.

## Advanced Modifications

To gain individual control of button LEDs, remove specific diodes and solder a wire from the cathode side of the diode
pad to a spare GPIO pin.
[See this example](https://community-assets.home-assistant.io/optimized/4X/f/9/b/f9b1f8ea23ccc1049ea4eda1765e3f19fb173925_2_666x500.jpeg).

## Configuration Examples

### Series 1 (WB3S) Configuration Examples

```yaml
substitutions:
  device_name: "deta-2-way-1-gang-switch"

  friendly_name: "DETA 2 Way 1 Gang Switch"
  light_1_name: "${friendly_name}"
  light_1_icon: "mdi:light-recessed"

esphome:
  name: ${device_name}
  friendly_name: ${friendly_name}

bk72xx:
  board: wb3s

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

  # Activation statuses
  # Represents the "local" relay (this device) XOR the "remote" relay (another device).
  # It only shows TRUE if one of the "local" or "remote" relays are active, but not both.
  - platform: gpio
    id: activation_status_1
    pin:
      number: P8
      mode: INPUT
      inverted: true
    internal: true

switch:
  # Relay
  - platform: gpio
    id: relay_1
    pin: P14
    internal: true

output:
  # Filters
  # Triggered when the "light" entity is turned on or off. Will only toggle
  # the associated relay if the "light" entity is out of sync with the
  # "activation status"; otherwise do nothing as the state is already correct.
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
```

### Add Reboot button to HA

```yaml
switch:
  - platform: restart
    name: ${friendlyname} REBOOT
```
