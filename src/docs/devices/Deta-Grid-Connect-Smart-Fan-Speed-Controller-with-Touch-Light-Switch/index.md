---
title: Deta Grid Connect Smart Fan Speed Controller with Touch Light Switch
date-published: 2021-02-02
type: switch
standard: au
board: bk72xx
---

## General Information

[Deta 6914HA][1] is a smart fan controller with light switch sold in Australia and New Zealand.

[1]: https://detaelectrical.com.au/product/deta-grid-connect-smart-touch-fan-speed-controller-with-light-switch/

### Series 1

Original version uses ESP8266 controller.

### Series 2

Newer revision uses BK7231T controller on the Tuya WB3S module.

### Series 3

revision uses BK7231N controller on the Tuya [CB3S module](https://developer.tuya.com/docs/iot/cb3s?id=Kai94mec0s076)

## GPIO Pinout

### ESP8266 Version

| GPIO # | Component |
|:------:|----------:|
| GPIO00 |   Button2 |
| GPIO01 |      None |
| GPIO02 |      None |
| GPIO03 |   LedLink |
| GPIO04 |    Relay3 |
| GPIO05 |   Button3 |
| GPIO09 |      None |
| GPIO10 |      None |
| GPIO12 |      None |
| GPIO13 |    Relay2 |
| GPIO14 |    Relay1 |
| GPIO15 |    Relay4 |
| GPIO16 |   Button1 |
|  FLAG  |      None |

### BK72xx Version

|  Pin # |     Component |
|:------:|--------------:|
|    P14 |       Button1 |
|     P1 |       Button2 |
|     P8 |       Button3 |
|    P10 |           Led |
|    P26 |   Light Relay |
|     P6 |   Fan Relay 1 |
|     P7 |   Fan Relay 2 |
|     P9 |   Fan Relay 3 |

### BK7231N Version

|  Pin # |     Component |
|:------:|--------------:|
|    P14 |       Button1 |
|    P20 |       Button2 |
|     P7 |       Button3 |
|    P10 |           Led |
|    P26 |   Light Relay |
|     P6 |   Fan Relay 1 |
|     P8 |   Fan Relay 2 |
|     P9 |   Fan Relay 3 |

## Getting it up and running

### Series 1 - Tuya Convert

These switches are Tuya devices, so if you don't want to open them up to flash directly, you can attempt to
[use tuya-convert to initially get ESPHome onto them](/devices/tuya-convert) however recently purchased devices are no
longer Tuya-Convert compatible.  There's a useful guide to disassemble and serial flash similar switches
[on Mike McGuire's blog][2]. After that, you can use ESPHome's OTA functionality to make any further changes.

[2]: https://blog.mikejmcguire.com/2020/05/22/deta-grid-connect-3-and-4-gang-light-switches-and-home-assistant/

- Put the switch into "smartconfig" / "autoconfig" / pairing mode by holding any button for about 5 seconds.
- The status LED (to the side of the button(s)) blinks rapidly to confirm that it has entered pairing mode.

### Series 2 - Cloudcutter

[Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) is a tool designed to simplify the flashing process.
Follow the [official guide](https://github.com/tuya-cloudcutter/tuya-cloudcutter) for instructions.

### Manual Flashing

If you prefer to flash manually, you'll need a USB to serial adapter. Follow the disassembly steps below:

1. Remove the front plastic face.
2. Unscrew the exposed screws.
3. Remove the clear panel and the small PCB underneath.

## Configuration Examples

### Series 1 (ESP8266)

```yaml
substitutions:
  device_name: deta_fan_controller
  friendly_name: "Deta Smart Fan Speed Controller"

##########################

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m
  restore_from_flash: true

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

sensor:
  - platform: wifi_signal
    name: ${friendly_name} Wifi Signal Strength
    update_interval: 60s
  - platform: uptime
    name: ${friendly_name} Uptime

text_sensor:
  - platform: wifi_info
    ip_address:
      name: ${friendly_name} IP
    ssid:
      name: ${friendly_name} SSID
    bssid:
      name: ${friendly_name} BSSID
    mac_address:
      name: ${friendly_name} Mac

logger:

api:

ota:

web_server:
  port: 80

light:
  - platform: binary
    output: relay_light
    id: light1
    name: ${friendly_name} Light

status_led:
  pin:
    number: GPIO3
    inverted: True

output:
  - platform: gpio
    id: relay_light
    pin: GPIO14
  - platform: template
    id: fan_speed
    type: float
    write_action:
      - then:
        - if:
            condition:
              lambda: return ((state > 0) && (state < .4));
            then:
              - switch.turn_on: relay_fan_1
              - delay: 20ms
              - switch.turn_off: relay_fan_2
              - delay: 20ms
              - switch.turn_off: relay_fan_3
        - if:
            condition:
              lambda: return ((state > .4) && (state < .7));
            then:
              - switch.turn_on: relay_fan_1
              - delay: 20ms
              - switch.turn_off: relay_fan_2
              - delay: 20ms
              - switch.turn_on: relay_fan_3
        - if:
            condition:
              lambda: return (state > .7);
            then:
              - switch.turn_on: relay_fan_1
              - delay: 20ms
              - switch.turn_on: relay_fan_2
              - delay: 20ms
              - switch.turn_on: relay_fan_3
        - if:
            condition:
              lambda: return (state < 0.01);
            then:
              - switch.turn_off: relay_fan_1
              - delay: 20ms
              - switch.turn_off: relay_fan_2
              - delay: 20ms
              - switch.turn_off: relay_fan_3

binary_sensor:
  - platform: gpio
    id: fan_light_sensor
    pin:
      number: GPIO16
      mode: INPUT
      inverted: True
    on_press:
      - light.toggle: light1
  - platform: gpio
    id: fan_power_sensor
    pin:
      number: GPIO00
      mode: INPUT
      inverted: True
    on_press:
      then:
        - fan.toggle: fan_1
  - platform: gpio
    id: fan_speed_sensor
    pin:
      number: GPIO05
      mode: INPUT
      inverted: True
    on_press:
      then:
        - if:
            condition:
              and:
                - switch.is_on: relay_fan_1
                - switch.is_off: relay_fan_2
                - switch.is_off: relay_fan_3
            then:
              - fan.turn_on:
                  id: fan_1
                  speed: 2
        - if:
            condition:
              and:
                - switch.is_on: relay_fan_1
                - switch.is_on: relay_fan_2
                - switch.is_off: relay_fan_3
            then:
              - fan.turn_on:
                  id: fan_1
                  speed: 3
        - if:
            condition:
              and:
                - switch.is_on: relay_fan_1
                - switch.is_on: relay_fan_2
                - switch.is_on: relay_fan_3
            then:
              - fan.turn_on:
                  id: fan_1
                  speed: 1

fan:
  - platform: speed
    id: fan_1
    output: fan_speed
    name: ${friendly_name} Fan Speed
    speed_count: 3

switch:
  - platform: restart
    name: ${friendly_name} REBOOT
  - platform: gpio
    id: relay_fan_1
    pin: GPIO13
  - platform: gpio
    id: relay_fan_2
    pin: GPIO04
  - platform: gpio
    id: relay_fan_3
    pin: GPIO15
  - platform: template
    id: update_fan_speed
    optimistic: True
    turn_on_action:
      then:
        - delay: 200ms
        - if:
            condition:
              and:
                - switch.is_off: relay_fan_1
                - switch.is_off: relay_fan_2
                - switch.is_off: relay_fan_3
            then:
              - fan.turn_off: fan_1
        - if:
            condition:
              and:
                - switch.is_on: relay_fan_1
                - switch.is_off: relay_fan_2
                - switch.is_off: relay_fan_3
            then:
              - fan.turn_on:
                  id: fan_1
                  speed: 1
        - if:
            condition:
              and:
                - switch.is_on: relay_fan_1
                - switch.is_on: relay_fan_2
                - switch.is_off: relay_fan_3
            then:
              - fan.turn_on:
                  id: fan_1
                  speed: 2
        - if:
            condition:
              and:
                - switch.is_on: relay_fan_1
                - switch.is_off: relay_fan_2
                - switch.is_on: relay_fan_3
            then:
              - fan.turn_on:
                  id: fan_1
                  speed: 3

```

### Series 2 (BK72xx)

```yaml
substitutions:
  devicename: "deta-switchfan"
  friendlyname: Deta Switch Fan
  deviceid: deta-switchfan
  devicemodel: Deta Grid Connect 6914HA Series 2

#################################

esphome:
  name: ${devicename}

bk72xx:
  board: generic-bk7231t-qfn32-tuya

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

logger:

web_server:

captive_portal:

api:

ota:

sensor:
  - platform: wifi_signal
    name: ${friendlyname} Wifi Signal Strength
    update_interval: 60s
  - platform: uptime
    name: ${friendlyname} Uptime

text_sensor:
  - platform: wifi_info
    ip_address:
      name: ${friendlyname} IP
    ssid:
      name: ${friendlyname} SSID
    bssid:
      name: ${friendlyname} BSSID
    mac_address:
      name: ${friendlyname} Mac
  - platform: version
    name: ${friendlyname} ESPHome Version

#################################
status_led:
  pin:
    number: P10
    inverted: true

light:
  - platform: binary
    output: relay_light
    id: light1
    name: ${friendlyname} Light

output:
  - platform: gpio
    id: relay_light
    pin: P26
  - platform: template
    id: fan_speed
    type: float
    write_action:
      - then:
        - if:
            condition:
              lambda: return ((state > 0) && (state < .4));
            then:
              - switch.turn_on: relay_fan_1
              - delay: 20ms
              - switch.turn_off: relay_fan_2
              - delay: 20ms
              - switch.turn_off: relay_fan_3
        - if:
            condition:
              lambda: return ((state > .4) && (state < .7));
            then:
              - switch.turn_on: relay_fan_1
              - delay: 20ms
              - switch.turn_on: relay_fan_2
              - delay: 20ms
              - switch.turn_off: relay_fan_3
        - if:
            condition:
              lambda: return (state > .7);
            then:
              - switch.turn_on: relay_fan_1
              - delay: 20ms
              - switch.turn_on: relay_fan_2
              - delay: 20ms
              - switch.turn_on: relay_fan_3
        - if:
            condition:
              lambda: return (state < 0.01);
            then:
              - switch.turn_off: relay_fan_1
              - delay: 20ms
              - switch.turn_off: relay_fan_2
              - delay: 20ms
              - switch.turn_off: relay_fan_3

binary_sensor:
  - platform: gpio
    id: fan_light_sensor
    pin:
      number: P14
      mode: INPUT
      inverted: True
    on_press:
      - light.toggle: light1
  - platform: gpio
    id: fan_power_sensor
    pin:
      number: P1
      mode: INPUT
      inverted: True
    on_press:
      then:
        - fan.toggle: fan_1
  - platform: gpio
    id: fan_speed_sensor
    pin:
      number: P8
      mode: INPUT
      inverted: True
    on_press:
      then:
        - if:
            condition:
              and:
                - switch.is_on: relay_fan_1
                - switch.is_off: relay_fan_2
                - switch.is_off: relay_fan_3
            then:
              - fan.turn_on:
                  id: fan_1
                  speed: 2
        - if:
            condition:
              and:
                - switch.is_on: relay_fan_1
                - switch.is_on: relay_fan_2
                - switch.is_off: relay_fan_3
            then:
              - fan.turn_on:
                  id: fan_1
                  speed: 3
        - if:
            condition:
              and:
                - switch.is_on: relay_fan_1
                - switch.is_on: relay_fan_2
                - switch.is_on: relay_fan_3
            then:
              - fan.turn_on:
                  id: fan_1
                  speed: 1

fan:
  - platform: speed
    id: fan_1
    output: fan_speed
    name: ${friendlyname} Fan Speed
    speed_count: 3

switch:
  - platform: gpio
    id: relay_fan_1
    pin: P6
  - platform: gpio
    id: relay_fan_2
    pin: P7
  - platform: gpio
    id: relay_fan_3
    pin: P9
  - platform: template
    id: update_fan_speed
    optimistic: True
    turn_on_action:
      then:
        - delay: 200ms
        - if:
            condition:
              and:
                - switch.is_off: relay_fan_1
                - switch.is_off: relay_fan_2
                - switch.is_off: relay_fan_3
            then:
              - fan.turn_off: fan_1
        - if:
            condition:
              and:
                - switch.is_on: relay_fan_1
                - switch.is_off: relay_fan_2
                - switch.is_off: relay_fan_3
            then:
              - fan.turn_on:
                  id: fan_1
                  speed: 1
        - if:
            condition:
              and:
                - switch.is_on: relay_fan_1
                - switch.is_on: relay_fan_2
                - switch.is_off: relay_fan_3
            then:
              - fan.turn_on:
                  id: fan_1
                  speed: 2
        - if:
            condition:
              and:
                - switch.is_on: relay_fan_1
                - switch.is_on: relay_fan_2
                - switch.is_on: relay_fan_3
            then:
              - fan.turn_on:
                  id: fan_1
                  speed: 3
```
