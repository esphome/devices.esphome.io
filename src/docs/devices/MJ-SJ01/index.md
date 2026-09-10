---
title: Martin Jerry Dimmer MJ-SD01
date-published: 2019-10-11
type: dimmer
standard: us
board: esp8266
---

## GPIO Pinout

| Pin    | Function                                          |
| ------ | ------------------------------------------------- |
| GPIO0  | up button (inverted, input_pullup)                |
| GPIO1  | down button (inverted, input_pullup)              |
| GPIO3  | led5 (inverted)                                   |
| GPIO4  | red led (inverted)                                |
| GPIO5  | led4 (inverted)                                   |
| GPIO12 | led3 (inverted)                                   |
| GPIO13 | pwm                                               |
| GPIO14 | led2 (inverted)                                   |
| GPIO15 | main button (input_pullup)                        |
| GPIO16 | led1 + relay (inverted) + blue led + reset button |

## Flashing

The header CN is under the board, visible after removing the 4 screws.

| Pin   | Function                  |
| ----- | ------------------------- |
| CN1-1 | TXD                       |
| CN1-2 | RXD                       |
| CN1-3 | GPIO2 (don't use)         |
| CN1-4 | GPIO0 (connect to ground) |
| CN1-5 | GROUND                    |
| CN1-6 | VCC                       |

## Light as fully-featured package

[@joshuaboniface](https://github.com/joshuaboniface) has created a fully-featured, packaged configuration for this
device,
which permits quick flashing with a pre-compiled binary as well as automatic adoption, deployment, and updates.

[Github Project Link](https://github.com/joshuaboniface/martinjerry-esphome)

The functionality has been modified quite significantly from the example below, to provide an experience more like a
WeMo
dimmer switch as well as provide more flexibility for control in HomeAssistant dashboards and automations. See the
README
in the repository for more information and examples.

## Light

```yaml
# Light dimmer

substitutions:
  #   # https://esphome.io/guides/configuration-types/
  device_name: martin_jerry_mj_sd01 # hostname & entity_id
  friendly_name: Martin Jerry MJ-SD01 # Displayed in HA frontend
  ip_address: !secret martin_jerry_mj_sd01_ip # use /config/esphome/secrets.yaml
  pwm_min_power: 15% # keep dimming functional at lowest levels
  no_delay: 0s # transition when changing dimmer_lvl & relay delay
  transition_length: .5s # transition when turning on/off
  long_press_min: .4s # minimum time to activate long-press action
  long_press_max: 2s # maximum time to activate long-press action
  long_press_up: 100% # long press brightness
  long_press_down: 33% # long press brightness
  long_press_main: 50% # long press brightness
  # Number of incremental steps between 0 and 100% intensity with the up/down
  # buttons.
  steps: "8"
  gamma_correct: "2.0" # Default gamma of 2.8 is generally too high.

binary_sensor:
  - platform: gpio
    # https://esphome.io/components/binary_sensor/gpio/
    #name: "${friendly_name} Up Button"
    id: up_button
    pin:
      number: GPIO0
      inverted: True
      mode: INPUT_PULLUP
    on_press:
      # https://esphome.io/components/binary_sensor/#on_press
      - if:
          condition:
            light.is_on: dimmer
          then:
            - lambda: !lambda |-
                // Similar to light.dim_relative but add the flashing.
                auto val = id(dimmer).remote_values.get_brightness();
                if (val >= (${steps}.0f-1.0f)/${steps}.0f) {
                  val = 1.0f;
                } else {
                  val += 1.0f/${steps}.0f;
                }
                auto call = id(dimmer).turn_on();
                call.set_brightness(val);
                call.perform();
                if (val == 1.f) {
                  id(flash_lights).execute();
                }
          else:
            - light.turn_on:
                id: dimmer
                brightness: "${long_press_up}"
    on_click:
      # https://esphome.io/components/binary_sensor/#on_click
      min_length: ${long_press_min}
      max_length: ${long_press_max}
      then:
        - light.turn_on:
            id: dimmer
            brightness: "${long_press_up}"
  - platform: gpio
    # https://esphome.io/components/binary_sensor/gpio/
    #name: "${friendly_name} Down Button"
    id: down_button
    pin:
      number: GPIO1
      inverted: True
      mode: INPUT_PULLUP
    on_press:
      # https://esphome.io/components/binary_sensor/#on_press
      - if:
          condition:
            light.is_on: dimmer
          then:
            - lambda: !lambda |-
                // Similar to light.dim_relative but add the flashing.
                auto val = id(dimmer).remote_values.get_brightness();
                if (val <= 1.0f/${steps}.0f) {
                  val = .01f;
                } else {
                  val -= 1.0f/${steps}.0f;
                }
                auto call = id(dimmer).turn_on();
                call.set_brightness(val);
                call.perform();
                if (val == 0.01f) {
                  id(flash_lights).execute();
                }
          else:
            - light.turn_on:
                id: dimmer
                brightness: "${long_press_down}"
    on_click:
      # https://esphome.io/components/binary_sensor/#on-click
      min_length: ${long_press_min}
      max_length: ${long_press_max}
      then:
        - light.turn_on:
            id: dimmer
            brightness: "${long_press_down}"
  - platform: gpio
    # https://esphome.io/components/binary_sensor/gpio/
    #name: ${friendly_name} Main Button
    id: main_button
    pin:
      number: GPIO15
      mode: INPUT_PULLUP
    on_press:
      # TODO: Use "light.toggle: dimmer" instead of the code below if you want
      # to keep the previous brightness by default.
      # https://esphome.io/components/binary_sensor/#on-press
      - if:
          condition:
            light.is_on: dimmer
          then:
            - light.turn_off: dimmer
          else:
            - light.turn_on:
                id: dimmer
                brightness: "${long_press_main}"
    on_click:
      # https://esphome.io/components/binary_sensor/#on-click
      min_length: ${long_press_min}
      max_length: ${long_press_max}
      then:
        - light.turn_on:
            id: dimmer
            brightness: "${long_press_main}"

light:
  - platform: status_led
    id: ledred
    pin:
      number: GPIO4
      inverted: True
  - platform: monochromatic
    # https://esphome.io/components/light/monochromatic/
    name: "${friendly_name}"
    id: dimmer
    output: pwm
    default_transition_length: ${no_delay}
    gamma_correct: "${gamma_correct}"
    effects:
      - flicker:
          name: "Flicker"
          alpha: 90%
          intensity: 25%
      - strobe:
          name: "Fast Pulse"
          colors:
            - state: true
              brightness: 100%
              duration: 500ms
            - brightness: 1%
              duration: 750ms
    on_state:
      - script.execute: set_lights

script:
  - id: set_lights
    then:
      - lambda: |-
          if (id(dimmer).remote_values.get_state() == 0.f) {
            id(led2).turn_off();
            id(led3).turn_off();
            id(led4).turn_off();
            id(led5).turn_off();
            // Comment the following line out if you don't want the red LED when
            // the dimmer is off.
            id(ledred).turn_on().perform();
            return;
          }
          id(ledred).turn_off().perform();
          auto val = id(dimmer).remote_values.get_brightness();
          if (val >= .1f) {
            id(led2).turn_on();
          } else {
            id(led2).turn_off();
          }
          if (val >= .36f) {
            id(led3).turn_on();
          } else {
            id(led3).turn_off();
          }
          if (val >= .73f) {
            id(led4).turn_on();
          } else {
            id(led4).turn_off();
          }
          if (val >= .9f) {
            id(led5).turn_on();
          } else {
            id(led5).turn_off();
          }
  - id: flash_lights
    then:
      - output.turn_on: led2
      - output.turn_on: led3
      - output.turn_on: led4
      - output.turn_on: led5
      - delay: 150ms
      - output.turn_off: led2
      - output.turn_off: led3
      - output.turn_off: led4
      - output.turn_off: led5
      - delay: 150ms
      - output.turn_on: led2
      - output.turn_on: led3
      - output.turn_on: led4
      - output.turn_on: led5
      - delay: 150ms
      - output.turn_off: led2
      - output.turn_off: led3
      - output.turn_off: led4
      - output.turn_off: led5
      - delay: 150ms
      - script.execute: set_lights

output:
  - platform: esp8266_pwm
    # https://esphome.io/components/output/esp8266_pwm/
    power_supply: relay
    pin: GPIO13
    id: pwm
    # Even lower frequency can be used. 120 Hz works fine in 60 Hz countries.
    frequency: 300 Hz
    min_power: ${pwm_min_power}
  - platform: gpio
    # https://esphome.io/components/output/gpio/
    id: led2
    pin: GPIO14
    inverted: true
  - platform: gpio
    id: led3
    pin: GPIO12
    inverted: true
  - platform: gpio
    id: led4
    pin: GPIO5
    inverted: true
  - platform: gpio
    id: led5
    pin: GPIO3
    inverted: true

power_supply:
  - id: relay
    # https://esphome.io/components/power_supply/
    pin:
      number: GPIO16
      inverted: True
    enable_time: ${no_delay}
    keep_on_time: ${no_delay}

## below is common between both light and fan

esphome:
  # https://esphome.io/components/esphome/
  name: ${device_name}
  # esp8266_restore_from_flash: true
  # Can cause reduced flash lifetime due to frequent writes, enable as needed

esp8266:
  board: esp01_1m

sensor:
  - platform: wifi_signal
    name: "${friendly_name} WiFi Signal"
    update_interval: 600s

wifi:
  # https://esphome.io/components/wifi/
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: ${ip_address}
    gateway: !secret wifigateway
    subnet: !secret wifisubnet
    dns1: !secret wifidns
  ap:
    ssid: ${friendly_name}_AP
    password: !secret wifi_password
    channel: 1
    manual_ip:
      static_ip: 192.168.1.1
      gateway: 192.168.1.1
      subnet: 255.255.255.0

# web_server:
# port: 80
# https://esphome.io/components/web_server/
# Can cause high memory usage on ESP8266, enable as needed

logger:
  # https://esphome.io/components/logger/

api:
  encryption:
    key: !secret encryption_key
  # https://esphome.io/components/api/

ota:
  password: !secret esphome_ota_password
  # https://esphome.io/components/ota/
```

## Timed Fan control

The MJ-SD01 can control a low power (&lt;400W?) fan. Ignore the dimmer feature and use it as a timer, using the green leds
as feedback on how much time is left.

```yaml
# Timed fan control

substitutions:
  #   # https://esphome.io/guides/configuration-types/
  device_name: martin_jerry_mj_sd01 # hostname & entity_id
  friendly_name: Martin Jerry MJ-SD01 # Displayed in HA frontend
  ip_address: !secret martin_jerry_mj_sd01_ip # use /config/esphome/secrets.yaml
  max_time: "30" # number of minutes
  increment: "5" # number of minutes to add or remove with up/down buttons

binary_sensor:
  - platform: gpio
    # https://esphome.io/components/binary_sensor/gpio/
    #name: "${friendly_name} Up Button"
    id: up_button
    pin:
      number: GPIO0
      inverted: True
      mode: INPUT_PULLUP
    on_press:
      - lambda: !lambda |-
          auto now = id(current_time).timestamp_now();
          if (id(until) == 0) {
            id(until) = now;
          }
          id(until) += ${increment}*60;
          auto max = now + ${max_time}*60;
          if (id(until) > max) {
            id(until) = max;
            id(flash_lights).execute();
          }
      - if:
          condition:
            switch.is_off: fan
          then:
            - switch.turn_on: fan
  - platform: gpio
    # https://esphome.io/components/binary_sensor/gpio/
    #name: "${friendly_name} Down Button"
    id: down_button
    pin:
      number: GPIO1
      inverted: True
      mode: INPUT_PULLUP
    on_press:
      - if:
          condition:
            switch.is_on: fan
          then:
            - lambda: !lambda |-
                id(until) -= ${increment}*60;
                if (id(until) < id(current_time).timestamp_now()) {
                  id(fan).turn_off();
                }
  - platform: gpio
    # https://esphome.io/components/binary_sensor/gpio/
    #name: ${friendly_name} Main Button
    id: main_button
    pin:
      number: GPIO15
      mode: INPUT_PULLUP
    on_press:
      - if:
          condition:
            switch.is_on: fan
          then:
            - switch.turn_off: fan
          else:
            - lambda: !lambda id(until) = id(current_time).timestamp_now() + ${max_time}*60;
            - switch.turn_on: fan

switch:
  - platform: output
    id: fan
    name: "${upper_devicename}"
    output: out
    on_turn_on:
      - light.turn_off: ledred
    on_turn_off:
      - globals.set:
          id: until
          value: "0"
      - light.turn_on: ledred

light:
  - platform: status_led
    id: ledred
    pin:
      number: GPIO4
      inverted: True

time:
  - platform: homeassistant
    id: current_time

globals:
  - id: until
    type: uint32_t
    restore_value: no

interval:
  - interval: 250ms
    then:
      - lambda: |-
          auto now = id(current_time).timestamp_now();
          if (id(until) < now) {
            id(fan).turn_off();
          }
          id(set_lights).execute();
script:
  - id: set_lights
    then:
      - lambda: |-
          if (id(until) == 0) {
            id(led2).turn_off();
            id(led3).turn_off();
            id(led4).turn_off();
            id(led5).turn_off();
            return;
          }
          auto delta = (${max_time}*60) / 5;
          auto limit = id(current_time).timestamp_now() + delta;
          if (id(until) >= limit) {
            id(led2).turn_on();
          } else {
            id(led2).turn_off();
          }
          limit += delta;
          if (id(until) >= limit) {
            id(led3).turn_on();
          } else {
            id(led3).turn_off();
          }
          limit += delta;
          if (id(until) >= limit) {
            id(led4).turn_on();
          } else {
            id(led4).turn_off();
          }
          limit += delta;
          if (id(until) >= limit) {
            id(led5).turn_on();
          } else {
            id(led5).turn_off();
          }
  - id: flash_lights
    then:
      - output.turn_on: led2
      - output.turn_on: led3
      - output.turn_on: led4
      - output.turn_on: led5
      - delay: 150ms
      - output.turn_off: led2
      - output.turn_off: led3
      - output.turn_off: led4
      - output.turn_off: led5
      - delay: 150ms
      - output.turn_on: led2
      - output.turn_on: led3
      - output.turn_on: led4
      - output.turn_on: led5
      - delay: 150ms
      - output.turn_off: led2
      - output.turn_off: led3
      - output.turn_off: led4
      - output.turn_off: led5
      - delay: 150ms
      - script.execute: set_lights

output:
  - platform: gpio
    power_supply: relay
    pin: GPIO13
    id: out
  - platform: gpio
    id: led2
    pin: GPIO14
    inverted: true
  - platform: gpio
    id: led3
    pin: GPIO12
    inverted: true
  - platform: gpio
    id: led4
    pin: GPIO5
    inverted: true
  - platform: gpio
    id: led5
    pin: GPIO3
    inverted: true

power_supply:
  - id: relay
    # https://esphome.io/components/power_supply/
    pin:
      number: GPIO16
      inverted: True
    enable_time: 0s
    keep_on_time: 0s

## below is common between both light and fan

esphome:
  # https://esphome.io/components/esphome/
  name: ${device_name}
  # esp8266_restore_from_flash: true
  # Can cause reduced flash lifetime due to frequent writes, enable as needed

esp8266:
  board: esp01_1m
sensor:
  - platform: wifi_signal
    name: "${friendly_name} WiFi Signal"
    update_interval: 600s

wifi:
  # https://esphome.io/components/wifi
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: ${ip_address}
    gateway: !secret wifigateway
    subnet: !secret wifisubnet
    dns1: !secret wifidns
  ap:
    ssid: ${friendly_name}_AP
    password: !secret wifi_password
    channel: 1
    manual_ip:
      static_ip: 192.168.1.1
      gateway: 192.168.1.1
      subnet: 255.255.255.0

# web_server:
# port: 80
# https://esphome.io/components/web_server/
# Can cause high memory usage on ESP8266, enable as needed

logger:
  # https://esphome.io/components/logger/

api:
  encryption:
    key: !secret encryption_key
  # https://esphome.io/components/api/

ota:
  password: !secret esphome_ota_password
  # https://esphome.io/components/ota/
```
