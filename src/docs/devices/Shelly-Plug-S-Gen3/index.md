---
title: Shelly Plug S Gen3
date-published: 2024-12-05
type: plug
standard: eu
board: esp32
difficulty: 4
---

Generation 3 of Shelly Plug-S

At this moment there is NO way to Flash it OTA. You need to open the Plug and use UART!

As always, first take a dump!
`esptool -b 115200 --port COM11 read_flash 0x00000 0x800000 shelly_plug_s_gen3.bin`

## UART Pinout

| Pin     | Colour |
| ------- | ------ |
| Reset   | Brown  |
| 3v3     | Red    |
| RX      | Blue   |
| TX      | Yellow |
| BootSEL | Purple |
| GND     | Black  |

![Shelly Plug S Gen3](../Shelly-Plug-S-Gen3/pinout_small.png "Shelly Plug S Gen3")

## GPIO Pinout

| Pin    | Function             |
| ------ | -------------------- |
| GPIO3  | Internal Temperature |
| GPIO4  | Relay                |
| GPIO5  | LED WS2812           |
| GPIO6  | BL0942 TX            |
| GPIO7  | BL0942 RX            |
| GPIO18 | Button               |

```yaml
substitutions:
  device_name: shelly-plug-s-gen3
  friendly_name: "Shelly Plug S Gen3"
  update_bl0942: 5s
  max_power: "1500"
  max_temp: "60.0"
  channel_1: Relay

esphome:
  name: ${device_name}
  friendly_name: ${friendly_name}
  comment: "Free Shelly!"
  on_boot:
    - delay: 10s
    - lambda: !lambda |-
        id(rgb_ready) = true;
    - script.execute: set_rgb

esp32:
  variant: esp32c3
  framework:
    type: esp-idf

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "FreeShelly Hotspot"
    password: !secret wifi_password

logger:

api:

ota:

time:
  - platform: homeassistant
    id: my_time

globals:
  - id: rgb_ready
    type: bool
    restore_value: false
    initial_value: "false"

script:
  - id: set_rgb
    mode: queued
    then:
      - if:
          condition:
            lambda: "return id(rgb_ready);"
          then:
            - if:
                condition:
                  lambda: "return id(relay).state;"
                then:
                  - if:
                      condition:
                        lambda: "return id(ring_on).remote_values.is_on();"
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
                      else:
                        - light.turn_off: rgb_light1
                else:
                  - if:
                      condition:
                        lambda: "return id(ring_off).remote_values.is_on();"
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
                      else:
                        - light.turn_off: rgb_light1

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

binary_sensor:
  - platform: gpio
    id: "push_button"
    name: "Button"
    internal: true
    pin:
      number: GPIO18
      inverted: true
      mode:
        input: true
        pullup: true
    filters:
      - delayed_on_off: 5ms
    on_click:
      then:
        - if:
            condition:
              switch.is_off: button_lock
            then:
              - switch.toggle: relay

switch:
  - platform: gpio
    id: relay
    pin: GPIO4
    name: "Relay"
    restore_mode: ALWAYS_ON
  - platform: template
    id: button_lock
    name: "Button Lock"
    optimistic: true
    restore_mode: ALWAYS_OFF

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
    pin: GPIO5
    num_leds: 4
    id: rgb_light1
    internal: false
    default_transition_length: 700ms
    restore_mode: ALWAYS_OFF

uart:
  id: uart_0
  tx_pin: GPIO7
  rx_pin: GPIO6
  baud_rate: 9600
  stop_bits: 1
  data_bits: 8
  parity: NONE

sensor:
  - platform: ntc
    sensor: temp_resistance_reading
    name: "Temperature"
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    icon: "mdi:thermometer"
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
    pin: GPIO3
    attenuation: 12db

  - platform: bl0942
    uart_id: uart_0
    address: 0
    voltage:
      name: "Voltage"
      id: bvoltage
      icon: mdi:alpha-v-circle-outline
      device_class: voltage
    current:
      name: "Current"
      id: bcurrent
      icon: mdi:alpha-a-circle-outline
      device_class: current
    power:
      name: "Power"
      id: bpower
      icon: mdi:transmission-tower
      device_class: power
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
    energy:
      name: "Energy"
      id: benergy
      icon: mdi:lightning-bolt
      device_class: energy
    frequency:
      name: "Frequency"
      id: bfreq
      accuracy_decimals: 2
      icon: mdi:cosine-wave
      device_class: frequency
    update_interval: ${update_bl0942}
```

## Open the device

![Seal](<../Shelly-Plug-S-Gen3/seal(plombe).jpeg> "Seal [thx to bkbartk]")
This little seal need to drill open, best you use a prick punch with an M3.5-M4 Drill.
![Drill](../Shelly-Plug-S-Gen3/drill_1.png "Drill M3.5 or M4")

When the seal is cracked open, you need a M2 drill, and drill in center, just a little.
![Drill](../Shelly-Plug-S-Gen3/drill_2.png "Drill M2")

Now take a tapered punch and press the seal out. The whole grounding receptacle will come out.

We need some hot-air (~300°C) and 5 of the iFixit triangle-plastic, there are 3 spots with glue.
Heat them up, and try placeing the plastic around.
![Open it up](../Shelly-Plug-S-Gen3/open_1.png "create a gap")

You will get a little gap, take anohter plastic and get betweet the white and transparent plastic, and make a circle.
![Open it up](../Shelly-Plug-S-Gen3/open_2.png "open it up")

After 2 rounds you can easly take it out.
