---
title: Sonoff POW Ring (POWCT)
date-published: 2024-06-24
type: relay
standard: global
board: esp32
difficulty: 3
---

## GPIO Pinout

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO00 | Push Button (HIGH = off, LOW = on) |
| GPIO05 | TM1621 DA                          |
| GPIO13 | Status LED (HIGH = off, LOW = on)  |
| GPIO15 | Wifi_LED                           |
| GPIO17 | TM1621 CS                          |
| GPIO18 | TM1621 WR                          |
| GPIO21 | Relay1                             |
| GPIO23 | TM1621 RD                          |
| GPIO25 | CSE7761 Rx                         |
| GPIO26 | CSE7761 Tx                         |

## Basic Configuration

Based on Sonoff POW Elite 20a (POWR320D) (Source: [https://devices.esphome.io/devices/Sonoff-POW-Elite-20a](https://devices.esphome.io/devices/Sonoff-POW-Elite-20a)).

To get the correct current and power values, the measurement must be divided by the M_PI constant.

```yaml
# Basic Config
esphome:
  name: sonoff-powct
  friendly_name: Sonoff POW Ring
  on_boot: # Set the initial state of the template switch to the actual relay state. This will NOT change the state.
    priority: 250.0 # Wait until WiFi is connected to allow the sensor some time to settle
    then:
      - if:
          condition:
            lambda: "return id(v_sensor).state > 10;"
          then:
            - switch.turn_on: relay_1
          else:
            - switch.turn_off: relay_1

esp32:
  variant: esp32
  framework:
    type: esp-idf

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:
  - platform: esphome

wifi:
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:

captive_portal:

time:
  - platform: homeassistant
    id: homeassistant_time

uart:
  tx_pin: GPIO26
  rx_pin: GPIO25
  baud_rate: 38400
  parity: EVEN
  stop_bits: 1

sensor:
  - platform: cse7761
    update_interval: 2s
    current_1:
      name: Current
      id: a_sensor
      unit_of_measurement: "A"
      accuracy_decimals: 3
      icon: mdi:current-ac
      filters:
        # Measurement divided by the M_PI constant
        - lambda: return x / M_PI;
    voltage:
      name: Voltage
      id: v_sensor
      unit_of_measurement: "V"
      icon: mdi:sine-wave
    active_power_1:
      name: Power
      id: w_sensor
      filters:
        # Measurement divided by the M_PI constant
        - lambda: return x / M_PI;
      icon: mdi:flash
      on_value_range:
        - above: 4.0
          then:
            - light.turn_on: switch_led
        - below: 3.0
          then:
            - light.turn_off: switch_led

  - platform: total_daily_energy
    name: Total Daily Energy
    power_id: w_sensor
    id: kw_sensor
    unit_of_measurement: "kWh"
    state_class: total_increasing
    device_class: energy
    accuracy_decimals: 3
    icon: mdi:lightning-bolt
    filters:
      # Multiplication factor from W to kW is 0.001
      - multiply: 0.001

  - platform: internal_temperature
    name: ESP32 Internal Temp
    id: esp32_temp

  - platform: template
    name: Power Factor
    device_class: power_factor
    id: power_factor
    icon: mdi:angle-acute
    lambda: return id(w_sensor).state / id(v_sensor).state / id(a_sensor).state;

binary_sensor:
  - platform: gpio
    pin: GPIO00
    id: reset
    internal: true
    filters:
      - invert:
      - delayed_off: 10ms
    on_click:
      - max_length: 350ms # short press to toggle the relay
        then:
          switch.toggle: relay_1
      - min_length: 360ms # long press to cycle display info
        max_length: 3s
        then:
          - if:
              condition:
                binary_sensor.is_on: page
              then:
                binary_sensor.template.publish:
                  id: page
                  state: OFF
              else:
                binary_sensor.template.publish:
                  id: page
                  state: ON
  - platform: template # this is a fake sensor to tell the screen which info to show on display
    id: page
    publish_initial_state: true
    internal: true
  - platform: template
    name: Subordinate Device
    id: subordinate_device_on
    lambda: |-
      if (isnan(id(w_sensor).state)) {
        return {};
      } else if (id(w_sensor).state > 4) {
        // Running
        return true;
      } else {
        // Not running
        return false;
      }

display:
  platform: tm1621
  id: tm1621_display
  cs_pin: GPIO17
  data_pin: GPIO05
  read_pin: GPIO23
  write_pin: GPIO18
  lambda: |-
    if (id(page).state) {
      it.display_voltage(true);
      it.display_kwh(false);
      it.printf(0, "%.1f", id(v_sensor).state);
      it.printf(1, "%.1f", id(a_sensor).state);
    } else {  
      it.display_voltage(false);
      it.display_kwh(true);
      it.printf(0, "%.1f", id(kw_sensor).state);
      it.printf(1, "%.1f", id(w_sensor).state);
    }

output:
  - platform: ledc
    id: led
    pin:
      number: GPIO13
      inverted: True

switch:
  - platform: gpio
    name: Relay
    pin: GPIO21
    id: relay_1
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_on:
      - delay: 500ms
      - light.turn_on: switch_led
    on_turn_off:
      - delay: 500ms
      - light.turn_off: switch_led

light:
  - platform: monochromatic
    id: switch_led
    output: led
    internal: True
  - platform: status_led
    id: wifi_status_led
    internal: True
    pin:
      number: GPIO15
      inverted: True
```
