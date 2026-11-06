---
title: Nous A8T
date-published: 2024-06-04
type: plug
standard: eu
board: esp32
made-for-esphome: False
difficulty: 3
---

## General Notes

This device contains an ESP32 and ships with Tasmota firmware.
To flash it, the device can be disassembled by unscrewing the screw in the hole at the bottom side of the plug.
Alternatively, this procedure by kadam12g works as well—start at step 21: [https://github.com/kadam12g/ESPHome-Shelly-Plus-Plug-S?tab=readme-ov-file](https://github.com/kadam12g/ESPHome-Shelly-Plus-Plug-S?tab=readme-ov-file)

### Example Configuration

```yaml
substitutions:
  name: nous-a8t
  friendly_name: Nous A8T (ESPHome)
  max_power: "2000"
  # Higher value gives lower watt readout
  current_res: "0.00126"
  # Lower value gives lower voltage readout
  voltage_div: "1570"

esphome:
  name: ${name}
  friendly_name: ${friendly_name}
  name_add_mac_suffix: false
  project:
    name: "NOUS.Smart-Wifi-Socket"
    version: "A8T"
  on_boot:
    priority: 200
    then:
      - if:
          condition:
            switch.is_on: relay
          then:
            - light.turn_on: led
          else:
            - light.turn_off: led

esp32:
  variant: esp32
  framework:
    type: esp-idf

# Enable logging
logger:

# Enable Home Assistant API
api:

# Allow Over-The-Air updates
ota:
  - platform: esphome

# Allow provisioning Wi-Fi via serial
improv_serial:

wifi:
  # Set up a wifi access point
  ap: {}

# In combination with the `ap` this allows the user
# to provision wifi credentials to the device via WiFi AP.
captive_portal:

time:
  - platform: homeassistant
    id: my_time

globals:
  - id: total_energy
    type: float
    restore_value: true
    initial_value: "0.0"

dashboard_import:
  package_import_url: github://esphome/example-configs/esphome-web/esp32.yaml@main
  import_full_config: true

# To have a "next url" for improv serial
web_server:

light:
  - platform: status_led
    internal: True
    name: "Switch state"
    id: led
    pin:
      number: GPIO02
      inverted: true
      ignore_strapping_warning: true

binary_sensor:
  - platform: gpio
    id: "push_button"
    internal: true
    pin:
      number: GPIO04
      inverted: yes
      mode: INPUT_PULLUP
    on_press:
      - switch.toggle: "relay"

switch:
  - platform: gpio
    pin: GPIO13
    id: relay
    name: "Relay"
    restore_mode: RESTORE_DEFAULT_OFF
    icon: mdi:power
    on_turn_on:
      - light.turn_on: led
    on_turn_off:
      - light.turn_off: led

sensor:
  - platform: wifi_signal
    name: "Wifi Signal"
    update_interval: 60s
    icon: mdi:wifi

  - platform: uptime
    name: "Uptime"
    update_interval: 60s
    icon: mdi:clock-outline

  - platform: hlw8012
    model: BL0937
    sel_pin:
      number: GPIO14
      inverted: True
    cf_pin: GPIO27
    cf1_pin: GPIO26
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}
    change_mode_every: 1
    update_interval: 5s

    current:
      id: current
      name: "current"
      unit_of_measurement: A
      accuracy_decimals: 3
      icon: mdi:current-ac
      filters:
        - lambda: |-
            if (x < 0.01) return 0;
            else return x;

    voltage:
      id: voltage
      name: "voltage"
      unit_of_measurement: V
      accuracy_decimals: 1
      icon: mdi:flash-outline

    power:
      name: "power"
      id: power
      unit_of_measurement: W
      icon: mdi:flash-outline
      force_update: true
      filters:
        - calibrate_linear:
            - 0.0 -> 0.0
            - 24.50 -> 28.40
      on_value_range:
        - above: ${max_power}
          then:
            - switch.turn_off: relay
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: Message from ${name}
                data_template:
                  message: Switch turned off because power exceeded ${max_power}W

  - platform: total_daily_energy
    name: "energy"
    power_id: power
    state_class: total_increasing
    unit_of_measurement: kWh
    filters:
      # Multiplication factor from W to kW is 0.001
      - multiply: 0.001
      - lambda: !lambda |-
          static auto last_state = x;
          if (x < last_state) { // x was reset
            id(total_energy) += last_state;
            ESP_LOGI("main", "Energy was reset: %f", id(total_energy));
          }
          last_state = x;
          return id(total_energy) + x;
```
