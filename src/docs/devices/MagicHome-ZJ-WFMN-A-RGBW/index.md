---
title: MagicHome RGBW ZJ-WFMN-A V1.1 LED Controller
date-published: 2020-10-28
type: light
standard: global
board: esp8266
---

## General Notes

MagicHome RGBW LED controller with Infrared (IR) receiver and remote.

The IR codes are incomplete to map all remote functions to a button. Only ON/OFF, Red, Green, Blue, White, Flash and
Strobe effects are implemented in this configuration

:information_source: Please note that MagicHome began to produce devices with BL602 chip instead of ESP. ESPHome is not
compatible with BL602. Before buying make sure a controller is using the right chip.

![alt text](./MagicHome-ZJ-WFMN-A-RGBW.png "MagicHome RGBW LED strip controller")

## GPIO Pinout

| Pin    | Function      |
| ------ | ------------- |
| GPIO4  | IR Receiver   |
| GPIO5  | Green Channel |
| GPIO12 | Red Channel   |
| GPIO13 | Blue Channel  |
| GPIO15 | White Channel |

## Basic Configuration

This extracts the device configuration into a separate file. That file is then included for each LED strip (see bottom
of this page)

In `magichome_ledstrip_common.yaml`:

```yaml
esphome:
  name: ${device_name}
  comment: ${device_description}

esp8266:
  board: esp01_1m
  restore_from_flash: true

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

# Enable OTA updates
ota:
  - platform: esphome
    password: !secret esphomeotapwd

remote_receiver:
  pin: GPIO4
  # Uncomment if you want to debug IR codes
  # dump: raw

output:
  - platform: esp8266_pwm
    id: red_channel
    pin: GPIO12
  - platform: esp8266_pwm
    id: green_channel
    pin: GPIO5
  - platform: esp8266_pwm
    id: blue_channel
    pin: GPIO13
  - platform: esp8266_pwm
    id: white_channel
    pin: GPIO15

binary_sensor:
  - platform: remote_receiver
    name: "Remote ON"
    raw:
      # prettier-ignore
      code: [ -9052, 4434, -636, 523, -636, 492, -603, 526, -608, 522, -606, 523, -608, 520, -606, 522, -600, 529, -610, 1594, -633, 1602, -638, 1595, -631, 1601, -628, 1606, -635, 1600, -636, 1595, -637, 1597, -634, 1600, -637, 521, -604, 1600, -637, 1596, -638, 520, -609, 521, -606, 523, -634, 494, -610, 518, -608, 1597, -638, 520, -607, 521, -607, 1597, -635, 1598, -636, 1599, -665, 1568, -644 ]
    on_press:
      then:
        - light.turn_on: ${device_name}

  - platform: remote_receiver
    name: "Remote OFF"
    raw:
      # prettier-ignore
      code: [ -9008, 4482, -600, 531, -565, 564, -591, 536, -568, 564, -593, 537, -597, 529, -597, 531, -596, 534, -596, 1639, -597, 1635, -597, 1638, -598, 1638, -591, 1644, -568, 1665, -592, 1642, -566, 1670, -592, 1640, -595, 1639, -592, 1643, -567, 1665, -596, 1640, -597, 532, -595, 533, -594, 536, -596, 534, -597, 530, -567, 563, -568, 561, -599, 529, -568, 1667, -593, 1642, -591, 1642, -597 ]
    on_press:
      then:
        - light.turn_off: ${device_name}

  - platform: remote_receiver
    name: "Remote BRIGHTUP"
    raw:
      # prettier-ignore
      code: [ -8998, 4475, -592, 533, -594, 535, -593, 535, -591, 536, -591, 536, -591, 537, -591, 535, -591, 536, -593, 1639, -592, 1638, -591, 1639, -589, 1640, -592, 1637, -593, 1638, -593, 1638, -591, 1637, -593, 1638, -593, 534, -592, 535, -594, 1636, -594, 535, -590, 537, -592, 535, -592, 536, -592, 534, -593, 1635, -594, 1639, -591, 536, -591, 1639, -591, 1639, -591, 1640, -591, 1639, -592 ]
    on_press:
      then:
        - light.dim_relative:
            id: ${device_name}
            relative_brightness: 10%

  - platform: remote_receiver
    name: "Remote BRIGHTDOWN"
    raw:
      # prettier-ignore
      code: [ -9000, 4476, -589, 537, -593, 533, -593, 536, -590, 536, -593, 536, -592, 535, -592, 535, -592, 535, -593, 1638, -593, 1638, -592, 1637, -591, 1640, -591, 1638, -592, 1639, -592, 1638, -592, 1639, -592, 1637, -591, 538, -592, 1637, -592, 1639, -592, 1637, -593, 536, -591, 536, -591, 536, -593, 534, -592, 1639, -591, 537, -592, 536, -590, 535, -593, 1637, -593, 1638, -594, 1636, -593 ]
    on_press:
      then:
        - light.dim_relative:
            id: ${device_name}
            relative_brightness: -10%

  - platform: remote_receiver
    name: "Remote RED"
    raw:
      # prettier-ignore
      code: [ -9011, 4465, -600, 558, -574, 528, -597, 556, -573, 555, -573, 524, -603, 556, -571, 530, -596, 558, -568, 1635, -597, 1633, -601, 1630, -603, 1628, -607, 1625, -596, 1633, -607, 1625, -605, 1626, -602, 1629, -600, 529, -602, 555, -592, 1607, -598, 1635, -634, 523, -572, 556, -574, 553, -573, 527, -596, 1635, -598, 1631, -596, 535, -599, 556, -567, 1633, -603, 1629, -604, 1627, -597 ]
    on_press:
      then:
        - light.turn_on:
            id: ${device_name}
            red: 100%
            green: 0%
            blue: 0%
            white: 0%
            effect: None

  - platform: remote_receiver
    name: "Remote GREEN"
    raw:
      # prettier-ignore
      code: [ -9042, 4433, -669, 488, -611, 517, -611, 517, -636, 492, -608, 519, -609, 518, -638, 490, -611, 517, -634, 1567, -636, 1596, -663, 1569, -633, 1597, -668, 1565, -637, 1591, -636, 1597, -637, 1592, -638, 1595, -641, 1588, -666, 492, -641, 1562, -665, 1565, -640, 518, -605, 522, -604, 523, -610, 518, -606, 522, -613, 1589, -633, 524, -610, 518, -604, 1598, -627, 1603, -641, 1591, -640 ]
    on_press:
      then:
        - light.turn_on:
            id: ${device_name}
            red: 0%
            green: 100%
            blue: 0%
            white: 0%
            effect: None

  - platform: remote_receiver
    name: "Remote BLUE"
    raw:
      # prettier-ignore
      code: [ -9041, 4434, -637, 521, -632, 494, -608, 521, -609, 519, -635, 493, -604, 524, -604, 523, -607, 521, -607, 1595, -664, 1567, -667, 1565, -664, 1568, -634, 1596, -635, 1598, -635, 1594, -669, 1566, -663, 1566, -634, 522, -637, 490, -607, 522, -636, 1565, -639, 519, -640, 487, -641, 487, -636, 491, -636, 1568, -666, 1564, -664, 1566, -666, 492, -640, 1562, -668, 1564, -671, 1559, -667 ]
    on_press:
      then:
        - light.turn_on:
            id: ${device_name}
            red: 0%
            green: 0%
            blue: 100%
            white: 0%
            effect: None

  - platform: remote_receiver
    name: "Remote WHITE"
    raw:
      # prettier-ignore
      code: [ -9057, 4433, -634, 524, -607, 523, -607, 521, -604, 525, -609, 520, -610, 518, -638, 491, -609, 521, -607, 1595, -637, 1595, -637, 1596, -640, 1594, -628, 1604, -638, 1596, -635, 1598, -637, 1593, -640, 1595, -635, 522, -606, 1600, -632, 524, -603, 1601, -637, 520, -609, 521, -607, 521, -604, 526, -610, 1593, -631, 527, -601, 1603, -661, 499, -607, 1593, -638, 1595, -666, 1567, -636 ]
    on_press:
      then:
        - light.turn_on:
            id: ${device_name}
            red: 0%
            green: 0%
            blue: 0%
            white: 100%
            effect: None

  - platform: remote_receiver
    name: "Remote FLASH"
    raw:
      # prettier-ignore
      code: [ -9011, 4485, -592, 537, -594, 536, -592, 536, -594, 537, -593, 537, -593, 536, -593, 537, -593, 536, -593, 1641, -594, 1642, -593, 1642, -592, 1644, -592, 1642, -592, 1644, -591, 1642, -594, 1640, -596, 1639, -594, 536, -594, 1641, -593, 1642, -593, 536, -593, 537, -594, 1641, -592, 537, -594, 536, -593, 1641, -594, 536, -594, 534, -597, 1639, -594, 1641, -592, 537, -593, 1643, -592 ]
    on_press:
      then:
        - light.turn_on:
            id: ${device_name}
            effect: "In Alarm"

  - platform: remote_receiver
    name: "Remote STROBE"
    raw:
      # prettier-ignore
      code: [ -8971, 4511, -559, 565, -562, 568, -561, 565, -562, 566, -563, 564, -563, 567, -563, 564, -562, 565, -563, 1670, -563, 1668, -562, 1671, -560, 1671, -563, 1670, -560, 1669, -565, 1667, -563, 1673, -558, 567, -561, 564, -562, 566, -565, 563, -561, 569, -562, 567, -585, 540, -563, 571, -558, 1669, -561, 1671, -560, 1669, -563, 1670, -561, 1670, -564, 1668, -561, 1671, -560, 1672, -562 ]
    on_press:
      then:
        - light.turn_on:
            id: ${device_name}
            effect: "Default Strobe"

  - platform: remote_receiver
    name: "Remote FADE"
    raw:
      # prettier-ignore
      code: [ -8981, 4433, -607, 516, -580, 542, -580, 541, -607, 515, -604, 518, -603, 518, -603, 518, -605, 516, -605, 1631, -607, 1628, -580, 1655, -603, 1631, -581, 1654, -581, 1653, -606, 1629, -581, 1655, -601, 519, -605, 1630, -604, 518, -605, 1629, -606, 1630, -606, 516, -580, 541, -604, 517, -584, 1652, -602, 519, -582, 1653, -605, 518, -604, 517, -581, 1654, -580, 1654, -606, 1630, -579 ]
    on_press:
      then:
        - light.turn_on:
            id: ${device_name}
            effect: "Fast Pulse"

  - platform: remote_receiver
    name: "Remote SMOOTH"
    raw:
      # prettier-ignore
      code: [ -8985, 4429, -608, 516, -603, 517, -640, 482, -608, 514, -605, 516, -607, 515, -607, 515, -606, 515, -609, 1627, -605, 1629, -606, 1627, -607, 1628, -635, 1601, -607, 1627, -607, 1627, -608, 1628, -606, 515, -608, 513, -607, 1627, -606, 1629, -607, 515, -606, 515, -607, 515, -605, 516, -606, 1629, -635, 1598, -605, 518, -607, 514, -606, 1627, -609, 1626, -607, 1629, -604, 1629, -609 ]
    on_press:
      then:
        - light.turn_on:
            id: ${device_name}
            effect: "Slow Pulse"

light:
  - platform: rgbw
    name: ${friendly_name}
    id: ${device_name}
    red: red_channel
    green: green_channel
    blue: blue_channel
    white: white_channel
    effects: # Add few effects : Slow and fast random colors and an "in alarm" mode.
      - random:
          name: "Slow Random Colors"
          transition_length: 30s
          update_interval: 30s
      - random:
          name: "Fast Random Colors"
          transition_length: 4s
          update_interval: 5s
      - pulse:
          name: "Fast Pulse"
          transition_length: 0.5s
          update_interval: 0.5s
          min_brightness: 0%
          max_brightness: 100%
      - pulse:
          name: "Slow Pulse"
          transition_length: 500ms
          update_interval: 2s
      - strobe:
          name: Default Strobe
      - strobe:
          name: In Alarm
          colors:
            - state: True
              brightness: 100%
              white: 0%
              red: 100%
              blue: 0%
              green: 0%
              duration: 150ms
            - state: False
              duration: 100ms
            - state: True
              brightness: 100%
              white: 0%
              red: 100%
              blue: 0%
              green: 0%
              duration: 150ms
            - state: False
              duration: 100ms
            - state: True
              brightness: 100%
              white: 0%
              red: 0%
              blue: 100%
              green: 0%
              duration: 150ms
            - state: False
              duration: 100ms
            - state: True
              brightness: 100%
              white: 0%
              red: 0%
              blue: 100%
              green: 0%
              duration: 150ms
            - state: False
              duration: 100ms
```

Then in each led strip's yaml:

```yaml
<<: !include magichome_ledstrip_common.yaml

substitutions:
  device_name: led_strip
  device_description: RGBW LED Strip with IR remote behind television.
  friendly_name: LED strip behind television
```
