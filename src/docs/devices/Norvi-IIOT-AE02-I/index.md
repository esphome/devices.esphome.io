---
title: Norvi IIOT AE02-I
date-published: 2025-04-14
type: misc
standard: global
board: esp32
difficulty: 2
---

## Overview

This is a DIN mounted PLC-style ESP32 unit with 24V supply, OLED display, RS485, up to 8x 24V digital inputs, up to 6x
4-20mA analogue inputs, up to 6x 0-10V analogue inputs, up to 8x open collector outputs, or up to 6x 5A relay outputs
(depending on the model).
There are expansion modules that operate via i2c to provide more inputs or outputs.

The example below is for the 4-20mA current input version, with an attached 8x relay output module.

## Product Images

![Norvi IIOT AE02-I](https://github.com/user-attachments/assets/11dfaf8e-2827-4a4a-9ca9-9741d2220a35)

![8x 5A Relay Expansion](https://github.com/user-attachments/assets/fff40b67-0877-451f-a8ff-5c0f12929f7a)

![Schematic Front View](https://github.com/user-attachments/assets/edc0435c-f4db-41a7-91b8-dca2c112c675)

More details at [the Norvi product website](https://norvi.lk/norvi-iiot-industrial-esp32-for-iiot-applications) or
[a very similar version on Sensoper](https://sensoper.com/shop/sc-se-i8-am6-to2/)

[Data Sheet](https://norvi.lk/docs/norvi-iiot-ae02-i-datasheet/)

## Example Configuration

```yml

esphome:
  name: iiot-demo
  friendly_name: Norvi IIOT AE02-I Demo

esp32:
  variant: esp32
  framework:
    type: arduino

logger:
  baud_rate: 0

api:
  encryption:
    key: !secret api_key

ota:
  - platform: esphome
    password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

i2c:
  sda: 16
  scl: 17
  frequency: 800kHz

font:
  - file: "gfonts://Roboto"
    id: roboto
    size: 12

display:
  - platform: ssd1306_i2c
    id: front_display
    model: "SSD1306 128x64"
    pages:
      - id: page1
        lambda: |-
          it.printf(0, 0, id(roboto), "Hello World!");

graphical_display_menu:
  id: main_menu
  display: front_display
  font: roboto
  active: false
  items:
    - type: menu
      text: 'Menu'
      items:
        - type: label
          text: 'Label'
        - type: back
          text: 'Back'
    - type: command
      text: 'Exit'
      on_value:
        then:
          - display_menu.hide:

uart:
  tx_pin: 1
  rx_pin: 3
  baud_rate: 9600

modbus:
  flow_control_pin: 4

ads1115:
  - address: 0x48
    id: ads1115_1
  - address: 0x49
    id: ads1115_2

#This is for the optional Relay expansion module
mcp23017:
  - id: mcp23008_relays
    address: 0x27

sensor:
  - platform: adc
    pin: 32
    id: button_adc_input
    update_interval: 50ms
    attenuation: auto
    filters:
     - delta: 1.0
    on_value_range:
      - above: 1.25
        below: 1.45
        then:
          - display_menu.up
      - above: 1.9
        below: 2.1
        then:
          - display_menu.down
      - above: 2.63
        below: 2.83
        then:
          - if:
              condition:
                display_menu.is_active: main_menu
              then:
                - display_menu.enter: main_menu
              else:
                - display_menu.show: main_menu

  - platform: ads1115
    multiplexer: A0_GND
    ads1115_id: ads1115_1
    gain: 2.048
    id: ai0
    filters:
      - multiply: 10.0 # V * 1000 (mV) /20(gain) /5(ohm) -> mA
  - platform: ads1115
    multiplexer: A1_GND
    ads1115_id: ads1115_1
    gain: 2.048
    id: ai1
    filters:
      - multiply: 10.0 # V * 1000 (mV) /20(gain) /5(ohm) -> mA
  - platform: ads1115
    multiplexer: A2_GND
    ads1115_id: ads1115_1
    gain: 2.048
    id: ai2
    filters:
      - multiply: 10.0 # V * 1000 (mV) /20(gain) /5(ohm) -> mA
  - platform: ads1115
    multiplexer: A3_GND
    ads1115_id: ads1115_1
    gain: 2.048
    id: ai3
    filters:
      - multiply: 10.0 # V * 1000 (mV) /20(gain) /5(ohm) -> mA
  - platform: ads1115
    multiplexer: A0_GND
    ads1115_id: ads1115_2
    gain: 2.048
    id: ai4
    filters:
      - multiply: 10.0 # V * 1000 (mV) /20(gain) /5(ohm) -> mA

binary_sensor:
 - platform: gpio
   pin: 18
   id: dio0
 - platform: gpio
   pin: 39
   id: dio1
 - platform: gpio
   pin: 34
   id: dio2
 - platform: gpio
   pin: 35
   id: dio3
 - platform: gpio
   pin: 19
   id: dio4
 - platform: gpio
   pin: 21
   id: dio5
 - platform: gpio
   pin: 22
   id: dio6
 - platform: gpio
   pin: 23
   id: dio7

output:
  - platform: gpio
    pin: 26
    id: t00
  - platform: gpio
    pin: 27
    id: t01
  - platform: gpio
    pin: 14
    id: led0
  - platform: gpio
    pin:
      number: 12
      ignore_strapping_warning: true
    id: led1
  - platform: gpio
    pin: 13
    id: led2
  - platform: gpio
    pin:
      number: 15
      ignore_strapping_warning: true
    id: led3
  - platform: gpio
    pin:
      number: 2
      ignore_strapping_warning: true
    id: led4
  - platform: gpio
    pin: 33
    id: led5
  - platform: gpio
    pin: 25
    id: expansion_port_pin_1

#Relay Expansion Module (8 relays)
  - platform: gpio
     name: "Relay R1"
     id: relay1
     pin:
       mcp23xxx: mcp23008_relays
       number: 7
       mode:
         output: True
   - platform: gpio
     name: "Relay R2"
     id: relay2
     pin:
       mcp23xxx: mcp23008_relays
       number: 6
       mode:
         output: True
   - platform: gpio
     name: "Relay R3"
     id: relay3
     pin:
       mcp23xxx: mcp23008_relays
       number: 5
       mode:
         output: True
   - platform: gpio
     id: relay4
     name: "Relay R4"
     pin:
       mcp23xxx: mcp23008_relays
       number: 4
       mode:
         output: True
   - platform: gpio
     id: relay5
     name: "Relay R5"
     pin:
       mcp23xxx: mcp23008_relays
       number: 8
       mode:
         output: True
   - platform: gpio
     id: relay6
     name: "Relay R6"
     pin:
       mcp23xxx: mcp23008_relays
       number: 9
       mode:
         output: True
   - platform: gpio
     name: "Relay R7"
     id: relay7
     pin:
       mcp23xxx: mcp23008_relays
       number: 10
       mode:
         output: True
   - platform: gpio
     name: "Relay R8"
     id: relay8
     pin:
       mcp23xxx: mcp23008_relays
       number: 11
       mode:
         output: True

```
