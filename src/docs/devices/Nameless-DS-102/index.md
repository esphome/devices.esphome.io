---
title: Nameless DS-102 2/3-Gang Wall-Switch
date-published: 2020-04-06
type: switch
standard: eu
board: esp8266
---

## Warning

As of May 2022 these switches use a WB3S chip (BK7231T) and are no longer compatible with esphome!

## Notes

- push button wall switch
- bought here: [https://www.aliexpress.com/item/32996643708.html?spm=a2g0s.9042311.0.0.19a74c4dRi4rTg](https://www.aliexpress.com/item/32996643708.html?spm=a2g0s.9042311.0.0.19a74c4dRi4rTg)
- this dude shows how to flash it: [https://community.home-assistant.io/t/wifi-wall-switch-without-touch-1-2-or-3-gang/43075/38](https://community.home-assistant.io/t/wifi-wall-switch-without-touch-1-2-or-3-gang/43075/38)

## GPIO Pinout

### 2-Gang Version

| Pin    | Function                        |
| ------ | ------------------------------- |
| GPIO0  | Status LED                      |
| GPIO3  | Button 1 (HIGH = off, LOW = on) |
| GPIO5  | Button 2 (HIGH = off, LOW = on) |
| GPIO13 | Relay 1                         |
| GPIO4  | Relay 2                         |
| GPIO14 | Blue LED in Button 1 (dimmable) |
| GPIO1  | Blue LED in Button 2 (dimmable) |

### 3-Gang Version

| Pin    | Function                        |
| ------ | ------------------------------- |
| GPIO0  | Status LED                      |
| GPIO12 | Button 1 (HIGH = off, LOW = on) |
| GPIO3  | Button 2 (HIGH = off, LOW = on) |
| GPIO5  | Button 3 (HIGH = off, LOW = on) |
| GPIO13 | Relay 1                         |
| GPIO4  | Relay 2                         |
| GPIO15 | Relay 3                         |
| GPIO16 | Blue LED in Button 1 (dimmable) |
| GPIO14 | Blue LED in Button 2 (dimmable) |
| GPIO1  | Blue LED in Button 3 (dimmable) |

## Basic Configuration (2-Gang)

```yaml
esphome:
  name: ds_102

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: true

api:
  encryption:
    key: !secret encryption_key

ota:
  password: !secret ota_secret

logger:
  esp8266_store_log_strings_in_flash: false

sensor:
  - platform: uptime
    name: DS 102 Uptime
    update_interval: 60s

status_led:
  pin:
    number: GPIO0
    inverted: True

text_sensor:
  - platform: version
    name: DS 102 Version

binary_sensor:
  - platform: status
    name: DS 102 Status
  - platform: gpio
    pin:
      number: GPIO3
      mode: INPUT_PULLUP
      inverted: True
    name: DS 102 Button 1
    on_press:
      - switch.toggle: relay_1
  - platform: gpio
    pin:
      number: GPIO5
      mode: INPUT_PULLUP
      inverted: True
    name: "DS 102 Button 2"
    on_press:
      - switch.toggle: relay_2

switch:
  - platform: restart
    name: DS 102 Restart
  - platform: gpio
    name: "DS 102 Switch 1"
    pin: GPIO13
    id: relay_1
    on_turn_on:
      - light.turn_on: led_light1
    on_turn_off:
      - light.turn_off: led_light1
  - platform: gpio
    name: "DS 102 Switch 2"
    pin: GPIO4
    id: relay_2
    on_turn_on:
      - light.turn_on: led_light2
    on_turn_off:
      - light.turn_off: led_light2

output:
  - platform: esp8266_pwm
    id: led1
    pin: GPIO14
    inverted: True
  - platform: esp8266_pwm
    id: led2
    pin: GPIO1
    inverted: True

light:
  - platform: monochromatic
    name: "DS 102 LED 1"
    output: led1
    internal: true
    id: led_light1
  - platform: monochromatic
    name: "DS 102 LED 2"
    output: led2
    internal: true
    id: led_light2
```

## Basic Configuration (3-Gang)

```yaml
esphome:
  name: ds_102

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: true

api:
  encryption:
    key: !secret encryption_key

ota:
  password: !secret ota_secret

logger:
  esp8266_store_log_strings_in_flash: false

sensor:
  - platform: uptime
    name: ${upper_name} Uptime
    update_interval: 60s

status_led:
  pin:
    number: GPIO0
    inverted: True

text_sensor:
  - platform: version
    name: ${upper_name} Version

binary_sensor:
  - platform: status
    name: ${upper_name} Status
  - platform: gpio
    pin:
      number: GPIO12
      mode: INPUT_PULLUP
      inverted: True
    name: ${upper_name} Button 1
    on_press:
      - switch.toggle: relay_1
  - platform: gpio
    pin:
      number: GPIO3
      mode: INPUT_PULLUP
      inverted: True
    name: "${upper_name} Button 2"
    on_press:
      - switch.toggle: relay_2
  - platform: gpio
    pin:
      number: GPIO5
      mode: INPUT_PULLUP
      inverted: True
    name: "${upper_name} Button 3"
    on_press:
      - switch.toggle: relay_3

switch:
  - platform: restart
    name: ${upper_name} Restart
  - platform: gpio
    name: "${upper_name} Switch 1"
    pin: GPIO13
    id: relay_1
    on_turn_on:
      - light.turn_on: led_light1
    on_turn_off:
      - light.turn_off: led_light1
  - platform: gpio
    name: "${upper_name} Switch 2"
    pin: GPIO4
    id: relay_2
    on_turn_on:
      - light.turn_on: led_light2
    on_turn_off:
      - light.turn_off: led_light2
  - platform: gpio
    name: "${upper_name} Switch 3"
    pin: GPIO15
    id: relay_3
    on_turn_on:
      - light.turn_on: led_light3
    on_turn_off:
      - light.turn_off: led_light3

output:
  - platform: esp8266_pwm
    id: led1
    pin: GPIO16
    inverted: True
  - platform: esp8266_pwm
    id: led2
    pin: GPIO14
    inverted: True
  - platform: esp8266_pwm
    id: led3
    pin: GPIO1
    inverted: True

light:
  - platform: monochromatic
    name: "${upper_name} LED 1"
    output: led1
    internal: true
    id: led_light1
  - platform: monochromatic
    name: "${upper_name} LED 2"
    output: led2
    internal: true
    id: led_light2
  - platform: monochromatic
    name: "${upper_name} LED 3"
    output: led3
    internal: true
    id: led_light3
```
