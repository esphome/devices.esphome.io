---
title: Shelly Plus Plug S
date-published: 2023-03-23
type: plug
standard: eu
board: esp32
---

## GPIO Pinout

| Pin    | Function                    |
| ------ | --------------------------- |
| GPIO25 | LED 1 & 2                   |
| GPIO26 | LED 3 & 4                   |
| GPIO9  | Button                      |
| GPIO4  | Relay                       |
| GPIO33 | Internal Temperature        |
| GPIO19 | HLW8012 (power measurement) |
| GPIO10 | CF Pin                      |
| GPIO22 | CF1 Pin                     |

## Configuration as relay with overpower and overtemperature protection

When integration with home assistant exists, it will appear as a switch, 3 sensors (power, total energy, temperature)
and two RGB lights that can be configured as the color for the ring when on or off.
When the `max_power` is exceeded, the relay will be switched off and a persistent notification will be created in
home-assistant
When the `max_temp` is exceeded, the relay will be switched off and a persistent notification will be created in
home-assistant
Thanks to all contributors in [this](https://community.home-assistant.io/t/shelly-plus-plug-s-esphome/544316) topic.
Config tested by [bobkersten](https://github.com/bobkersten)

```yaml
substitutions:
  device_name: shelly-plus-plug-s-3
  friendly_name: shelly-plus-plug-s-3
  channel_1: Relay
  max_power: "1500" # 2000
  max_temp: "65.0" # 70.0
  # Higher value gives lower watt readout.
  current_res: "0.001"
  # Lower value gives lower voltage readout.
  voltage_div: "1830"


esphome:
  name: ${device_name}
  friendly_name: ${friendly_name}
  on_boot:
    - delay: 10s
    - lambda: !lambda |-
        id(rgb_ready) = true;
    - script.execute: set_rgb

esp32:
  variant: esp32
  framework:
    type: esp-idf

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot in case wifi connection fails
  ap:
    ssid: ${device_name}

time:
  - platform: homeassistant
    id: my_time

globals:
  - id: rgb_ready
    type: bool
    restore_value: false
    initial_value: 'false'
  - id: total_energy
    type: float
    restore_value: true
    initial_value: '0.0'


    #### only needed for RGB LED to set up a while after boot #####

script:
  - id: set_rgb
    mode: queued
    then:
      - if:
          condition:
            lambda: 'return id(rgb_ready);'
          then:
            - if:
                condition:
                  lambda: 'return id(relay).state;'
                then:
                  - if:
                      condition:
                        lambda: 'return id(ring_on).remote_values.is_on();'
                      then:
                        - light.turn_on:
                            id: rgb_light1
                            brightness: !lambda |-
                              return id(ring_on).remote_values.get_brightness();
                            red: !lambda |-
                              return id(ring_on).remote_values.get_red();
                            green: !lambda |-
                              return id(ring_on).remote_values.get_green();
                            blue: !lambda |-
                              return id(ring_on).remote_values.get_blue();
                        - light.turn_on:
                            id: rgb_light2
                            brightness: !lambda |-
                              return id(ring_on).remote_values.get_brightness();
                            red: !lambda |-
                              return id(ring_on).remote_values.get_red();
                            green: !lambda |-
                              return id(ring_on).remote_values.get_green();
                            blue: !lambda |-
                              return id(ring_on).remote_values.get_blue();
                      else:
                        - light.turn_off: rgb_light1
                        - light.turn_off: rgb_light2
                else:
                  - if:
                      condition:
                        lambda: 'return id(ring_off).remote_values.is_on();'
                      then:
                        - light.turn_on:
                            id: rgb_light1
                            brightness: !lambda |-
                              return id(ring_off).remote_values.get_brightness();
                            red: !lambda |-
                              return id(ring_off).remote_values.get_red();
                            green: !lambda |-
                              return id(ring_off).remote_values.get_green();
                            blue: !lambda |-
                              return id(ring_off).remote_values.get_blue();
                        - light.turn_on:
                            id: rgb_light2
                            brightness: !lambda |-
                              return id(ring_off).remote_values.get_brightness();
                            red: !lambda |-
                              return id(ring_off).remote_values.get_red();
                            green: !lambda |-
                              return id(ring_off).remote_values.get_green();
                            blue: !lambda |-
                              return id(ring_off).remote_values.get_blue();
                      else:
                        - light.turn_off: rgb_light1
                        - light.turn_off: rgb_light2

output:
  - platform: template
    id: r_out_on
    type: float
    write_action:
      - lambda: |-
  - platform: template
    id: g_out_on
    type: float
    write_action:
      - lambda: |-
  - platform: template
    id: b_out_on
    type: float
    write_action:
      - lambda: |-
  - platform: template
    id: r_out_off
    type: float
    write_action:
      - lambda: |-
  - platform: template
    id: g_out_off
    type: float
    write_action:
      - lambda: |-
  - platform: template
    id: b_out_off
    type: float
    write_action:
      - lambda: |-

light:
  - platform: rgb
    id: ring_on
    name: "${channel_1} Ring when On"
    icon: "mdi:circle-outline"
    default_transition_length: 0s
    red: r_out_on
    green: g_out_on
    blue: b_out_on
    restore_mode: RESTORE_DEFAULT_OFF
    entity_category: config
    on_state:
      - delay: 50ms
      - script.execute: set_rgb
  - platform: rgb
    id: ring_off
    name: "${channel_1} Ring when Off"
    icon: "mdi:circle-outline"
    default_transition_length: 0s
    red: r_out_off
    green: g_out_off
    blue: b_out_off
    restore_mode: RESTORE_DEFAULT_OFF
    entity_category: config
    on_state:
      - delay: 50ms
      - script.execute: set_rgb

  - platform: esp32_rmt_led_strip
    rgb_order: GRB
    chipset: ws2812
    pin: GPIO25
    num_leds: 2
    id: rgb_light1
    internal: true
    default_transition_length: 700ms
    restore_mode: ALWAYS_OFF
  - platform: esp32_rmt_led_strip
    rgb_order: GRB
    chipset: ws2812
    pin: GPIO26
    num_leds: 2
    id: rgb_light2
    internal: true
    default_transition_length: 700ms
    restore_mode: ALWAYS_OFF

binary_sensor:
  - platform: gpio
    id: "push_button"
    internal: true
    pin:
      number: GPIO9
      inverted: yes
      mode:
        input: true
        pullup: true
    on_click:
      then:
        - if:
            condition:
              switch.is_off: button_lock
            then:
              - switch.toggle: relay
    filters:
      - delayed_on_off: 5ms

switch:
  - platform: gpio
    pin: GPIO4
    id: relay
    name: "${channel_1}"
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_on:
      - script.execute: set_rgb
    on_turn_off:
      - script.execute: set_rgb
  - platform: template
    entity_category: 'config'
    name: "Button lock"
    id: button_lock
    optimistic: true
    restore_mode: ALWAYS_OFF

sensor:
  - platform: ntc
    sensor: temp_resistance_reading
    name: "${device_name} Temperature"
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    icon: "mdi:thermometer"
    entity_category: 'diagnostic'
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 298.15K
    on_value_range:
      - above: ${max_temp}
        then:
          - switch.turn_off: "relay"
          - homeassistant.service:
              service: persistent_notification.create
              data:
                title: Message from ${device_name}
              data_template:
                message: Switch turned off because temperature exceeded ${max_temp} °C
  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 10kOhm
  - platform: adc
    id: temp_analog_reading
    pin: GPIO33
    attenuation: 12db
    update_interval: 10s

  - platform: hlw8012
    model: BL0937
    sel_pin:
      number: GPIO19
      inverted: true
    cf_pin: GPIO10
    cf1_pin: GPIO22
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}
    change_mode_every: 1
    update_interval: 5s
    current:
      id: current
      unit_of_measurement: A
      accuracy_decimals: 3
      internal: true
      name: "${channel_1} current"
    voltage:
      id: voltage
      unit_of_measurement: V
      accuracy_decimals: 1
      internal: false
      name: "${channel_1} voltage"
    power:
      name: "${channel_1} power"
      unit_of_measurement: W
      id: power
      icon: mdi:flash-outline
      force_update: true
      on_value_range:
        - above: ${max_power}
          then:
            - switch.turn_off: relay
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: Message from ${device_name}
                data_template:
                  message: Switch turned off because power exceeded ${max_power}W

  - platform: total_daily_energy
    name: "${channel_1} energy"
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
            ESP_LOGI("main", "Energy channel 1 was reset: %f", id(total_energy));
          }
          last_state = x;
          return id(total_energy) + x;
```
