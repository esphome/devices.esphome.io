---
title: Arlec PB89HA Power Board
date-published: 2020-01-04
type: plug
standard: au
board: esp8266
---

The Arlec PB89HA power board is part of the [Grid Connect ecosystem](https://grid-connect.com.au/) and is sold at
Bunnings in Australia and New Zealand.

It has five sockets: four individually controllable, plus one which is permanently powered (marked "ALWAYS ON").

## GPIO Pinout

| Pin    | Function                |
| ------ | ----------------------- |
| GPIO1  | LED (Inverted: true)    |
| GPIO3  | Button (Inverted: true) |
| GPIO04 | Relay 2                 |
| GPIO05 | Relay 1                 |
| GPIO12 | Relay 4                 |
| GPIO13 | Relay 3                 |

## Getting it up and running

### Tuya Convert

This power strip is a Tuya device, so if you don't want to open it up and flash it directly, you can
[use tuya-convert to initially get ESPHome onto it](/devices/tuya-convert). After that, you can use ESPHome's OTA
functionality to make any further changes.

- Put the power strip into "smartconfig" / "autoconfig" / pairing mode by holding the button for about 5 seconds.
- The status LED (in the button) blinks rapidly to confirm that it has entered pairing mode.

## Basic Configuration

```yaml
# Basic Config
substitutions:
  device_name: "arlec_PB89HA_1"
  name: "ARLEC PB89HA"

esphome:
  name: ${device_name}
  comment: ${name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

logger:
  # Important! The status LED and button are on the Pins used by UART0,
  # so if you want to use the serial port, you can set it to UART1.
  hardware_uart: UART1

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: "ota_password"

status_led:
  pin:
    number: GPIO1
    inverted: True

sensor:
  - platform: uptime
    name: ${name} Uptime

  - platform: wifi_signal
    name: ${name} Signal
    update_interval: 300s

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO3
      inverted: True
    name: ${name} button

switch:
  - platform: gpio
    pin: GPIO05
    name: "${name} - A"
    id: relay_a
    restore_mode: always off
    icon: mdi:power-socket-au

  - platform: gpio
    pin: GPIO04
    name: "${name} - B"
    id: relay_b
    restore_mode: always off
    icon: mdi:power-socket-au

  - platform: gpio
    pin: GPIO13
    name: "${name} - C"
    id: relay_c
    restore_mode: always off
    icon: mdi:power-socket-au

  - platform: gpio
    pin: GPIO12
    name: "${name} - D"
    id: relay_d
    restore_mode: always off
    icon: mdi:power-socket-au
```

## Advanced config: on-device button automations

To use one of these sample on-device automations, replace the whole `binary_sensor:` section from the basic
configuration (above) with one from below. Note that if you want to also expose the button to Home Assistant, you can
remove the `internal: True` line.

### Toggle all sockets

If any socket is turned on, pressing the button will turn all sockets off. Otherwise, pressing the button will turn all
sockets on.

```yaml
binary_sensor:
  - platform: gpio
    pin:
      number: GPIO3
      inverted: True
    name: ${name} button
    internal: True
    on_press:
      then:
        if:
          condition:
            lambda: return id(relay_a).state || id(relay_b).state || id(relay_c).state || id(relay_d).state;
          then:
            # At least one socket is on.  Turn off all sockets.
            - switch.turn_off: relay_a
            - switch.turn_off: relay_b
            - switch.turn_off: relay_c
            - switch.turn_off: relay_d
          else:
            # No sockets are on.  Turn on all sockets.
            - switch.turn_on: relay_a
            - switch.turn_on: relay_b
            - switch.turn_on: relay_c
            - switch.turn_on: relay_d
```

### Toggle sockets with single or double click

A single click toggles the first socket; a double-click toggles the second socket.

```yaml
binary_sensor:
  - platform: gpio
    pin:
      number: GPIO3
      inverted: True
    name: ${name} button
    internal: True
    on_multi_click:
      # Support a single or double click to switch on each relay
      - timing:
          # Single click toggles the first relay
          - ON for at most 1s
          - OFF for at least 0.5s
        then:
          - switch.toggle: relay_a

      - timing:
          # Double click toggles the second relay
          - ON for at most 1s
          - OFF for at most 1s
          - ON for at most 1s
          - OFF for at least 0.2s
        then:
          - switch.toggle: relay_b
```

### Advanced (cycle + toggle all)

An alternate switching behavour, where:

- A short press turns on the next socket that is off (from 1 to 4)
- Once all are on, a short press will turn all sockets off
- A double press will turn the next socket off (from 1 to 4)
- Once all are off, a double press will turn all on
- A long press with turn all off if any are on, or will turn all on

```yaml
binary_sensor:
  - platform: gpio
    name: ${short_name}
    pin:
      number: GPIO3
      inverted: True
    id: button1
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
```
