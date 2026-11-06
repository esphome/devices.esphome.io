---
title: Martin Jerry US-SS02 Humidity Sensor Switch
date-published: 2023-12-19
type: switch
standard: us
board: esp8266
---

[Amazon Link](https://www.amazon.com/dp/B0C7L49BXL)

[Device on Martin Jerry](https://www.martinjerry.com/us-ss02)

## Flashing

These switches come preflashed with custom tasmota firmware, which leaves no space for an ESPHome binary OTA update.

If you would try to flash it with an ESPHome binary - update will fail.

This can be worked around by flashing the device with a
[Tasmota minimal binary](http://ota.tasmota.com/tasmota/tasmota-minimal.bin.gz) first, then re-flashing with your
ESPHome binary.

## GPIO Pinout

| Pin    | Function |
| ------ | -------- |
| GPIO3  | button   |
| GPIO5  | relay    |
| GPIO4  | i2c SCL  |
| GPIO12 | red LED  |
| GPIO13 | i2c SDA  |
| GPIO14 | blue LED |

## Basic Configuration

```yaml
substitutions:
  name: martin-jerry-ss02
  friendly_name: Martin Jerry SS02
  on_humidity_threshold: "85"
  off_humidity_threshold: "75"

esphome:
  name: "${name}"
  friendly_name: "${friendly_name}"

esp8266:
  board: esp8285

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key:

ota:
  password:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: ${friendly_name}_AP
    password: !secret wifi_password

captive_portal:

i2c:
  sda: GPIO13
  scl: GPIO04

number:
  - platform: template
    name: "${friendly_name} On Humidity Threshold"
    id: on_humidity_threshold_ui
    unit_of_measurement: "%"
    min_value: 0
    max_value: 100
    step: 5
    mode: box
    update_interval: never
    optimistic: true
    restore_value: true
    initial_value: ${on_humidity_threshold}
    icon: "mdi:water-percent"
    entity_category: config
    on_value:
      - lambda: "id(aht10_sensor).update();"
  - platform: template
    name: "${friendly_name} Off Humidity Threshold"
    id: off_humidity_threshold_ui
    unit_of_measurement: "%"
    min_value: 0
    max_value: 100
    step: 5
    mode: box
    update_interval: never
    optimistic: true
    restore_value: true
    initial_value: ${off_humidity_threshold}
    icon: "mdi:water-percent"
    entity_category: config
    on_value:
      - lambda: "id(aht10_sensor).update();"

sensor:
  - platform: aht10
    id: aht10_sensor
    update_interval: 30s
    humidity:
      name: "${friendly_name} Humidity"
      on_value:
        then:
          - lambda: |-
              if (x >= id(on_humidity_threshold_ui).state) {
                id(relay).turn_on();
              } else if (x >= id(off_humidity_threshold_ui).state) {
                id(relay).turn_off();
              }

switch:
  - platform: gpio
    id: relay
    name: "${friendly_name}"
    icon: mdi:fan
    pin: GPIO05
    on_turn_on:
      - switch.turn_on: blue_led
      - switch.turn_off: red_led
    on_turn_off:
      - switch.turn_on: blue_led
      - switch.turn_on: red_led
  - platform: gpio
    pin: GPIO12
    id: red_led
    internal: true
    inverted: true
  - platform: gpio
    pin: GPIO14
    id: blue_led
    internal: true
    inverted: true

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO03
      mode: INPUT_PULLUP
      inverted: true
    id: main_button
    internal: true
    on_press:
      - switch.toggle: relay

button:
  - platform: restart
    id: restart_button
    name: "${friendly_name} Restart"
    entity_category: diagnostic
```
