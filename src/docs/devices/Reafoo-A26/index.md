---
title: Reafoo 9W A26 Bulb
date-published: 2019-10-28
type: light
standard: us
board: esp8266
---

5-channel PWM RGBWW smart light bulb, A26 shape, E26 base, 2700k-6500k tunable white with RGB colors, 100-240V AC
50/60Hz, natively Tuya/Smart Life, works with Tuya-convert to flash to ESPHome. FCC-ID is
[2AJK8-LZ803](https://fccid.io/2AJK8-LZ803).

## GPIO Pinout

| Pin    | Function           |
| ------ | ------------------ |
| GPIO4  | Warm White channel |
| GPIO5  | Green channel      |
| GPIO12 | Blue channel       |
| GPIO14 | Cold White channel |
| GPIO15 | Red channel        |

## Basic Configuration

```yaml
#Reafoo smart bulb, https://www.amazon.com/dp/B08CH9ZLKK
#https://fccid.io/2AJK8-LZ803
#https://blakadder.github.io/templates/reafoo_A26.html
substitutions:
  device_name: reafoo
  friendly_name: REAFOO Smart Bulb

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: on #we only have one WiFi AP so just use the first one that matches
  ap: #since we listed an SSID above, this AP mode will only enable if no WiFi connection could be made
    ssid: ${friendly_name}_AP
    password: !secret wifi_password

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
    pin: GPIO15
    inverted: False
  - platform: esp8266_pwm
    id: green
    pin: GPIO5
    inverted: False
  - platform: esp8266_pwm
    id: blue
    pin: GPIO12
    inverted: False
  - platform: esp8266_pwm
    id: cold_white
    pin: GPIO14
    inverted: False
  - platform: esp8266_pwm
    id: warm_white
    pin: GPIO4
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

In reafoo_common.yaml:

```yaml
# Common code for REAFOO bulbs

#Reafoo smart bulb, https://www.amazon.com/dp/B08CH9ZLKK
#https://fccid.io/2AJK8-LZ803
#https://blakadder.github.io/templates/reafoo_A26.html

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: on #we only have one WiFi AP so just use the first one that matches
  ap: #since we listed an SSID above, this AP mode will only enable if no WiFi connection could be made
    ssid: ${friendly_name}_AP
    password: !secret wifi_password

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
    pin: GPIO15
    inverted: False
  - platform: esp8266_pwm
    id: green
    pin: GPIO5
    inverted: False
  - platform: esp8266_pwm
    id: blue
    pin: GPIO12
    inverted: False
  - platform: esp8266_pwm
    id: cold_white
    pin: GPIO14
    inverted: False
  - platform: esp8266_pwm
    id: warm_white
    pin: GPIO4
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
  device_name: bulb1
  friendly_name: Bulb 1

<<: !include reafoo_common.yaml
```
