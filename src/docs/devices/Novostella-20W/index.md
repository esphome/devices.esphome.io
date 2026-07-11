---
title: Novostella 20W Flood Light
date-published: 2019-10-29
type: light
standard: us
board: esp8266
---

5-channel PWM RGBWW smart flood light, 2700k-6500k tunable white with RGB colors, 20W, 2000LM, 120V AC, IP66 Waterproof,
natively Tuya/Smart Life, works with Tuya-convert to flash to ESPHome. FCC-ID is
[2AI5T-SFGD-002](https://fccid.io/2AI5T-SFGD-002/Internal-Photos/Internal-photos-4401574).

This template has been updated with "comment:" and "captive_portal:" feautures added in ESPHome v. 1.14

## GPIO Pinout

| Pin    | Function           |
| ------ | ------------------ |
| GPIO4  | Red channel        |
| GPIO5  | Cold White channel |
| GPIO12 | Green channel      |
| GPIO13 | Warm White channel |
| GPIO14 | Blue channel       |

## Basic Configuration

```yaml
#Novostella 20W Flood Light, https://www.amazon.com/dp/B07VH1VHYL
#https://fccid.io/2AI5T-SFGD-002
#https://blakadder.github.io/templates/novostella_20W_flood.html
substitutions:
  device_name: novoflood
  device_description: 20W RGBWW flood light
  friendly_name: Novostella Flood Light

esphome:
  name: ${device_name}
  comment: ${device_description}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: on #we only have one WiFi AP so just use the first one that matches
  ap: #since we listed an SSID above, this AP mode will only enable if no WiFi connection could be made
    ssid: ${friendly_name}_AP
    password: !secret wifi_password

captive_portal:

# Enable logging
logger:
  baud_rate: 0 #disable UART logging since we aren't connected to GPIO1 TX

# Enable Home Assistant API
api:

# Enable OTA updates
ota:

# Enable web server
web_server:
  port: 80

binary_sensor:
  # Reports if this device is Connected or not
  - platform: status
    name: ${friendly_name} Status

sensor:
  # Reports the WiFi signal strength
  - platform: wifi_signal
    name: ${friendly_name} Signal
    update_interval: 60s

  # Reports how long the device has been powered (in minutes)
  - platform: uptime
    name: ${friendly_name} Uptime
    filters:
      - lambda: return x / 60.0;
    unit_of_measurement: minutes

text_sensor:
  # Reports the ESPHome Version with compile date
  - platform: version
    name: ${friendly_name} ESPHome Version

output:
  - platform: esp8266_pwm
    id: red
    pin: GPIO4
    inverted: False
  - platform: esp8266_pwm
    id: green
    pin: GPIO12
    inverted: False
  - platform: esp8266_pwm
    id: blue
    pin: GPIO14
    inverted: False
  - platform: esp8266_pwm
    id: cold_white
    pin: GPIO5
    inverted: False
  - platform: esp8266_pwm
    id: warm_white
    pin: GPIO13
    inverted: False

light:
  - platform: rgbww
    name: ${friendly_name}
    red: red
    green: green
    blue: blue
    cold_white: cold_white
    warm_white: warm_white
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
    id: thelight
    color_interlock: true #Prevent white leds being on at the same time as RGB leds
    restore_mode: ALWAYS_ON #Start with light on after reboot/power-loss event, so that it works from a dumb lightswitch
    effects:
      - random:
      - strobe:
      - flicker:
          alpha: 50% #The percentage that the last color value should affect the light. More or less the “forget-factor” of an exponential moving average. Defaults to 95%.
          intensity: 50% #The intensity of the flickering, basically the maximum amplitude of the random offsets. Defaults to 1.5%.
      - lambda:
          name: Throb
          update_interval: 1s
          lambda: |-
            static int state = 0;
            auto call = id(thelight).turn_on();
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

# Blink the light if we aren't connected to WiFi.
interval:
  - interval: 500ms
    then:
      - if:
          condition:
            not:
              wifi.connected:
          then:
            - light.turn_on:
                id: thelight
                brightness: 50%
                transition_length: 0s
            - delay: 250ms
            - light.turn_off:
                id: thelight
                transition_length: 250ms
```

## Split Configuration

If you have several of these bulbs, you may prefer to keep the shared code in one file and only put the device-specific
code in the files for each bulb.

In novoflood_common.yaml:

```yaml
# Common code for Novostella 20W Flood Lights

#Novostella 20W Flood Light, https://www.amazon.com/dp/B07VH1VHYL
#https://fccid.io/2AI5T-SFGD-002
#https://blakadder.github.io/templates/novostella_20W_flood.html

esphome:
  name: ${device_name}
  comment: ${device_description}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: on #we only have one WiFi AP so just use the first one that matches
  ap: #since we listed an SSID above, this AP mode will only enable if no WiFi connection could be made
    ssid: ${friendly_name}_AP
    password: !secret wifi_password

captive_portal:

# Enable logging
logger:
  baud_rate: 0 #disable UART logging since we aren't connected to GPIO1 TX

# Enable Home Assistant API
api:

# Enable OTA updates
ota:

# Enable web server
web_server:
  port: 80

binary_sensor:
  # Reports if this device is Connected or not
  - platform: status
    name: ${friendly_name} Status

sensor:
  # Reports the WiFi signal strength
  - platform: wifi_signal
    name: ${friendly_name} Signal
    update_interval: 60s

  # Reports how long the device has been powered (in minutes)
  - platform: uptime
    name: ${friendly_name} Uptime
    filters:
      - lambda: return x / 60.0;
    unit_of_measurement: minutes

text_sensor:
  # Reports the ESPHome Version with compile date
  - platform: version
    name: ${friendly_name} ESPHome Version

output:
  - platform: esp8266_pwm
    id: red
    pin: GPIO4
    inverted: False
  - platform: esp8266_pwm
    id: green
    pin: GPIO12
    inverted: False
  - platform: esp8266_pwm
    id: blue
    pin: GPIO14
    inverted: False
  - platform: esp8266_pwm
    id: cold_white
    pin: GPIO5
    inverted: False
  - platform: esp8266_pwm
    id: warm_white
    pin: GPIO13
    inverted: False

light:
  - platform: rgbww
    name: ${friendly_name}
    red: red
    green: green
    blue: blue
    cold_white: cold_white
    warm_white: warm_white
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
    id: thelight
    color_interlock: true #Prevent white leds being on at the same time as RGB leds
    restore_mode: ALWAYS_ON #Start with light on after reboot/power-loss event, so that it works from a dumb lightswitch
    effects:
      - random:
      - strobe:
      - flicker:
          alpha: 50% #The percentage that the last color value should affect the light. More or less the “forget-factor” of an exponential moving average. Defaults to 95%.
          intensity: 50% #The intensity of the flickering, basically the maximum amplitude of the random offsets. Defaults to 1.5%.
      - lambda:
          name: Throb
          update_interval: 1s
          lambda: |-
            static int state = 0;
            auto call = id(thelight).turn_on();
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

# Blink the light if we aren't connected to WiFi.
interval:
  - interval: 500ms
    then:
      - if:
          condition:
            not:
              wifi.connected:
          then:
            - light.turn_on:
                id: thelight
                brightness: 50%
                transition_length: 0s
            - delay: 250ms
            - light.turn_off:
                id: thelight
                transition_length: 250ms
```

Then in each bulb's yaml:

```yaml
substitutions:
  device_name: novoflood1
  device_description: 20W RGBWW flood light, West half of front yard facing the living room.
  friendly_name: Novostella Flood Light 1

<<: !include novoflood_common.yaml
```
