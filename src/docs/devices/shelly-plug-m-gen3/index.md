---
title: "Shelly Plug M Gen3"
date-published: 2026-08-25
type: plug
standard: eu
board: esp32c3
---

<!-- Describe the device here. See the front-matter table on the contributing page for valid options. -->

![Shelly Plug M Gen3](../shelly-plug-m-gen3/Doku.png "Shelly Plug M Gen3")

To enter bootloader mode, Boot needs to be pulled down (connected to ground).

## GPIO Pinout

| Pin   | Function  |
| ----- | --------- |
| GPIO3 | NTC       |
| GPIO5 | BL0942 TX |
| GPIO4 | BL0942 RX |
| GPIO19 | Blue LED |
| GPIO10 | Green LED|
| GPIO7 | Button    |
| GPIO0 | Relay     |

## Basic Configuration

```yaml
###############################################
# substitutions
###############################################
substitutions:

  devicename: shelly_plugm_gen3_01
  ip: 192.168.178.57
  board: freenove_esp32_s3_wroom
  friendlyName: Waschmaschine
  max_power: "3000"
  max_temp: "70.0"

###############################################
# esphome
###############################################
esphome:
  name: ${devicename}
  friendly_name: ${friendlyName}
  on_boot:
    - priority: 250
      then:
        - switch.turn_on: switch_relay
  
esp32:
  variant: esp32c3
  flash_size: 8MB
  framework:
    type: esp-idf
    version: recommended
    sdkconfig_options:
      COMPILER_OPTIMIZATION_SIZE: y

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: ${ip}
    gateway: 192.168.178.3
    subnet: 255.255.255.0

logger:

ota:
  - platform: esphome
    password: !secret shelly_plugm_gen3_01_ota_pwd

api:
  encryption:
    key: !secret shelly_plugm_gen3_01_api_key
    
time:
  - platform: homeassistant

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
          - switch.turn_off: switch_relay
          - homeassistant.service:
              service: persistent_notification.create
              data:
                title: Message from ${devicename}
              data_template:
                message: Switch turned off because temperature exceeded ${max_temp}°C
  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 10kOhm
  - platform: adc
    id: temp_analog_reading
    pin: GPIO1
    attenuation: 12db

  - platform: bl0942
    uart_id: uart_0
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
            - switch.turn_off: switch_relay
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: Message from ${devicename}
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
    update_interval: 5s

uart:
  id: uart_0
  tx_pin: GPIO4
  rx_pin:
    number: GPIO5
    mode:
      pullup: true
      input: true
  baud_rate: 9600
  stop_bits: 1

status_led:
  pin:
    number: GPIO19
    inverted: true

binary_sensor:
  - platform: gpio
    name: "Button"
    pin:
      number: GPIO7
      inverted: yes
      mode:
        input: true
        pullup: true
    filters:
      - delayed_on: 10ms
    on_press:
      - switch.toggle: switch_relay
        
switch:
  - platform: gpio
    pin: GPIO0
    name: "Relais"
    id: switch_relay
    on_turn_on:
      - output.turn_on: led_green
    on_turn_off:
      - output.turn_off: led_green
    
output:
  - platform: gpio
    pin: GPIO10
    inverted: true
    id: led_green

```
