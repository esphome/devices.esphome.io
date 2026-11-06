---
title: Deta Grid Connect Smart Double Touch Power Point
date-published: 2020-11-19
type: plug
standard: au
board: esp8266
---

## Deta Grid Connect Smart Double Touch Power Point

Sold by [Bunnings Warehouse](https://www.bunnings.com.au/deta-grid-connect-smart-double-touch-power-point_p0098813)
this is a AU/NZ standard wall outlet/powerpoint based on the TYWE3S module.

## Getting it up and running

### tuya-convert

These outlets are Tuya devices, so if you don't want to open them up to flash directly, you can attempt to
[use tuya-convert to initially get ESPHome onto them](/devices/tuya-convert) however recently purchased devices are no
longer Tuya-Convert compatible.  There's a useful guide to disassemble and serial flash similar switches
[on Mike McGuire's blog][1]. After that, you can use ESPHome's OTA functionality to make any further changes.

[1]: https://blog.mikejmcguire.com/2020/05/22/deta-grid-connect-3-and-4-gang-light-switches-and-home-assistant/

- Put the outlet into "smartconfig" / "autoconfig" / pairing mode by holding any button for about 5 seconds.
- The status LED (to the side of the button(s)) blinks rapidly to confirm that it has entered pairing mode.

### direct flashing

If you can't or don't wish to use tuya-convert, you can flash directly to the outlet with USB to serial adapter.

To disassemble the outlet in order to flash, remove the front plastic face (secured by clips on each side),
then remove the two exposed screws. Remove the clear panel and then carefully remove the small thin PCB
that sat underneath the panel.

Note that the side of the TYWE3S module where the 3v3 pin is located may be covered in silicone / epoxy.
You may be able to simply dig at it enough that the 3v3 pin is accessible.

## GPIO pinout

| GPIO # |  Component |
| :----: | ---------: |
| GPIO00 |       None |
| GPIO01 |       None |
| GPIO02 |       None |
| GPIO03 |       None |
| GPIO04 | Status LED |
| GPIO05 |       None |
| GPIO09 |       None |
| GPIO10 |       None |
| GPIO12 |  Button 2n |
| GPIO13 |    Relay 1 |
| GPIO14 |    Relay 2 |
| GPIO15 |       None |
| GPIO16 |  Button 1n |

## Basic Configuration

```yaml
substitutions:
  device_name: deta_double_powerpoint
  friendly_name: "Deta Double Powerpoint"
  
#################################

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m
  restore_from_flash: true

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "ESPHOME"
    password: "12345678"

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret ota_password

logger:

web_server:
  port: 80

sensor:
  - platform: uptime
    name: ${device_name} Uptime

  - platform: wifi_signal
    name: ${device_name} Wifi Signal
    update_interval: 60s

text_sensor:  
  - platform: version
    name: ${device_name} ESPHome Version
  - platform: wifi_info
    ip_address:
      name: ${device_name} IP

#################################

status_led:
  pin:
    number: GPIO04
    inverted: false

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO16
      inverted: True
    id: button1
    name: "${device_name} Button 1"
    on_click:
      - min_length: 300ms
        max_length: 1000ms
        then:
          - switch.toggle: relay_template1
    internal: True
  - platform: gpio
    pin:
      number: GPIO12
      inverted: True
    id: button2
    name: "${device_name} Button 2"
    on_click:
      - min_length: 300ms
        max_length: 1000ms
        then:
          - switch.toggle: relay_template2
    internal: True

switch:
  - platform: gpio
    pin: GPIO13
    id: relay1

  - platform: gpio
    pin: GPIO14
    id: relay2

  - platform: template
    name: ${device_name} Socket A
    id: relay_template1
    lambda: |-
      if (id(relay1).state) {
        return true;
      } else {
        return false;
      }
    turn_on_action:
      - switch.turn_on: relay1
    turn_off_action:
      - switch.turn_off: relay1

  - platform: template
    name: ${device_name} Socket B
    id: relay_template2
    lambda: |-
      if (id(relay2).state) {
        return true;
      } else {
        return false;
      }
    turn_on_action:
      - switch.turn_on: relay2
    turn_off_action:
      - switch.turn_off: relay2
```
