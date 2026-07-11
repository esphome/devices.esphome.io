---
title: Nous A5t
date-published: 2022-12-19
type: plug
standard: eu
board: esp8266
made-for-esphome: False
difficulty: 2
---

The device comes with Tasmota installed, but can be reflashed to ESPHome.

## GPIO Pinout

[see pinout](https://nous.technology/product/a5t.html?show=manual)

| Pin    | Function   |
| ------ | ---------- |
| GPIO00 | None       |
| GPIO01 | CSE7766 tx |
| GPIO02 | LedLink    |
| GPIO03 | CSE7766 rx |
| GPIO04 | None       |
| GPIO05 | Relay4i    |
| GPIO09 | None       |
| GPIO10 | None       |
| GPIO12 | Relay2     |
| GPIO13 | Relay3     |
| GPIO14 | Relay1     |
| GPIO15 | None       |
| GPIO16 | Button1    |
| FLAG   | None       |

## Basic Configuration

```yaml
substitutions:
  friendly_name: "A5T"
  devicename: "nous-a5t"
  device_description: "nous a5t"
  project_name: "Nous.A5T"
  project_version: "1.0"
  relay_restore_mode: RESTORE_DEFAULT_OFF

esphome:
  name: $devicename
  friendly_name: "${friendly_name}"
  name_add_mac_suffix: false
  project:
    name: "${project_name}"
    version: "${project_version}"

esp8266:
  board: esp8285
  restore_from_flash: true

preferences:
  flash_write_interval: 1min

logger:
  baud_rate: 0

uart:
  rx_pin: GPIO3
  baud_rate: 4800

api:
  encryption:
    key: !secret encryption

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${friendly_name} Fallback Hotspot"
    password: !secret wifi_ap_password

captive_portal:

ota:

# see: https://esphome.io/components/time/
time:
  - platform: homeassistant
    id: homeassistant_time

globals:
  - id: total_energy
    type: float
    restore_value: yes
    initial_value: "0.0"

binary_sensor:
  - platform: status
    name: "${friendly_name} - Status"
    device_class: connectivity

  - platform: gpio
    pin:
      number: GPIO16
      # mode: INPUT_PULLUP
      inverted: True
    id: "button_state0"
    on_press:
      - switch.turn_off: relay1
      - switch.turn_off: relay2
      - switch.turn_off: relay3
      - switch.turn_off: relay4

sensor:
  - platform: uptime
    name: "${friendly_name} Uptime Sensor"

  # Small buttons over ADC - see https://templates.blakadder.com/nous_A5T.html
  - platform: adc
    pin: VCC
    id: a0_vcc
    update_interval: 1s
    internal: true
    filters:
      - clamp:
          min_value: 0
          max_value: 4
          ignore_out_of_range: true
      - timeout:
          timeout: 1s
          value: 4
    on_value_range:
      - below: 1.5
        then:
          - switch.toggle: relay3
      - above: 1.5
        below: 2.5
        then:
          - switch.toggle: relay2
      - above: 2.5
        below: 3.5
        then:
          - switch.toggle: relay1

  - platform: cse7766
    current:
      name: "${friendly_name} Current"
      filters:
        - throttle: 10s

    voltage:
      name: "${friendly_name} Voltage"
      filters:
        - multiply: 2.4
        - throttle: 10s

    power:
      name: "${friendly_name} Power"
      id: power_sensor
      filters:
        - multiply: 2.4
        - throttle: 1s

    energy:
      name: "${friendly_name} Energy"
      id: energy
      unit_of_measurement: kWh
      filters:
        # Multiplication factor from W to kW is 0.001
        # and multiple by 2.4 because of the voltage factor
        - multiply: 0.0024
        - throttle: 1s
      on_value:
        then:
          - lambda: |-
              static float previous_energy_value = 0.0;
              float current_energy_value = id(energy).state;
              id(total_energy) += current_energy_value - previous_energy_value;
              previous_energy_value = current_energy_value;

  - platform: template
    name: "${friendly_name} Total Energy"
    unit_of_measurement: kWh
    device_class: "energy"
    state_class: "total_increasing"
    icon: "mdi:lightning-bolt"
    accuracy_decimals: 3
    lambda: |-
      return id(total_energy);
    update_interval: 60s

light:
  - platform: status_led
    name: "${friendly_name} Status LED"
    id: blue_led
    disabled_by_default: true
    pin:
      inverted: true
      number: GPIO2

switch:
  - platform: gpio
    name: "${friendly_name} - Switch 1"
    pin: GPIO14
    id: relay1
    restore_mode: ${relay_restore_mode}

  - platform: gpio
    name: "${friendly_name} - Switch 2"
    pin: GPIO12
    id: relay2
    restore_mode: ${relay_restore_mode}

  - platform: gpio
    name: "${friendly_name} - Switch 3"
    pin: GPIO13
    id: relay3
    restore_mode: ${relay_restore_mode}

  - platform: gpio
    name: "${friendly_name} - USB Switch"
    pin: GPIO5
    inverted: True
    id: relay4
    restore_mode: ${relay_restore_mode}
```
