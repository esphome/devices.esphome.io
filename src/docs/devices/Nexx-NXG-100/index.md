---
title: Nexx NXG-100
Model: NXG-100
date-published: 2020-07-26
type: relay
standard: us
board: esp8266
---

## Product

![alt text](./NXG-100_with_app_Black_320x192.jpg "Product Image")

[https://getnexx.com/pages/support](https://getnexx.com/pages/support)

Case has a close fit, but a knife edge near the corner can be used to open the case. Standard serial header pattern
present on the board as shown:

![alt text](./NXG-100_pcb.jpg "PCB Image")

## GPIO Pinout

| Pin    | Function           |
| ------ | ------------------ |
| GPIO00 | Reset BUTTON       |
| GPIO01 | TX                 |
| GPIO03 | RX                 |
| GPIO04 | Red status LED     |
| GPIO12 | Door Relay         |
| GPIO13 | Green status LED   |
| GPIO14 | Door Closed Sensor |

## Basic Config

Pressing the reset button .5-2 seconds will pulse the door relay.
On each transition of the door sensor, the green LED will blink.

```yaml
esphome:
  name: nxg100

esp8266:
  board: esp01_1m

ota:

wifi:
  ssid: <SSID>
  password: <Password>

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "Nxg100 Fallback Hotspot"
    password: <FB Password>

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:

web_server:

status_led:
  pin:
    number: GPIO4
    inverted: false

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    internal: true
    name: "Reset Button"
    on_click:
      min_length: 500ms
      max_length: 2000ms
      then:
        - switch.turn_on: greenLED
        - if:
            condition:
              switch.is_on: relay
            then:
              # just in case someone manually changed it
              - switch.turn_off: relay
              - delay: 0.5s
        # Turn the OPEN switch on briefly
        - switch.turn_on: relay
        - delay: 0.2s
        - switch.turn_off: relay
        - switch.turn_off: greenLED

  - platform: gpio
    pin:
      number: GPIO14
      mode: INPUT_PULLUP
      inverted: True
    name: "Door Closed"
    id: "doorclosed"
    on_press:
      - switch.turn_on: greenLED
      - delay: 0.1s
      - switch.turn_off: greenLED
    on_release:
      - switch.turn_on: greenLED
      - delay: 0.1s
      - switch.turn_off: greenLED

  - platform: status
    name: "Status"
    internal: true

sensor:
  - platform: wifi_signal
    name: "WiFi Signal"
    update_interval: 60s

switch:
  - platform: gpio
    name: "Door Relay"
    pin: GPIO12
    id: "relay"
    internal: true

  - platform: gpio
    name: "Green LED"
    pin: GPIO13
    id: "greenLED"
    inverted: true
    internal: true

  - platform: restart
    name: "Restart"

cover:
  - platform: template
    name: "Garage Door"
    open_action:
      - switch.turn_on: greenLED
      # Turn the OPEN switch on briefly
      - switch.turn_on: relay
      - delay: 0.2s
      - switch.turn_off: relay
      - switch.turn_off: greenLED
    close_action:
      - switch.turn_on: greenLED
      # Turn the OPEN switch on briefly
      - switch.turn_on: relay
      - delay: 0.2s
      - switch.turn_off: relay
      - switch.turn_off: greenLED
    optimistic: true
    assumed_state: true
```

## Delux Config

This adds sensor checking, so that the closed button does nothing when the door is already closed.
Similarly if the door is open, the open button does nothing.

```yaml
esphome:
  name: nxg100

esp8266:
  board: esp01_1m

ota:

wifi:
  ssid: <SSID>
  password: <Password>

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "Nxg100 Fallback Hotspot"
    password: <FB Password>

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:

web_server:

status_led:
  pin:
    number: GPIO4
    inverted: false

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    internal: true
    name: "Reset Button"
    on_click:
      min_length: 500ms
      max_length: 2000ms
      then:
        - switch.turn_on: greenLED
        - if:
            condition:
              switch.is_on: relay
            then:
              # just in case someone manually changed it
              - switch.turn_off: relay
              - delay: 0.5s
        # Turn the OPEN switch on briefly
        - switch.turn_on: relay
        - delay: 0.2s
        - switch.turn_off: relay
        - switch.turn_off: greenLED

  - platform: gpio
    pin:
      number: GPIO14
      mode: INPUT_PULLUP
      inverted: True
    name: "Door Closed"
    id: "doorclosed"
    on_press:
      - switch.turn_on: greenLED
      - delay: 0.1s
      - switch.turn_off: greenLED
    on_release:
      - switch.turn_on: greenLED
      - delay: 0.1s
      - switch.turn_off: greenLED

  - platform: status
    name: "Status"
    internal: true

sensor:
  - platform: wifi_signal
    name: "WiFi Signal"
    update_interval: 60s

switch:
  - platform: gpio
    name: "Door Relay"
    pin: GPIO12
    id: "relay"
    internal: true

  - platform: gpio
    name: "Green LED"
    pin: GPIO13
    id: "greenLED"
    inverted: true
    internal: true

  - platform: restart
    name: "Restart"

cover:
  - platform: template
    name: "Garage Door"
    open_action:
      - if:
          condition:
            binary_sensor.is_off: doorclosed
          then:
            - logger.log: "Door is already open"
          else:
            - switch.turn_on: greenLED
            - if:
                condition:
                  switch.is_on: relay
                then:
                  # just in case someone manually changed it
                  - switch.turn_off: relay
                  - delay: 0.5s
            # Turn the OPEN switch on briefly
            - switch.turn_on: relay
            - delay: 0.2s
            - switch.turn_off: relay
            - switch.turn_off: greenLED
    close_action:
      - if:
          condition:
            binary_sensor.is_on: doorclosed
          then:
            - logger.log: "Door is already closed"
          else:
            - switch.turn_on: greenLED
            - if:
                condition:
                  switch.is_on: relay
                then:
                  # just in case someone manually changed it
                  - switch.turn_off: relay
                  - delay: 0.5s
            # Turn the OPEN switch on briefly
            - switch.turn_on: relay
            - delay: 0.2s
            - switch.turn_off: relay
            - switch.turn_off: greenLED
    optimistic: true
    assumed_state: true
```
