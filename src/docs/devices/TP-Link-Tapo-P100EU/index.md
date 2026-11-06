---
title: TP-Link Tapo P100 (EU)
date-published: 2025-12-28
type: plug
standard: eu
board: rtl87xx
---

TP-Link Tapo P100 is a simple smart plug, without power monitoring.

## GPIO Pinout

| Pin  | Function                   |
|------|----------------------------|
| PA17 | Push Button                |
| PA08 | Relay                      |
| PA09 | Orange LED                 |
| PA10 | Green LED                  |

Note that the Orange and Green LEDs are actually a single bi-colour LED,
which lights Orange when PA10 is low and PA9 is high, and Green
when PA10 is high, and PA9 is low. No light is emitted if both GPIOs
are the same level.

## Device Configuration

```yaml title=TAPO_P100EU.yaml
rtl87xx:
  board: generic-rtl8720cf-2mb-992k

  # this non-standard framework was required at time of writing
  # for OTA support. Be careful about changing this, as you may
  # need to open the plug and flash via serial if you make a mistake
  framework:
    version: 0.0.0
    source: https://github.com/prokoma/libretiny#ambz2-fix
#    loglevel: VERBOSE

output:
  - platform: gpio
    id: relay_output
    pin: PA8

# NB: The LED is an orange/green bi-colour LED, which
# lights up depending on which terminal is positive w.r.t
# the other. if PA9 is high, and PA10 is low, the orange LED
# illuminates, while if PA10 is high and PA9 is low, the 
# green LED illuminates

  - platform: gpio
    id: output_orange_led
    pin: PA9

  - platform: gpio
    id: output_green_led
    pin: PA10

switch:
  - platform: output
    id: relay
    output: relay_output

binary_sensor:
  - platform: gpio
    id: button_
    pin:
      number: PA17 
      inverted: true
```

## Basic Configuration

```yaml
esphome:
  name: tapo_p100
  friendly_name: Tapo P100

packages:
  - !include Tapo_P100EU.yaml
  # common.yaml contains wifi, api, etc
  - !include include/common.yaml

# The below components had compile errors at the time of writing
web_server: !remove
captive_portal: !remove

switch:
  - id: !extend relay
    name: Relay
    on_turn_on:
      then:
        - light.turn_on: green_led
    on_turn_off:
      then:
        - light.turn_off: green_led

binary_sensor:
  - id: !extend button_
    on_press:
      then:
        - switch.toggle: relay 
light:
  - platform: status_led
    id: orange_led
    output: output_orange_led

  - platform: binary
    id: green_led
    output: output_green_led
```

## Advanced Configuration

In order to properly support the bi-colour LED, some lambda magic can
be employed. The problem is that if the Green LED is used to indicate
relay state, and the Status LED flashes, the result is that the Green LED
flashes off and on, rather than any Orange LED being visible. The approach
taken is to use a template output as an intermediary for the status output,
as this is the only way to add a trigger/lambda.

This results in the Orange LED taking priority over the Green LED, and
being visibly Orange when active.

```yaml
output:
# The orange LED can be used as a status LED at the same time
# as the green LED is used to indicate the state of the relay
# by turning off the green output whenever the status output
# turns on. Unfortunately, the only way to add a trigger to an
# output is via a template output's write_action, so this is
# what we do.

  - platform: gpio
    id: internal_output_orange_led
    pin: PA9

  - platform: template
    id: output_orange_led
    type: binary
    write_action:
      - lambda: |-
          bool green = id(green_led)->current_values.is_on();
          if (green) green ^= state;
          id(output_green_led)->set_state(green);
          id(internal_output_orange_led)->set_state(state);
```
