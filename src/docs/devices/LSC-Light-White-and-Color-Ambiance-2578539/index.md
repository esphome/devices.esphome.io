---
title: LSC Light White and Color Ambiance 2578539
date-published: 2023-04-17
type: light
standard: eu
---

## Warning

The latest LSC Light White Ambiance 2578539 devices use the Tuya BK7231T module, which is not compatible with ESPHome!

## Notice

- This light is flashable using the latest tuya-cloudcutter with a compiled ESPHome binary.
- The LEDs are controlled by i2C using a BP5758d chip (Tuya)

## Product Images

![light with box](image.png)

## bp5758d Pinout

| Pin | Function  |
| --- | --------- |
| P26 | Data Pin  |
| P24 | Clock Pin |

## GPIO Pinout

| Channel | Function   |
| ------- | ---------- |
| 2       | Red        |
| 1       | Green      |
| 3       | Blue       |
| 4       | Warm White |
| 5       | Cold White |

## Basic configuration

```yml
substitutions:
  name: lsc-light-rgb-01
  friendly_name: lsc-light-rgb-01
esphome:
  name: ${name}
  friendly_name: ${friendly_name}

libretuya:
  board: generic-bk7231t-qfn32-tuya
  framework:
    version: dev
  
# OTA flashing
ota:
  - platform: esphome

wifi: # Your Wifi network details
  
# Enable fallback hotspot in case wifi connection fails  
  ap:

# Enabling the logging component
logger:

# Enable Home Assistant API
api:

# Enable the captive portal
captive_portal:

# Enable the Web Server component 
webserver:

bp5758d:
  data_pin: P26
  clock_pin: P24

output:
  - platform: bp5758d
    id: output_red
    channel: 2
  - platform: bp5758d
    id: output_green
    channel: 1
  - platform: bp5758d
    id: output_blue
    channel: 3
  - platform: bp5758d
    id: output_cold_white
    channel: 5
  - platform: bp5758d
    id: output_warm_white
    channel: 4

light:
  - platform: rgbww
    name: ${friendly_name}
    id: the_light
    restore_mode: ALWAYS_OFF
    red: output_red
    green: output_green
    blue: output_blue
    cold_white: output_cold_white
    warm_white: output_warm_white
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
    color_interlock: true
    constant_brightness: true
    effects:
      - random:
          name: "Slow Random"
          transition_length: 30s
          update_interval: 30s
      - random:
          name: "Fast Random"
          transition_length: 4s
          update_interval: 5s
      - strobe:
      - flicker:
          alpha: 50% #The percentage that the last color value should affect the light. More or less the “forget-factor” of an exponential moving average. Defaults to 95%.
          intensity: 50% #The intensity of the flickering, basically the maximum amplitude of the random offsets. Defaults to 1.5%.
      - lambda:
          name: Throb
          update_interval: 1s
          lambda: |-
            static int state = 0;
            auto call = id(the_light).turn_on();
            // Transtion of 1000ms = 1s
            call.set_transition_length(1000);
            if (state == 0) {
              call.set_brightness(1.0);
            } else {
              call.set_brightness(0.01);
            }
            call.perform();
            state += 1;
            if (state == 2)
              state = 0;

## Blink the light if we aren't connected to WiFi.
## Uncomment below
#interval:
#- interval: 500ms
#  then:
#  - if:
#      condition:
#        not:
#          wifi.connected:
#      then:
#        - light.turn_on:
#            id: the_light
#            brightness: 50%
#            transition_length: 0s
#        - delay: 250ms
#        - light.turn_off:
#            id: the_light
#            transition_length: 250ms
```
