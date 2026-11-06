---
title: Milfra MFA05
date-published: 2023-12-30
type: switch
standard: us
board: esp8266
---

## Initial Install

When taking the device apart, there are no headers for RX/TX. You must solder them on. They are labeled on the board.

There are headers for ground and 5v. You can use these to power the device while flashing. Press and hold the button
while powering on the device to put it into flash mode.

This device is also sold and marketed as the CloudFree SWM1.

## GPIO Pinout

| Pin    | Function     |
| ------ | ------------ |
| GPIO0  | button       |
| GPIO5  | motion       |
| GPIO12 | relay        |
| GPIO13 | blue led     |
| GPIO14 | light sensor |
| GPIO16 | green led    |

## Example Configuration

Courtesy of rootnegativ1 on the Home Assistant forums:
[https://community.home-assistant.io/t/milfra-motion-sensor-light-switch-mfa05/439857/8](https://community.home-assistant.io/t/milfra-motion-sensor-light-switch-mfa05/439857/8)

```yaml
# https://templates.blakadder.com/cloudfree_SWM1.html
# https://templates.blakadder.com/milfra_MFA05.html

# GPIO16 boots HIGH which means the green led is ON.
# This is an issue because of the green led takes precendence over the blue led
# To deal with this, GPIO16 must be set LOW after boot which is done using the output component.
# This component defaults to OFF so the user DOES NOT need to use
#    (I) output.turn_off
#     or (II) digitalWrite(16, LOW) after boot

substitutions:
  node_name: milfra-motion-light-switch
  friendly_name: Milfra MFA05 Motion Light Switch

esphome:
  name: ${node_name}
  build_path: ./build/${node_name}
  comment: Milfra MFA05 Motion Light Switch
  name_add_mac_suffix: true

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: ${node_name}_AP
    password: !secret wifi_password
    ap_timeout: 3min

api:
  encryption:
    key: !secret esphome_encryption_key
  reboot_timeout: 0s

captive_portal:

improv_serial:

logger:

ota:

button:
  - platform: restart
    id: restart_button
    name: "${friendly_name} Restart"

  - platform: safe_mode
    id: restart_button_safe_mode
    name: "${friendly_name} Restart (Safe Mode)"

text_sensor:
  - platform: version
    name: "${friendly_name} ESPHome Version"

  - platform: wifi_info
    ip_address:
      name: "${friendly_name} IP Address"
    mac_address:
      name: "${friendly_name} MAC Address"

number:
  - platform: template # time the relay is ON when triggered by motion
    id: motion_delay
    name: ${friendly_name} Motion Delay
    optimistic: true
    restore_value: true
    entity_category: config
    step: 5
    min_value: 15
    max_value: 300
    initial_value: 30
    mode: box
    unit_of_measurement: s

  - platform: template # time the relay is ON when triggered by button
    id: button_delay
    name: ${friendly_name} Button Delay
    optimistic: true
    restore_value: true
    entity_category: config
    step: 5
    min_value: 60
    max_value: 600
    initial_value: 180
    mode: box
    unit_of_measurement: s

  - platform: template # cooldown time when physical button is pressed
    id: motion_cooldown
    name: ${friendly_name} Motion Cooldown
    optimistic: true
    restore_value: true
    entity_category: config
    step: 5
    min_value: 10
    max_value: 300
    initial_value: 60
    mode: box
    unit_of_measurement: s

output:
  - platform: gpio # green LED
    id: green_led
    pin: GPIO16

light:
  - platform: status_led # blue LED
    id: blue_status
    name: ${friendly_name} Blue LED
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

binary_sensor:
  - platform: gpio # physical button
    id: relay_button
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    on_multi_click:
      - timing: # toggle relay & motion / button timeouts
          - ON for at most 1s
          - OFF for at least 0.2s
        then:
          - switch.toggle: relay
          - if:
              condition:
                - switch.is_on: motion_enabled
              then:
                - script.execute: cooldown
              else:
                if:
                  condition:
                    not:
                      - script.is_running: cooldown
                  then:
                    - script.execute: button_timeout
          - delay: 100ms
          - wait_until:
              condition:
                - not:
                    script.is_running: cooldown
                - not:
                    script.is_running: button_timeout
          - if:
              condition:
                - binary_sensor.is_off: motion
              then:
                - switch.turn_off: relay
      - timing: # enable / disable motion
          - ON for 2s to 5s
        then:
          - script.execute: motion_toggle
      - timing: # software restart
          - ON for 6s to 9s
        then:
          - button.press: restart_button
      - timing: # software restart into safe mode
          - ON for at least 10s
        then:
          - button.press: restart_button_safe_mode

  - platform: gpio # motion sensor
    id: motion
    name: ${friendly_name} Motion
    pin:
      number: GPIO5
      inverted: true
    device_class: motion
    filters:
      - delayed_off: 5s
    on_press:
      - script.stop: motion_timeout
      - if:
          condition:
            - switch.is_on: motion_enabled
          then:
            - switch.turn_on: relay
    on_release:
      - script.execute: motion_timeout

  - platform: gpio # light sensor
    id: daylight
    name: ${friendly_name} Daylight
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

switch:
  - platform: gpio # relay
    id: relay
    name: ${friendly_name}
    pin: GPIO12

  - platform: template # enable / disable motion - Default to ON
    id: motion_enabled
    name: ${friendly_name} Motion Enabled
    optimistic: true
    entity_category: config
    device_class: switch
    restore_mode: RESTORE_DEFAULT_ON

  - platform: template # enable / disable nightlight - Default to OFF
    id: nightlight_enabled
    name: ${friendly_name} Nightlight Enabled
    optimistic: true
    entity_category: config
    device_class: switch
    restore_mode: RESTORE_DEFAULT_OFF

script:
  # not in motion sensor on_release because of an issue with on_press not cancelling the delay
  - id: motion_timeout
    mode: restart
    then:
      # subtract 5 for the delayed_off of the motion sensor
      - delay: !lambda "return (id(motion_delay).state - 5) * 1000;"
      - if:
          condition:
            - switch.is_on: motion_enabled
          then:
            - switch.turn_off: relay

  - id: motion_toggle
    mode: queued
    then:
      - switch.toggle: motion_enabled
      - if:
          condition:
            - switch.is_off: relay
          then:
            - light.turn_on:
                id: blue_status
                effect: Fast Flash
            - delay: 1600ms
            - light.turn_off: blue_status

  # if mode: restart, this causes motion to not be re-enabled
  - id: cooldown
    mode: single
    then:
      - switch.turn_off: motion_enabled
      - delay: !lambda "return id(motion_cooldown).state * 1000;"
      - switch.turn_on: motion_enabled

  - id: button_timeout
    mode: restart
    then:
      - delay: !lambda "return id(button_delay).state * 1000;"
```
