---
title: Sonoff THR320D
date-published: 2023-01-07
type: relay
standard: global
board: esp32
difficulty: 3
---

## Bootloop Workaround

Some people experience a boot loop when trying to flash esphome directly.
Here's a workaround:
[https://community.home-assistant.io/t/bootloop-workaround-for-flashing-sonoff-th-elite-thr316d-thr320d-and-maybe-others-with-esphome-for-the-first-time/498868](https://community.home-assistant.io/t/bootloop-workaround-for-flashing-sonoff-th-elite-thr316d-thr320d-and-maybe-others-with-esphome-for-the-first-time/498868)

## GPIO Pinout

(Source: [https://templates.blakadder.com/sonoff_THR320D.html](https://templates.blakadder.com/sonoff_THR320D.html))
Some GPIO are active-low, meaning they're "on" when they're pulled low. In ESPHome that's often called "inverted".
The relays GPIO are active-high.

The main relay is bistable/latching, meaning a pulse on pin 1 switches the
relay ON, and a pulse on pin 2 switches the relay OFF.
These two pins should never be active at the same time, or the device will become dangerously hot in a few minutes.

Note that until March 2024 there was an error in this page causing a safety issue:
The code was considering the relays GPIO as being active-low, when they are actually active-high. So the two main relay
pins were stay simultaneously active most of the time, making the device dangerously hot.
If you copied the old version of the code from here, please remove the `inverted: True` line for the relays and update
your devices as soon as possible.

| Pin    | Function                                        |
| ------ | ----------------------------------------------- |
| GPIO0  | Push Button (HIGH = off, LOW = on)              |
| GPIO4  | Small Relay (Dry Contact)                       |
| GPIO5  | Display (TM1621) Data                           |
| GPIO13 | Right LED (Green)                               |
| GPIO15 | Middle LED (Blue)                               |
| GPIO16 | Left LED (Red)                                  |
| GPIO17 | Display (TM1621) CS                             |
| GPIO18 | Display (TM1621) Write                          |
| GPIO19 | Large/Main Relay pin 1, pull high for relay ON  |
| GPIO22 | Large/Main Relay pin 2, pull high for relay OFF |
| GPIO23 | Display (TM1621) Read                           |
| GPIO25 | Pin 2 of the RJ-9 connector                     |
| GPIO27 | Pin 1 of the RJ-9 connector                     |

## Basic Configuration

Internal momentary switches are used to pulse the ON/OFF pins on the main relay.
A template switch is used to hide the complexity of controlling the two internal
momentary switches.

One shortcoming here is we don't have any way to confirm the true state of the
main relay, and so there is a possibility that our template switch could get out
of sync with the true state of the relay.

```yaml
substitutions:
  name: "sonoffth320d"
  friendly_name: "Sonoff THR320D"
  project_name: "thermostats"
  project_version: "1.0"
  light_restore_mode: RESTORE_DEFAULT_OFF

esphome:
  name: "${name}"
  # supply the external temp/hum sensor with 3v power by pulling this GPIO high
  on_boot:
    - priority: 90
      then:
        - switch.turn_on: ${name}_sensor_power

esp32:
  variant: esp32

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: "ota-password"

logger:
  baud_rate: 0

web_server:
  port: 80

wifi:
  ssid: "SSID"
  password: "PASSWORD"
  power_save_mode: none

captive_portal:

# This will take care of the display automatically.
# You don't need to tell it to print something to the display manually.
# It'll update every 60s or so.
display:
  platform: tm1621
  id: tm1621_display
  cs_pin: GPIO17
  data_pin: GPIO5
  read_pin: GPIO23
  write_pin: GPIO18
  lambda: |-
    it.printf(0, "%.1f", id(${name}_temp).state);
    it.display_celsius(true);
    it.printf(1, "%.1f", id(${name}_humi).state);
    it.display_humidity(true);

binary_sensor:
  # single main button that also puts device into flash mode when held on boot
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    name: "${friendly_name} Button"
    on_press:
      then:
        - switch.toggle: mainRelayVirt
  - platform: status
    name: "${friendly_name} Status"

switch:
  # virtual switch to represent the main relay
  # as far as I know, we have no way to confirm the real state
  - platform: template
    id: mainRelayVirt
    name: "Main Relay"
    turn_on_action:
      - switch.turn_on: mainRelayOn
      - switch.turn_on: ${name}_onoff_led
    turn_off_action:
      - switch.turn_on: mainRelayOff
      - switch.turn_off: ${name}_onoff_led
    assumed_state: True
    optimistic: True
    restore_state: True
  # internal momentary switch for main relay ON
  - platform: gpio
    id: mainRelayOn
    internal: True
    pin:
      number: GPIO19
    on_turn_on:
      - delay: 500ms
      - switch.turn_off: mainRelayOn
    restore_mode: ALWAYS_OFF
  # internal momentary switch for main relay OFF
  - platform: gpio
    id: mainRelayOff
    internal: True
    pin:
      number: GPIO22
    on_turn_on:
      - delay: 500ms
      - switch.turn_off: mainRelayOff
    restore_mode: ALWAYS_OFF
  # dry contact relay switch
  - platform: gpio
    id: dryContRelay
    name: "Dry Contact Relay"
    pin:
      number: GPIO4
    on_turn_on:
      - switch.turn_on: ${name}_idk_led
    on_turn_off:
      - switch.turn_off: ${name}_idk_led
  # Rightmost (green) LED; use as dry contact indicator
  - platform: gpio
    id: ${name}_idk_led
    pin:
      number: GPIO13
      inverted: true
  # Leftmost (red) LED that's used to indicate the relay being on/off
  - platform: gpio
    id: ${name}_onoff_led
    pin:
      number: GPIO16
      inverted: true
  # This is needed to power the external temp/humidity sensor.
  # It receives 3v from this pin, which is pulled up on boot.
  # TODO: This should probably be an internal switch.
  - platform: gpio
    pin: GPIO27
    id: ${name}_sensor_power
    restore_mode: ALWAYS_ON

light:
  # The middle (blue) LED is used as wifi status indicator.
  - platform: status_led
    name: "${friendly_name} State"
    pin:
      number: GPIO15
      inverted: true

sensor:
  # You need to specify here that it's an SI7021 sensor.
  # This assumes you're using their device "Sonoff THS01"
  - platform: dht
    pin: GPIO25
    model: SI7021
    temperature:
      name: "${friendly_name} Temperature"
      id: ${name}_temp
    humidity:
      name: "${friendly_name} Humidity"
      id: ${name}_humi
    update_interval: 60s

climate:
  - platform: thermostat
    name: "${friendly_name} Climate"
    sensor: ${name}_temp
    default_preset: Home
    preset:
      - name: Home
        default_target_temperature_low: 21 °C
        mode: heat
    min_heating_off_time: 300s
    min_heating_run_time: 300s
    min_idle_time: 30s
    heat_action:
      - switch.turn_on: mainRelayVirt
    idle_action:
      - switch.turn_off: mainRelayVirt
    heat_deadband: 0.5 # how many degrees can we go under the temp before starting to heat
    heat_overrun: 0.5 # how many degrees can we go over the temp before stopping

text_sensor:
  - platform: wifi_info
    ip_address:
      name: "${friendly_name} IP Address"
      disabled_by_default: true
```

Here is an alternative configuration, set up to control a geyser, with an
ATTiny85 acting as a DS18B20 1-wire probe, using OneWireHub. The intent is
to use excess solar power to heat the geyser in Boost mode, revert to Eco
overnight, and default to Home in case there is no external controller.

```yaml
substitutions:
  name: "geyser"
  friendly_name: "Geyser Thermostat"
  project_name: "thermostats"
  project_version: "1.0"

packages:
  # contains basic setup, WiFi, etc
  common: !include .common.yaml

esphome:
  name: "${name}"
  friendly_name: "${friendly_name}"
  on_boot:
    - priority: 90
      then:
        # supply the external sensor with 3v power by pulling this GPIO high
        - output.turn_on: sensor_power
        # make sure the relay is in a known state at startup
        - switch.turn_off: main_relay
        # Default to running the geyser in Home mode
        - climate.control:
            id: geyser_climate
            preset: "Home"

esp32:
  variant: esp32

logger:
  # It's in the ceiling, nobody is listening to the UART
  baud_rate: 0
  level: DEBUG

web_server:
  port: 80

captive_portal:

binary_sensor:
  # single main button that also puts device into flash mode when held on boot
  # For someone in the ceiling, this can be used to turn the climate control
  # into OFF or HEAT modes. It does NOT directly control the relay.
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    id: button0
    filters:
      - delayed_on_off: 50ms
    on_press:
      then:
        - if:
            condition:
              lambda: |-
                return id(geyser_climate).mode != CLIMATE_MODE_OFF;
            then:
              - logger.log: "Button deactivates climate control"
              - climate.control:
                  id: geyser_climate
                  mode: "OFF"
            else:
              - logger.log: "Button activates climate control"
              - climate.control:
                  id: geyser_climate
                  mode: "HEAT"

switch:
  # template switch to represent the main relay
  # this is synchronised with the RED LED
  # Note: this is controlled by the climate entity, and is not exposed
  # for direct manipulation, otherwise it could be left on permanently
  - platform: template
    id: main_relay
    turn_on_action:
      - button.press: main_relay_on
      - light.turn_on: onoff_led
    turn_off_action:
      - button.press: main_relay_off
      - light.turn_off: onoff_led
    assumed_state: True
    optimistic: True
    restore_state: True

output:
  # Ideally, these two relay GPIOs should be interlocked to prevent
  # simultaneous operation. ESPHome currently does not support
  # interlocks at an output: level, or even at a button: level
  # BE CAREFUL!
  - platform: gpio
    id: main_relay_on_output
    pin:
      number: GPIO19

  - platform: gpio
    id: main_relay_off_output
    pin:
      number: GPIO22

  - platform: ledc
    id: red_led_output
    pin:
      number: GPIO16
      inverted: true

  - platform: ledc
    id: green_led_output
    pin:
      number: GPIO13
      inverted: true

  # This is needed to power the external sensor.
  # It receives 3v3 from this pin, which is pulled up on boot.
  - platform: gpio
    pin: GPIO27
    id: sensor_power

button:
  # See note above about interlocks!
  - platform: output
    id: main_relay_on
    output: main_relay_on_output
    duration: 100ms

  - platform: output
    id: main_relay_off
    output: main_relay_off_output
    duration: 100ms

# The middle (blue) LED is used as wifi status indicator.
status_led:
  pin:
    number: GPIO15
    inverted: true

light:
  # Leftmost (red) LED that's used to indicate the relay being on/off
  - platform: binary
    id: onoff_led
    output: red_led_output
    internal: true

  # Rightmost (green) LED used to indicate climate control being active
  - platform: binary
    id: auto_led
    output: green_led_output
    internal: true

sensor:
  # Geyser temperature
  # Has some failsafes to disable climate control if the temperature
  # being reported is unreasonable. Below 10C suggests that the ATTiny85
  # is either not connected to the thermistor, or is otherwise reporting
  # incorrect values, and should be investigated.
  #
  # NOTE: This can be overridden, but care should be taken when doing so
  # because these only apply when the temperature ENTERS these ranges
  # If it REMAINS in the range, and climate is turned on manually, these
  # failsafes will not apply!
  - platform: dallas_temp
    address: 0x1e11223344550028
    id: temp
    name: "Temperature"
    on_value_range:
      - below: 10.0
        then:
          - logger.log: "Temperature too low, disabling climate!"
          - climate.control:
              id: geyser_climate
              mode: "OFF"
      - above: 70.0
        then:
          - logger.log: "Temperature too high, disabling climate!"
          - climate.control:
              id: geyser_climate
              mode: "OFF"

  # The THR320 appears to run quite hot, let's just keep an eye on it
  - platform: internal_temperature
    name: "Internal Temperature"

climate:
  - platform: thermostat
    id: geyser_climate
    name: "Climate"
    sensor: temp
    visual:
      min_temperature: 45C
      max_temperature: 70C
      temperature_step:
        target_temperature: 1
        current_temperature: 1
    default_preset: Home
    preset:
      - name: Home
        default_target_temperature_low: 55C
        mode: heat
      - name: Boost
        default_target_temperature_low: 65C
        mode: heat
      - name: Eco
        default_target_temperature_low: 45C
        mode: heat
    min_heating_off_time: 0s
    min_heating_run_time: 60s
    min_idle_time: 30s
    heat_action:
      - switch.turn_on: main_relay
    idle_action:
      - switch.turn_off: main_relay
    heat_deadband: 2 # how many degrees can we go under the temp before starting to heat
    heat_overrun: 0.5 # how many degrees can we go over the temp before stopping
    off_mode:
      - switch.turn_off: main_relay
    on_state:
      - if:
          condition:
            lambda: |-
              return id(geyser_climate).mode == CLIMATE_MODE_OFF;
          then:
            - logger.log: "Climate control OFF"
            - light.turn_off: auto_led
      - if:
          condition:
            lambda: |-
              return id(geyser_climate).mode == CLIMATE_MODE_HEAT;
          then:
            - logger.log: "Climate control ON"
            - light.turn_on: auto_led

one_wire:
  pin: GPIO25
  update_interval: 10s
```
