---
title: Lingan SWA1
date-published: 2023-12-16
type: plug
standard: uk, us, eu
board: esp8266
---

## GPIO Pinout

| Pin    | Function                                 |
| ------ | ---------------------------------------- |
| GPIO4  | Blue Status LED (HIGH = off, LOW = on)   |
| GPIO5  | Relay and Red LED (HIGH = on, LOW = off) |
| GPIO13 | Push Button (HIGH = off, LOW = on)       |

## Basic Configuration - as a light entity

```yaml
substitutions:
  devicename: esphome-device-name
  friendly_name: My Friendly Name
  restore_mode: RESTORE_DEFAULT_OFF

esphome:
  name: "${devicename}"
  friendly_name: "${friendly_name}"

esp8266:
  board: esp01_1m
  restore_from_flash: true

# Enable logging
logger:
  baud_rate: 0 # disable logging over uart
  level: WARN

# Enable Home Assistant API
api:

ota:
  password: !secret ota_pwd

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${devicename}-ap"
    password: !secret ap_pwd
captive_portal:

# Webserver for IP address-based control - for when the internet or HA is down.
web_server:
  port: 80
  auth:
    username: !secret web_server_un
    password: !secret web_server_pw
  include_internal: true # show state of hidden internal sensors, switches etc
  local: true # no internet required

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13 # push button
      mode: INPUT_PULLUP
      inverted: true
    name: "button"
    internal: true # dont export to HA frontend
    on_press:
      - light.toggle: component_sw

light:
  - platform: binary
    id: component_sw
    name: none # none = use friendly name
    output: output_relay
    restore_mode: ${restore_mode}

output:
  - id: output_relay
    platform: gpio
    pin: GPIO5 # relay

  - platform: esp8266_pwm # dimmer for status LED
    pin: GPIO4 # LED
    frequency: 3333Hz
    id: status_led
    max_power: 0.20 # on   brightness (0 = off) => (1 = full on)
    min_power: 0.00 # off  brightness (0 = off) => (1 = full on)
    inverted: true

script:
  - id: flash_wifi_error
    mode: restart
    then:
      - while:
          condition:
            lambda: |-
              return true;
          then:
            - output.turn_on: status_led
            - delay: 500ms
            - output.turn_off: status_led
            - delay: 500ms

interval:
  # Check wifi is connected.
  - interval: 2s
    then:
      - if:
          condition:
            wifi.connected:
          then:
            - script.stop: flash_wifi_error
            #            - output.turn_on: status_led       # Wifi connected, LED on.
            - output.turn_off: status_led # Wifi connected, LED off.
          else:
            - script.execute: flash_wifi_error
```

## Basic Configuration - as a switch entity

```yaml
substitutions:
  devicename: esphome-device-name
  friendly_name: My Friendly Name
  restore_mode: RESTORE_DEFAULT_OFF

esphome:
  name: "${devicename}"
  friendly_name: "${friendly_name}"

esp8266:
  board: esp01_1m
  restore_from_flash: true

# Enable logging
logger:
  baud_rate: 0 # disable logging over uart
  level: WARN

# Enable Home Assistant API
api:

ota:
  password: !secret ota_pwd

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${devicename}-ap"
    password: !secret ap_pwd
captive_portal:

# Webserver for IP address-based control - for when the internet or HA is down.
web_server:
  port: 80
  auth:
    username: !secret web_server_un
    password: !secret web_server_pw
  include_internal: true # show state of hidden internal sensors, switches etc
  local: true # no internet required

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13 # push button
      mode: INPUT_PULLUP
      inverted: true
    name: "button"
    internal: true # dont export to HA frontend
    on_press:
      - switch.toggle: component_sw

switch:
  - platform: gpio
    name: none # none = use friendly name
    pin: GPIO5 # relay
    id: component_sw
    restore_mode: ${restore_mode}

output:
  - platform: esp8266_pwm # dimmer for status LED
    pin: GPIO4 # LED
    frequency: 3333Hz
    id: status_led
    max_power: 0.20 # on   brightness (0 = off) => (1 = full on)
    min_power: 0.00 # off  brightness (0 = off) => (1 = full on)
    inverted: true

script:
  - id: flash_wifi_error
    mode: restart
    then:
      - while:
          condition:
            lambda: |-
              return true;
          then:
            - output.turn_on: status_led
            - delay: 500ms
            - output.turn_off: status_led
            - delay: 500ms

interval:
  # Check wifi is connected.
  - interval: 2s
    then:
      - if:
          condition:
            wifi.connected:
          then:
            - script.stop: flash_wifi_error
            #            - output.turn_on: status_led       # Wifi connected, LED on.
            - output.turn_off: status_led # Wifi connected, LED off.
          else:
            - script.execute: flash_wifi_error
```

## Basic Configuration - as a fan entity

```yaml
substitutions:
  devicename: esphome-device-name
  friendly_name: My Friendly Name
  restore_mode: RESTORE_DEFAULT_OFF

esphome:
  name: "${devicename}"
  friendly_name: "${friendly_name}"

esp8266:
  board: esp01_1m
  restore_from_flash: true

# Enable logging
logger:
  baud_rate: 0 # disable logging over uart
  level: WARN

# Enable Home Assistant API
api:

ota:
  password: !secret ota_pwd

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${devicename}-ap"
    password: !secret ap_pwd
captive_portal:

# Webserver for IP address-based control - for when the internet or HA is down.
web_server:
  port: 80
  auth:
    username: !secret web_server_un
    password: !secret web_server_pw
  include_internal: true # show state of hidden internal sensors, switches etc
  local: true # no internet required

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13 # push button
      mode: INPUT_PULLUP
      inverted: true
    name: "button"
    internal: true # dont export to HA frontend
    on_press:
      - fan.toggle: component_sw

fan:
  - platform: binary
    id: component_sw
    name: none # none = use friendly name
    output: output_relay
    restore_mode: ${restore_mode}

output:
  - id: output_relay
    platform: gpio
    pin: GPIO5 # relay

  - platform: esp8266_pwm # dimmer for status LED
    pin: GPIO4 # LED
    frequency: 3333Hz
    id: status_led
    max_power: 0.20 # on   brightness (0 = off) => (1 = full on)
    min_power: 0.00 # off  brightness (0 = off) => (1 = full on)
    inverted: true

script:
  - id: flash_wifi_error
    mode: restart
    then:
      - while:
          condition:
            lambda: |-
              return true;
          then:
            - output.turn_on: status_led
            - delay: 500ms
            - output.turn_off: status_led
            - delay: 500ms

interval:
  # Check wifi is connected.
  - interval: 2s
    then:
      - if:
          condition:
            wifi.connected:
          then:
            - script.stop: flash_wifi_error
            #            - output.turn_on: status_led       # Wifi connected, LED on.
            - output.turn_off: status_led # Wifi connected, LED off.
          else:
            - script.execute: flash_wifi_error
```
