---
title: Arlec Grid Connect Smart 87cm Linkable CCT Bar Light
date-published: 2025-11-09
type: light
standard: au
board: esp8266
difficulty: 5
---

The `Arlec Grid Connect Smart 87cm Linkable CCT Bar Light` is part of the
[Grid Connect ecosystem](https://grid-connect.com.au/) sold at Bunnings in Australia and uses the
Tuya [CBLC9](https://developer.tuya.com/docs/iot/cblc9-module-datasheet?id=Ka42cqnj9r0i5) module.
This module is a variant of the BK7231 family and must be re-flashed or replaced with an ESP8266
series module which fits inside the housing.

The light is simply a CCT LED light strip mounted inside a plastic diffuser tube, but does come with
useful mounting hardware.

This installation replaces the CBLC9 with an ESP8285, using soldered fly leads between the controller
board and ESP8285, however a re-flash of the CBLC9 is likely also possible, which would allow for the
same module to be removed, re-flashed, and re-installed.

## GPIO Pinout for ESP8285

| CBLC9 Pin | ESP8285 Pin | Function           |
| --------- | ----------- | ------------------ |
| P8        | GPIO13      | PWM `(brightness)` |
| P7        | GPIO5       | PWM `(color_temp)` |

## Conversion

The light assembly is glued together at either end using white silicone glue. The end where the power
plug is connected must be slightly ground down around the edges so that a long slim spudger tool can be
inserted between the end cap and the housing about 5cm depth. This allows the silicone glue bond to be broken.
The control module can be slid out far enough to de-solder the CBLC9 module and the ESP8285 then soldered to
the 3.3V, GND, P8 and P7 pads.

## Configuration

```yaml
esphome:
  name: "Arlec UC552HA"

esp8266:
  board: esp8285
  esp8266_restore_from_flash: true

logger:
  baud_rate: 0

captive_portal:

api:
  encryption:
    key: !secret api_key

ota:
  platform: esphome
  password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "Arlec UC552HA"
    password: !secret wifi_ap_password

output:
  - platform: esp8266_pwm
    id: cct_out
    pin: GPIO5
    inverted: true
  - platform: esp8266_pwm
    id: dimmer_out
    pin: GPIO13
    inverted: false

light:
  - platform: color_temperature
    name: "Light"
    brightness: dimmer_out
    color_temperature: cct_out
    cold_white_color_temperature: 6600 K
    warm_white_color_temperature: 3000 K
    restore_mode: RESTORE_DEFAULT_OFF
```
