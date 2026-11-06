---
title: Sonoff Dual R1
date-published: 2023-04-13
type: relay
standard: global
board: esp8266
---

This is a DIY solution, and you will need to have some knowledge of
electrical wiring and enough capabilities to do this work safely.

The goal is to replace the light switch with one that
can be controlled by home assistant, whilst retaining the ease of use of
a standard light that would also continue to work if the network went
down, or Home Assistant failed etc.

Use a _retractive_ style light switch. That is one that is spring
loaded and so always returns to the ``off`` position. It's effectively
a push button, that looks like a light switch.

We will be using GPIO4 and GPIO14 for the two retractive switches,
again they will both short to 0V when the switch is clicked.

![Product Image](./sonoff_dual_r2.jpg "Product Image")

The R1 version of the Dual controls the relays via the UART:

```yaml
esp8266:
  board: esp01_1m

logger:
  baud_rate: 0

uart:
  tx_pin: GPIO01
  rx_pin: GPIO03
  baud_rate: 19200

switch:
  - platform: template
    id: relay_1
    turn_on_action:
      if:
        condition:
          switch.is_off: relay_2
        then:
          - uart.write: [0xA0, 0x04, 0x01, 0xA1]
        else:
          - uart.write: [0xA0, 0x04, 0x03, 0xA1]
    turn_off_action:
      if:
        condition:
          switch.is_off: relay_2
        then:
          - uart.write: [0xA0, 0x04, 0x00, 0xA1]
        else:
          - uart.write: [0xA0, 0x04, 0x02, 0xA1]
    optimistic: true

  - platform: template
    id: relay_2
    turn_on_action:
      if:
        condition:
          switch.is_off: relay_1
        then:
          - uart.write: [0xA0, 0x04, 0x02, 0xA1]
        else:
          - uart.write: [0xA0, 0x04, 0x03, 0xA1]
    turn_off_action:
      if:
        condition:
          switch.is_off: relay_1
        then:
          - uart.write: [0xA0, 0x04, 0x00, 0xA1]
        else:
          - uart.write: [0xA0, 0x04, 0x01, 0xA1]
    optimistic: true

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO4
      mode:
        input: true
        pullup: true
      inverted: true
    id: button_1
    on_press:
      then:
        - light.toggle: light_1

  - platform: gpio
    pin:
      number: GPIO14
      mode:
        input: true
        pullup: true
      inverted: true
    id: button_2
    on_press:
      then:
        - light.toggle: light_2

  - platform: status
    name: "Dual LS Status"

status_led:
  pin:
    number: GPIO13
    inverted: yes

output:
  - platform: template
    type: binary
    id: out_1
    write_action:
      if:
        condition:
          light.is_on: light_1
        then:
          - switch.turn_on: relay_1
        else:
          - switch.turn_off: relay_1

  - platform: template
    type: binary
    id: out_2
    write_action:
      if:
        condition:
          light.is_on: light_2
        then:
          - switch.turn_on: relay_2
        else:
          - switch.turn_off: relay_2

light:
  - platform: binary
    name: "Dual L1"
    id: light_1
    output: out_1

  - platform: binary
    name: "Dual L2"
    id: light_2
    output: out_2
```

The logger baud_rate: 0 is required to make sure the logged does not
send any data over the UART or it would mess with the relays.
