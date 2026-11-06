---
title: Sonoff 4CH Pro R2
date-published: 2019-10-11
type: relay
standard: global
board: esp8266
difficulty: 3
---

## GPIO Pinout

| Pin    | Function                             |
| ------ | ------------------------------------ |
| GPIO0  | Push Button 1 (HIGH = off, LOW = on) |
| GPIO9  | Push Button 2 (HIGH = off, LOW = on) |
| GPIO10 | Push Button 3 (HIGH = off, LOW = on) |
| GPIO14 | Push Button 4 (HIGH = off, LOW = on) |
| GPIO12 | Relay 1 and its status LED           |
| GPIO5  | Relay 2 and its status LED           |
| GPIO4  | Relay 3 and its status LED           |
| GPIO15 | Relay 4 and its status LED           |
| GPIO13 | Blue LED (HIGH = off, LOW = on)      |

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: sonoff_4chpror2

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:
api:
ota:
  - platform: esphome

# Device Specific Config
binary_sensor:
  - platform: gpio
    name: "Sonoff 4CH Pro Button 1"
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    on_press:
      - switch.toggle: "relay_1"
  - platform: gpio
    name: "Sonoff 4CH Pro Button 2"
    pin:
      number: GPIO9
      mode: INPUT_PULLUP
      inverted: True
    on_press:
      - switch.toggle: "relay_2"
  - platform: gpio
    name: "Sonoff 4CH Pro Button 3"
    pin:
      number: GPIO10
      mode: INPUT_PULLUP
      inverted: True
    on_press:
      - switch.toggle: "relay_3"
  - platform: gpio
    name: "Sonoff 4CH Pro Button 4"
    pin:
      number: GPIO14
      mode: INPUT_PULLUP
      inverted: True
    on_press:
      - switch.toggle: "relay_4"

  - platform: status
    name: "Sonoff 4CH Pro Status"

switch:
  - platform: gpio
    name: "Relay 1"
    pin: GPIO12
    id: "relay_1"
  - platform: gpio
    name: "Relay 2"
    pin: GPIO5
    id: "relay_2"
  - platform: gpio
    name: "Relay 3"
    pin: GPIO4
    id: "relay_3"
  - platform: gpio
    name: "Relay 4"
    pin: GPIO15
    id: "relay_4"
```

## LED Configuration

Use _one_ of the following three configurations to adjust the led to your needs. Note: Using the Status LED on the 4CH
Pro may cause relay 4 to activate on power up.

### Status LED (see [https://esphome.io/components/status_led/](https://esphome.io/components/status_led/))

```yaml
status_led:
  pin:
    number: GPIO13
    inverted: True
```

### Always-on led (plugged in == led on)

```yaml
output:
  - platform: esp8266_pwm
    id: blue_led
    pin: GPIO13
    inverted: True

light:
  - platform: monochromatic
    name: "Blue LED"
    output: blue_led
    restore_mode: ALWAYS_ON
    internal: true
```

### Normal light, toggleable via Home Assistant

```yaml
output:
  - platform: esp8266_pwm
    id: blue_led
    pin: GPIO13
    inverted: True

light:
  - platform: monochromatic
    name: "Blue LED"
    output: blue_led
```
