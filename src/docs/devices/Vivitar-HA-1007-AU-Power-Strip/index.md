---
title: Vivitar HA-1007-AU Power Strip
date-published: 2021-12-01
type: plug
standard: au
board: esp8266
---
The Vivitar HA-1007-AU Power Strip has four individually switched AC outlets (each has a status LED that do not seem to
be individually controllable.
There are also four USB power/charge ports, all switchable but not individually. There is a button and blue and red
controllable leds.

## GPIO Pinout

| Pin     | Function                           |
|---------|------------------------------------|
| GPIO0   | Blue LED (Inverted: true)          |
| GPIO01  | Push Button (Inverted: true)       |
| GPIO02  | None                               |
| GPIO03  | Red LED (Inverted: true)           |
| GPIO04  | Relay1 - Socket A (Inverted: true) |
| GPIO05  | Led2i - Master (Inverted: true)    |
| GPIO09  | None                               |
| GPIO10  | None                               |
| GPIO12  | Relay3 - Socket C (Inverted: true) |
| GPIO13  | Relay2 - Socket B (Inverted: true) |
| GPIO14  | Relay4 - Socket D (Inverted: true) |
| GPIO15  | None                               |
| GPIO16  | Relay5 - USB                       |

## Getting up and running

The device can be flashed using tuya-convert.

## Code

This yaml is borrowed from the author of the Arlec PB89HA Power Board page. The multi click stuff for the button is
optional, but can be useful if you are at the powerboard.

The blue led is used as a status led and flashes as the wifi is connecting.

The red led is used as an indication that the master switch is on (none of the sockets actually get any power if this is
off)

If the "master" switch is off, it will turn off all the other switches so there's no confusion from the state of the
LED's per individiual socket

Turning on any individual socket should also turn on the master automatically

```yaml
substitutions:
  hostname: vivitar_ha1007au_power_strip
  display_name: Vivitar Power Strip
  # Icon
  main_icon: "power-socket-au"
  # Default Relay State
  # Aka: `restore_mode` in documentation
  # Options: `RESTORE_DEFAULT_OFF`, `RESTORE_DEFAULT_ON`, `ALWAYS_ON` & `ALWAYS_OFF`
  default_state: "RESTORE_DEFAULT_OFF"

esphome:
  name: $hostname

esp8266:
  board: esp01_1m

wifi:
  ssid: "****"
  password: "****"
  domain: "****"

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${display_name} Fallback Hotspot"
    password: "****"

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: "****"
  
sensor:
  - platform: wifi_signal
    name: "${display_name} WiFi Signal"
    update_interval: 5min

  - platform: uptime
    id: uptime_sec
    name: "${display_name} Uptime"
    update_interval: 5min

switch:
  - platform: gpio
    pin:
      number: GPIO04
      inverted: yes
    name: "Power Board - Socket A"
    id: relay_a
    restore_mode: "${default_state}"
    icon: "mdi:${main_icon}"
    on_turn_on:
       - switch.turn_on: relay_m

  - platform: gpio
    pin:
      number: GPIO13
      inverted: yes
    name: "Power Board - Socket B"
    id: relay_b
    restore_mode: "${default_state}"
    icon: "mdi:${main_icon}"
    on_turn_on:
       - switch.turn_on: relay_m

  - platform: gpio
    pin:
      number: GPIO12
      inverted: yes
    name: "Power Board - Socket C"
    id: relay_c
    restore_mode: "${default_state}"
    icon: "mdi:${main_icon}"
    on_turn_on:
       - switch.turn_on: relay_m

  - platform: gpio
    pin:
      number: GPIO14
      inverted: yes
    name: "Power Board - Socket D"
    id: relay_d
    restore_mode: "${default_state}"
    icon: "mdi:${main_icon}"
    on_turn_on:
       - switch.turn_on: relay_m

  - platform: gpio
    pin:
      number: GPIO16
      inverted: no
    name: "Power Board - USB"
    id: relay_u
    restore_mode: "${default_state}"
    icon: mdi:usb

  - platform: gpio
    pin:
      number: GPIO5
      inverted: yes
    name: "Power Board - Master"
    id: relay_m
    restore_mode: "${default_state}"
    icon: "mdi:power"
    on_turn_on:
      - light.turn_on:
          id: power_led
          brightness: 100%
          transition_length: 0s
    on_turn_off:
       - light.turn_off:
            id: power_led
            transition_length: 0s
       - switch.turn_off: relay_a
       - switch.turn_off: relay_b
       - switch.turn_off: relay_c
       - switch.turn_off: relay_d

status_led:
  pin:
    number: GPIO0
    inverted: True

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO1
      inverted: True
    name: "Power Board Button"
    internal: true
    on_multi_click:
    - timing:
        - ON for at most 0.5s
        - OFF for at least 0.5s
      then:
        lambda: |-
          if (! id(relay_a).state  ) {
            id(relay_a).turn_on();
          } else if ( ! id(relay_b).state ) {
            id(relay_b).turn_on();
          } else if ( ! id(relay_c).state ) {
            id(relay_c).turn_on();
          } else if ( ! id(relay_d).state ) {
            id(relay_d).turn_on();
          } else {
            id(relay_a).turn_off();
            id(relay_b).turn_off();
            id(relay_c).turn_off();
            id(relay_d).turn_off();
          };
    - timing:
        - ON for at most 0.5s
        - OFF for at most 0.5s
        - ON for at most 0.5s
        - OFF for at least 0.2s
      then:
        lambda: |-
          if ( id(relay_a).state  ) {
            id(relay_a).turn_off();
          } else if (  id(relay_b).state ) {
            id(relay_b).turn_off();
          } else if (  id(relay_c).state ) {
            id(relay_c).turn_off();
          } else if (  id(relay_d).state ) {
            id(relay_d).turn_off();
          } else {
            id(relay_a).turn_on();
            id(relay_b).turn_on();
            id(relay_c).turn_on();
            id(relay_d).turn_on();
          };
    - timing:
        - ON for at least 0.5s
        - OFF for at least 0.2s
      then:
        lambda: |-
          if (id(relay_a).state ||
          id(relay_b).state ||
          id(relay_c).state ||
          id(relay_d).state ) {
            id(relay_a).turn_off();
            id(relay_b).turn_off();
            id(relay_c).turn_off();
            id(relay_d).turn_off();
          } else {
            id(relay_a).turn_on();
            id(relay_b).turn_on();
            id(relay_c).turn_on();
            id(relay_d).turn_on();
          };

light:
  - platform: binary
    name: "Power Board Red LED"
    output: state_led
    id: power_led

output:
  - platform: gpio
    pin:
      number: GPIO3
      inverted: yes
    id: state_led
```
