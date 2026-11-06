---
title: Sonoff T1/T2/T3 Touch Wall Switch (R1)
date-published: 2023-04-13
type: switch
standard: uk
board: esp8266
---

An example of how to integrate a T1 T2 or T3 Sonoff light switch (R1) into Home Assistant
using ESPHome.

![Product Image](./sonoff_1t_t3.png "Product Image")

## T1

``` yaml
esphome:
  name: "sonoff-t1"
  friendly_name: "Sonoff T1"
  name_add_mac_suffix: false

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode:
        input: true
        pullup: true
      inverted: true
    id: button_1
    on_press:
      then:
        - light.toggle: light_1

  - platform: status
    name: "T1 Status"

output:
  - platform: gpio
    pin: GPIO12
    id: relay_1

light:
  - platform: binary
    name: "T1"
    id: light_1
    output: relay_1

status_led:
  pin:
    number: GPIO13
    inverted: yes
```

## T2

``` yaml
esphome:
  name: "sonoff-t2"
  friendly_name: "Sonoff T2"
  name_add_mac_suffix: false

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode:
        input: true
        pullup: true
      inverted: true
    id: button_1
    on_press:
      then:
        - light.toggle: light_1

  - platform: gpio
    pin:
      number: GPIO9
      mode:
        input: true
        pullup: true
      inverted: true
    id: button_2
    on_press:
      then:
        - light.toggle: light_2

  - platform: status
    name: "T2 Status"

output:
  - platform: gpio
    pin: GPIO12
    id: relay_1

  - platform: gpio
    pin: GPIO5
    id: relay_2

light:
  - platform: binary
    name: "T2 L1"
    id: light_1
    output: relay_1

  - platform: binary
    name: "T2 L2"
    id: light_2
    output: relay_2

status_led:
  pin:
    number: GPIO13
    inverted: yes
```

## T3

``` yaml
esphome:
  name: "sonoff-t3"
  friendly_name: "Sonoff T3"
  name_add_mac_suffix: false

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode:
        input: true
        pullup: true
      inverted: true
    id: button_1
    on_press:
      then:
        - light.toggle: light_1

  - platform: gpio
    pin:
      number: GPIO9
      mode:
        input: true
        pullup: true
      inverted: true
    id: button_2
    on_press:
      then:
        - light.toggle: light_2

  - platform: gpio
    pin:
      number: GPIO10
      mode:
        input: true
        pullup: true
      inverted: true
    id: button_3
    on_press:
      then:
        - light.toggle: light_3

  - platform: status
    name: "T3 Status"

output:
  - platform: gpio
    pin: GPIO12
    id: relay_1

  - platform: gpio
    pin: GPIO5
    id: relay_2

  - platform: gpio
    pin: GPIO4
    id: relay_3

light:
  - platform: binary
    name: "T3 L1"
    id: light_1
    output: relay_1

  - platform: binary
    name: "T3 L2"
    id: light_2
    output: relay_2

  - platform: binary
    name: "T3 L3"
    id: light_3
    output: relay_3

status_led:
  pin:
    number: GPIO13
    inverted: yes
```
