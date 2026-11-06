---
title: Arlec PC399HA Plug
date-published: 2023-06-17
type: plug
standard: au
board: esp8266
---

![Product Image](./Arlec-PC399HA-Plug.jpg "Product Image")

The Arlec PC399HA power plug is part of the [Grid Connect ecosystem](https://grid-connect.com.au/) and is sold at
Bunnings in Australia and New Zealand.

As at the time of writing, they can sometimes be flashed without disassembly or soldering
[using tuya-convert](#tuya-convert).
Newer versions cannot yet be flashed without opening the device.

To flash the device manually the unit needs to be opened and then flashed over the UART connection.
[An example video on youtube shows how to wire this into a UART adaptor.](https://www.youtube.com/watch?v=MAb5f0rxvKU)

## GPIO Pinout

| Pin    | Function                  |
| ------ | ------------------------- |
| GPIO03 | Button                    |
| GPIO04 | BL0937 CF                 |
| GPIO05 | BL0937 CF1                |
| GPIO12 | BL0937 SEL                |
| GPIO13 | Blue LED (Inverted: true) |
| GPIO14 | Relay                     |

## Getting it up and running

### Tuya Convert

These switches are Tuya devices, so if you don't want to open them up to flash directly, you can
[use tuya-convert to initially get ESPHome onto them](/devices/tuya-convert). After that, you can use ESPHome's OTA
functionality to make any further changes.

- Put the switch into "smartconfig" / "autoconfig" / pairing mode by holding any button for about 5 seconds.
- The status LED blinks rapidly to confirm that it has entered pairing mode.

## Basic Configuration

```yaml
substitutions:
  device_name: "arlec_PC399HA_1"
  name: "ARLEC PC399HA 1"

esphome:
  name: ${device_name}
  comment: ${name}
  friendly_name: ${name}

esp8266:
  board: esp01_1m

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: "api_password"

ota:
  password: "ota_password"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO3
      inverted: True
      mode: INPUT_PULLUP
    name: ${name} button
    filters:
      delayed_on_off: 100ms # Debouncing
    on_press:
      then:
        - switch.toggle: relay

switch:
  - platform: gpio
    pin: GPIO14
    name: "${name}"
    id: relay
    restore_mode: always on
    icon: mdi:power-socket-au
    on_turn_on:
      then:
        - output.turn_on: button_led
    on_turn_off:
      then:
        - output.turn_off: button_led

output:
  - platform: gpio
    id: button_led
    pin:
      number: GPIO13
      inverted: yes

sensor:
  - platform: hlw8012
    model: BL0937
    sel_pin:
      number: GPIO12
      inverted: true
    cf_pin: GPIO04
    cf1_pin: GPIO05
    voltage_divider: 1650 # You may need to adjust this to be accurate
    current:
      name: "${name} Current"
      accuracy_decimals: 3
    voltage:
      name: "${name} Voltage"
      accuracy_decimals: 2
    power:
      name: "${name} Power"
      id: totalMediaWatts
    energy:
      name: "${name} Energy"
    update_interval: 10s
```
