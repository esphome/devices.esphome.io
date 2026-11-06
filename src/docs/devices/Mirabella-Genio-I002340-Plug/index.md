---
title: Mirabella Genio I002340 Power Board with USB
date-published: 2020-01-19
type: plug
standard: au
board: esp8266
---

## GPIO Pinout

| Pin    | Function                |
| ------ | ----------------------- |
| GPIO0  | LED (Inverted: true)    |
| GPIO13 | Button (Inverted: true) |
| GPIO04 | Relay 1                 |
| GPIO05 | Relay USB               |
| GPIO12 | Relay 3                 |
| GPIO14 | Relay 4                 |
| GPIO15 | Relay 2                 |

## Basic Configuration

```yaml
substitutions:
  # Change the disp_name to something you want
  dnum: "1"
  dname: genio_pb4p1u
  sname: genpb
  location: spare
  full_name: ${dname}_${location}_${dnum}
  short_name: ${sname}_${location}_${dnum}

esphome:
  name: ${full_name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

captive_portal:

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

ota:
  password: !secret api_pass

web_server:
  port: 80

# Enable logging
logger:
  #level: VERBOSE

globals:
  - id: set_on
    type: "bool"
    restore_value: no
    initial_value: "1"

binary_sensor:
  - platform: gpio
    name: ${short_name}
    pin:
      number: GPIO13
      inverted: True
    id: button1
    on_multi_click:
      - timing:
          - ON for at most 0.5s
          - OFF for at least 0.5s
        then:
          lambda: |-
            if ( id(set_on) ) {
              if (! id(relay1).state  ) {
                id(relay1).turn_on();
              } else if ( ! id(relay2).state ) {
                id(relay2).turn_on();
              } else if ( ! id(relay3).state ) {
                id(relay3).turn_on();
              } else if ( ! id(relay4).state ) {
                id(relay4).turn_on();
                id(set_on) = 0;
              } else {
                id(relay1).turn_off();
                id(relay2).turn_off();
                id(relay3).turn_off();
                id(relay4).turn_off();
              }
            } else {
              if ( id(relay1).state  ) {
                id(relay1).turn_off();
              } else if (  id(relay2).state ) {
                id(relay2).turn_off();
              } else if (  id(relay3).state ) {
                id(relay3).turn_off();
              } else if (  id(relay4).state ) {
                id(relay4).turn_off();
                id(set_on) = 1;
              } else {
                id(relay1).turn_on();
                id(relay2).turn_on();
                id(relay3).turn_on();
                id(relay4).turn_on();

              }
            }
      - timing:
          - ON for at most 0.5s
          - OFF for at most 0.5s
          - ON for at most 0.5s
          - OFF for at least 0.2s
        then:
          - switch.toggle: usb
      - timing:
          - ON for at least 0.5s
          - OFF for at least 0.2s
        then:
          lambda: |-
            if (id(relay1).state ||
            id(relay2).state ||
            id(relay3).state ||
            id(relay4).state ) {
              id(relay1).turn_off();
              id(relay2).turn_off();
              id(relay3).turn_off();
              id(relay4).turn_off();
            } else {
              id(relay1).turn_on();
              id(relay2).turn_on();
              id(relay3).turn_on();
              id(relay4).turn_on();
            }

switch:
  - platform: gpio
    name: ${short_name}.1
    pin: GPIO4
    id: relay1
  - platform: gpio
    name: ${short_name}.2
    pin: GPIO15
    id: relay2
  - platform: gpio
    name: ${short_name}.3
    pin: GPIO12
    id: relay3
  - platform: gpio
    name: ${short_name}.4
    pin: GPIO14
    id: relay4
  - platform: gpio
    name: ${short_name}.usb
    pin: GPIO5
    id: usb

status_led:
  pin:
    number: GPIO0
    inverted: yes
```

## Button

- The setup will turn on plugs 1 to 4 with each short press, then once all plugs are on, turn off plugs 1 to 4 with each
  short press.
- A long press will toggle all plugs on or off.
- A double press will toggle the state of the usb ports.

## Where

| Location                                                                                           | Price |
| -------------------------------------------------------------------------------------------------- | ----- |
| [Kmart](https://www.kmart.com.au/product/mirabella-genio-wi-fi-powerboard-with-usb-ports/2736803I) | $49   |
| [Costco](https://costco.com.au)                                                                            | $39   |
