---
title: CloudFree SWM1 Motion Light Switch
date-published: 2026-03-18
type: switch
standard: us
board: esp8266
---

[CloudFree SWM1 Product Page](https://cloudfree.shop/product/cloudfree-smart-switch-runs-esphome/)

## Notes

The SWM1 is a single-pole in-wall switch with built-in PIR motion sensor and ambient light
detection. It ships with ESPHome pre-installed, making it flashable without disassembly.

**Motion mode features:**

- PIR triggers the relay when motion is detected (configurable on/off)
- Configurable on-duration (15–1800 s) and cooldown period (10–3600 s)
- Blue LED indicates motion events; nightlight mode keeps it lit in the dark
- Short button press toggles the relay; 2–5 s hold enables/disables motion mode
- Green LED output available for additional status indication

**Button press timing:**

| Hold Duration | Action                       |
| ------------- | ---------------------------- |
| < 1 s         | Toggle relay (respects motion mode) |
| 2–5 s         | Enable / disable motion mode |
| 6–9 s         | Software restart             |
| ≥ 10 s        | Restart into safe mode       |

## GPIO Pinout

| Pin    | Function                                        |
| ------ | ----------------------------------------------- |
| GPIO0  | Physical button (active LOW, INPUT_PULLUP)      |
| GPIO5  | PIR motion sensor (active LOW, inverted)        |
| GPIO12 | Relay output                                    |
| GPIO13 | Blue status LED (active LOW, inverted)          |
| GPIO14 | Ambient light sensor (daylight detection)       |
| GPIO16 | Green LED output                                |

## Basic Configuration

```yaml
substitutions:
  device_name: "cloudfree-swm1"

esphome:
  name: ${device_name}
  friendly_name: "CloudFree SWM1"
  comment: "CloudFree SWM1 Motion Light Switch"
  name_add_mac_suffix: true
  project:
    name: CloudFree.SWM1
    version: 1.0.0
  on_boot:
    priority: -100
    then:
      - lambda: "id(motion_light_time_countdown).publish_state(0);"
      - lambda: "id(motion_cooldown_countdown).publish_state(0);"

esp8266:
  board: esp01_1m
  restore_from_flash: true

preferences:
  flash_write_interval: 1min

logger:

api:

time:
  - platform: homeassistant
    id: homeassistant_time

ota:
  - platform: esphome

wifi:
  ap: {}

captive_portal:

# GPIO Mapping (CloudFree SWM1):
# GPIO0  - Physical button (active LOW, INPUT_PULLUP)
# GPIO5  - PIR motion sensor (active LOW, inverted)
# GPIO12 - Relay output
# GPIO13 - Blue status LED (active LOW, inverted)
# GPIO14 - Ambient light sensor (daylight detection)
# GPIO16 - Green LED output

globals:
  - id: motion_light_time_remaining
    type: int
    restore_value: false
    initial_value: "0"
  - id: motion_cooldown_remaining
    type: int
    restore_value: false
    initial_value: "0"

output:
  - platform: gpio
    id: green_led
    pin: GPIO16

light:
  - platform: status_led
    id: blue_status
    pin:
      number: GPIO13
      inverted: true
    effects:
      - strobe:
          name: Fast Flash
          colors:
            - state: true
              duration: 250ms
            - state: false
              duration: 250ms

switch:
  - platform: gpio
    id: relay
    name: "Switch"
    pin: GPIO12
    restore_mode: RESTORE_DEFAULT_OFF
  - platform: template
    id: motion_enabled
    name: "Motion Enabled"
    restore_mode: RESTORE_DEFAULT_ON
    optimistic: true
    entity_category: config
    device_class: switch
  - platform: template
    id: nightlight_enabled
    name: "Nightlight Enabled"
    restore_mode: RESTORE_DEFAULT_ON
    optimistic: true
    entity_category: config
    device_class: switch

binary_sensor:
  - platform: gpio
    id: relay_button
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: true
    on_multi_click:
      - timing: # short press — toggle relay, respecting motion mode
          - ON for at most 1s
          - OFF for at least 0.2s
        then:
          - if:
              condition:
                - switch.is_on: motion_enabled
              then:
                - if:
                    condition:
                      - switch.is_on: relay
                    then:
                      - script.stop: motion_timeout
                      - lambda: "id(motion_light_time_remaining) = 0;"
                      - lambda: "id(motion_light_time_countdown).publish_state(0);"
                      - switch.turn_off: relay
                      - script.execute: cooldown
                    else:
                      - switch.turn_on: relay
              else:
                - switch.toggle: relay
      - timing: # 2–5 s hold — enable / disable motion
          - ON for 2s to 5s
        then:
          - script.execute: motion_toggle
      - timing: # 6–9 s hold — software restart
          - ON for 6s to 9s
        then:
          - button.press: restart_button
      - timing: # 10 s+ hold — restart into safe mode
          - ON for at least 10s
        then:
          - button.press: restart_button_safe_mode

  - platform: gpio
    id: motion
    name: "Motion"
    pin:
      number: GPIO5
      inverted: true
    device_class: motion
    filters:
      - delayed_off: 5s
    on_press:
      - script.stop: motion_timeout
      - lambda: "id(motion_light_time_remaining) = 0;"
      - if:
          condition:
            or:
              - switch.is_off: nightlight_enabled
              - binary_sensor.is_on: daylight
          then:
            - light.turn_on: blue_status
      - if:
          condition:
            and:
              - switch.is_on: motion_enabled
              - not:
                  script.is_running: cooldown
          then:
            - switch.turn_on: relay
    on_release:
      - if:
          condition:
            or:
              - switch.is_off: nightlight_enabled
              - binary_sensor.is_on: daylight
          then:
            - light.turn_off: blue_status
      - if:
          condition:
            - switch.is_on: motion_enabled
          then:
            - script.execute: motion_timeout

  - platform: gpio
    id: daylight
    name: "Daylight"
    pin: GPIO14
    device_class: light
    filters:
      - delayed_on: 5s
      - delayed_off: 5s
    on_press:
      - if:
          condition:
            - switch.is_on: nightlight_enabled
          then:
            - light.turn_off: blue_status
    on_release:
      - if:
          condition:
            - switch.is_on: nightlight_enabled
          then:
            - light.turn_on: blue_status

number:
  - platform: template
    id: motion_light_time
    name: "Motion Light On Duration"
    icon: "mdi:clock"
    optimistic: true
    restore_value: true
    entity_category: config
    step: 5
    min_value: 15
    max_value: 1800
    initial_value: 60
    mode: box
    unit_of_measurement: s
  - platform: template
    id: motion_cooldown
    name: "Motion Cooldown"
    icon: "mdi:timer-off"
    optimistic: true
    restore_value: true
    entity_category: config
    step: 10
    min_value: 10
    max_value: 3600
    initial_value: 900
    mode: box
    unit_of_measurement: s

script:
  - id: motion_timeout
    mode: restart
    then:
      - lambda: "id(motion_light_time_remaining) = id(motion_light_time).state - 5;"
      - while:
          condition:
            and:
              - lambda: "return id(motion_light_time_remaining) > 0;"
              - switch.is_on: motion_enabled
          then:
            - delay: 1s
            - lambda: "id(motion_light_time_remaining)--;"
      - if:
          condition:
            - switch.is_on: motion_enabled
          then:
            - switch.turn_off: relay

  - id: motion_toggle
    mode: queued
    then:
      - script.stop: motion_timeout
      - script.stop: cooldown
      - lambda: "id(motion_light_time_remaining) = 0;"
      - lambda: "id(motion_cooldown_remaining) = 0;"
      - lambda: "id(motion_light_time_countdown).publish_state(0);"
      - lambda: "id(motion_cooldown_countdown).publish_state(0);"
      - switch.toggle: motion_enabled
      - if:
          condition:
            - switch.is_off: relay
          then:
            - switch.turn_on: relay
            - delay: 400ms
            - switch.turn_off: relay
            - delay: 400ms
            - switch.turn_on: relay
            - delay: 400ms
            - switch.turn_off: relay

  - id: cooldown
    mode: single
    then:
      - lambda: "id(motion_cooldown_remaining) = id(motion_cooldown).state;"
      - while:
          condition:
            lambda: "return id(motion_cooldown_remaining) > 0;"
          then:
            - delay: 1s
            - lambda: "id(motion_cooldown_remaining)--;"
      - switch.turn_on: motion_enabled

interval:
  - interval: 1s
    then:
      - lambda: |-
          if (id(motion_light_time_remaining) > 0 && id(motion_enabled).state) {
            id(motion_light_time_remaining)--;
            id(motion_light_time_countdown).publish_state(id(motion_light_time_remaining));
          }
          if (id(motion_cooldown_remaining) > 0 && id(motion_enabled).state) {
            id(motion_cooldown_remaining)--;
            id(motion_cooldown_countdown).publish_state(id(motion_cooldown_remaining));
          }

button:
  - platform: restart
    id: restart_button
    name: "Restart"
  - platform: safe_mode
    id: restart_button_safe_mode
    name: "Restart (Safe Mode)"
  - platform: factory_reset
    id: factory_reset_button
    name: "Factory Reset"
    disabled_by_default: true
    entity_category: config
    icon: mdi:restart-alert

sensor:
  - platform: template
    name: "Motion Light Time Countdown"
    id: motion_light_time_countdown
    unit_of_measurement: "s"
  - platform: template
    name: "Motion Cooldown Countdown"
    id: motion_cooldown_countdown
    unit_of_measurement: "s"
  - platform: wifi_signal
    name: "WiFi Signal"
    update_interval: 60s
  - platform: uptime
    name: "Uptime"

text_sensor:
  - platform: version
    name: "ESPHome Version"
  - platform: wifi_info
    ip_address:
      name: "IP Address"
    mac_address:
      name: "MAC Address"
    ssid:
      name: "SSID Connected"
```
