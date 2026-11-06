---
title: Brilliant Smart Wi-Fi RGB Garden Light
date-published: 2019-11-10
type: light
standard: au
board: esp8266
---

## General Notes

This configuration is for the [Brilliant Smart Wi-Fi RGB Garden Light](https://www.brilliantsmart.com.au/smart-products/garden/smart-garden-kit/)
which comes as a kit with 4 LED RGB spotlights, a transformer and the controller.

![Brilliant Smart Wi-Fi RGB Garden Light Kit](./Brilliant-Smart-Wi-Fi-RGB-Garden-Light.jpg "Brilliant Smart Wi-Fi RGB Garden Light Kit")

## GPIO Pinout

| Pin    | Function      |
| ------ | ------------- |
| GPIO4  | Red Channel   |
| GPIO12 | Green Channel |
| GPIO14 | Blue Channel  |

## Basic Configuration

```yaml
esphome:
  name: garden_light

esp8266:
  board: esp01_1m

wifi:
  ssid: "ssid"
  password: "password"

logger:

web_server:

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: "ota_password"

light:
  - platform: rgb
    name: "Garden Light"
    id: me
    red: output_red
    green: output_green
    blue: output_blue
    restore_mode: RESTORE_DEFAULT_OFF
    effects:
      - lambda:
          name: RedGreenFade
          update_interval: 4s
          lambda: |-
            static int state = 0;
            auto call = id(me).turn_on();
            // Transtion of 1000ms = 1s
            call.set_transition_length(4000);
            if (state == 0) {
              call.set_rgb(1.0, 0.0, 0.0);
            } else if (state == 1) {
              call.set_rgb(0.0, 1.0, 0.0);
            } else if (state == 2) {
              call.set_rgb(0.0, 0.0, 1.0);
            } else {
              call.set_rgb(1.0, 0.0, 0.0);
            }
            call.perform();
            state += 1;
            if (state == 2) // repeat only the red and green from christmas
              state = 0;

output:
  - platform: esp8266_pwm
    id: output_red
    pin: GPIO4
  - platform: esp8266_pwm
    id: output_green
    pin: GPIO12
  - platform: esp8266_pwm
    id: output_blue
    pin: GPIO14
```
