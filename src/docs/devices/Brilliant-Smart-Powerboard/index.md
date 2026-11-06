---
title: Brilliant Smart WiFi Powerboard 20691/05
date-published: 2020-03-18
type: plug
standard: au
board: esp8266
---

The Brilliant Smart Smart WiFi Powerboard 20691 is available in Australia and New Zealand. It has four individually
switched AC outlets (each has a status LED that do not seem to be individually controllable. There are also four USB
power/charge ports, all switchable but not individually. There is a button and blue and red controllable leds.

## GPIO Pinout

| Pin    | Function                     |
| ------ | ---------------------------- |
| GPIO0  | Led1 (Inverted: true)        |
| GPIO14 | Push Button (Inverted: true) |
| GPIO13 | Red LED (Inverted: true)     |
| GPIO01 | None                         |
| GPIO02 | None                         |
| GPIO03 | Led2 (Inverted: true)        |
| GPIO04 | Relay1 (Inverted: true)      |
| GPIO05 | Button1                      |
| GPIO09 | None                         |
| GPIO10 | None                         |
| GPIO12 | Relay3 (Inverted: true)      |
| GPIO13 | Relay2 (Inverted: true)      |
| GPIO14 | Relay4 (Inverted: true)      |
| GPIO15 | None                         |
| GPIO16 | Relay5                       |

## Getting up and running

I flashed this device with tuya-convert, which worked straight off. I originally flashed with tasmota, then upgraded to
esphome :)

## Code

This yaml is borrowed from the author of the Arlec PB89HA Power Board page. The multi click stuff for the button is
optional, but can be useful if you are at the powerboard.

The blue led is used as a status led and flashes as the wifi is connecting. The red led is switchable and could be used
for some sort of status indicator.

```yaml
esphome:
  name: multibox

esp8266:
  board: esp01_1m

wifi:
  ssid: "**"
  password: "**"
  domain: ".**"

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "Multibox Fallback Hotspot"
    password: "**"

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: "**"

sensor:
  - platform: uptime
    name: Multibox Uptime

  - platform: wifi_signal
    name: Multibox Signal
    update_interval: 300s

switch:
  - platform: gpio
    pin:
      number: GPIO04
      inverted: yes
    name: "Mulltibox - A"
    id: relay_a
    restore_mode: always off
    icon: mdi:power-socket-au

  - platform: gpio
    pin:
      number: GPIO13
      inverted: yes
    name: "Mulltibox - B"
    id: relay_b
    restore_mode: always off
    icon: mdi:power-socket-au

  - platform: gpio
    pin:
      number: GPIO12
      inverted: yes
    name: "Mulltibox - C"
    id: relay_c
    restore_mode: always off
    icon: mdi:power-socket-au

  - platform: gpio
    pin:
      number: GPIO14
      inverted: yes
    name: "Mulltibox - D"
    id: relay_d
    restore_mode: always off
    icon: mdi:power-socket-au

  - platform: gpio
    pin:
      number: GPIO16
      inverted: no
    name: "Mulltibox - USB"
    id: relay_u
    restore_mode: always off
    icon: mdi:usb

status_led:
  pin:
    number: GPIO0
    inverted: True

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO5
      inverted: True
    name: Multibox button
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
            }
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
            }
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
            }

light:
  - platform: binary
    name: "Multibox Red LED"
    output: output_component1

output:
  - platform: gpio
    pin:
      number: GPIO3
      inverted: yes
    id: output_component1
```
