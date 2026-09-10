---
title: Tuya Wifi Mini Sensor PIR Motion Alarm
date-published: 2025-12-09
type: Sensor
standard: global
board: bk72xx
made-for-esphome: false
difficulty: 2
---

![Tuya Wifi Mini Sensor PIR Motion Alarm](tuya-pir-motion-alarm.jpg "Tuya Wifi Mini Sensor PIR Motion Alarm")

This is a PIR Motion device with an LED and a passive buzzer. It is simple and built with a CBU chip.

## Setup

It is not vulnerable to tuya-cloudcutter so you need to solder to the chip and serial flash it. This requires
disassembly, soldering, a USB-to-Serial-TTL, and a tool like [ltchiptool](https://github.com/libretiny-eu/ltchiptool)
or [BK7231 GUI Flash Tool](https://github.com/openshwprojects/BK7231GUIFlashTool).
The PIN-out is available [here](https://docs.libretiny.eu/boards/cbu/#usage).

## YAML configuration

```yaml
esphome:
  name: tuya-pir-alarm
  friendly_name: tuya-pir-alarm

bk72xx:
  board: cbu

logger:

web_server:

ota:
  password: "CHANGE-THIS-PASSWORD-OR-REMOVE-OTA"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

captive_portal:

api:
  encryption:
    key: "GET-A-KEY-HERE-https://esphome.io/components/api/#configuration-variables"
  services:
    - service: pir_notification
      then:
        - output.libretiny_pwm.set_frequency:
            id: buzzer
            frequency: 800
        - output.set_level:
            id: buzzer
            level: 50%
        - delay: 120ms
        - output.turn_off: buzzer
        - delay: 200ms
        - output.libretiny_pwm.set_frequency:
            id: buzzer
            frequency: 1000
        - output.set_level:
            id: buzzer
            level: 50%
        - delay: 120ms
        - output.turn_off: buzzer
    - service: pir_alarm
      then:
        - repeat:
            count: 8
            then:
              - output.libretiny_pwm.set_frequency:
                  id: buzzer
                  frequency: 5200
              - output.set_level:
                  id: buzzer
                  level: 90%
              - delay: 200ms

              - output.libretiny_pwm.set_frequency:
                  id: buzzer
                  frequency: 2200
              - output.set_level:
                  id: buzzer
                  level: 90%
              - delay: 200ms

        - output.turn_off: buzzer

binary_sensor:
  - platform: gpio
    pin: P22
    name: "PIR Motion Sensor P22"
    device_class: motion

  - platform: gpio
    id: pir_button
    pin:
      number: P16
      mode: INPUT_PULLUP
      inverted: true
    on_state:
      then:
        - if:
            condition:
              binary_sensor.is_on: pir_button
            then:
              - output.turn_off: buzzer
            else:
              - output.turn_on: buzzer
    name: "PIR Button P16"
    device_class: light

light:
  - platform: binary
    name: "Delete PIR Alarm Output P6"
    output: buzzer

  - platform: binary
    name: "PIR Button Enabler P14"
    output: output_p14

  - platform: binary
    name: "PIR Internal LED P20"
    output: internal_led

output:
  - platform: libretiny_pwm
    pin: P6
    frequency: 1000 Hz
    id: buzzer

  - id: internal_led
    platform: gpio
    pin:
      number: P20
      inverted: true

  - id: output_p14
    platform: gpio
    pin:
      number: P14
      inverted: true
```
