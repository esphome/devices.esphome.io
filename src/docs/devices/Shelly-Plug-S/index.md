---
title: Shelly Plug S
date-published: 2020-07-13
type: plug
standard: eu
board: esp8266
---

## GPIO Pinout

| Pin    | Function                    |
| ------ | --------------------------- |
| GPIO0  | Red LED                     |
| GPIO2  | Blue LED                    |
| GPIO5  | CF Pin                      |
| GPIO12 | HLW8012 (power measurement) |
| GPIO13 | Button                      |
| GPIO14 | CF1 Pin                     |
| GPIO15 | Relay                       |
| GPIOA0 | Internal Temperature        |

## Configuration as relay with overpower and overtemperature protection

When integration with home assistant exists, it will appear as a switch, 4 sensors (power, temperature, wifi strenght
and total daily energy)
When the `max_power` is exceeded, the relay will be switched off and a persistent notification will be created in
home-assistant
When the `max_temp` is exceeded, the relay will be switched off and a persistent notification will be created in
home-assistant
Thanks to [Tasmota](https://templates.blakadder.com/blitzwolf_SHP6.html) and
[Tijmen](https://community.home-assistant.io/u/tijmen/summary) from
[this](https://community.home-assistant.io/t/esphome-blitzwolf-bw-shp6-configuration/113938) topic
Config tested by [gieljnssns](https://github.com/gieljnssns)

```yaml
substitutions:
  devicename: shelly_plug_s
  channel_1: Relay
  ip: 192.168.xx.xx

  ssid: !secret ssid
  password: !secret password

  # Higher value gives lower watt readout
  current_res: "0.000943"
  # Lower value gives lower voltage readout
  voltage_div: "2066"
  # measure a relatively strong load and enter values measured by the device vs the values your reference measurement provided here
  power_cal_meas: "1710.0"
  power_cal_real: "1685.0"

  max_current: "10"
  max_power: "2400"
  max_temp: "70.0"

esphome:
  name: ${devicename}

esp8266:
  board: esp8285

wifi:
  ssid: ${ssid}
  password: ${password}
  manual_ip:
    static_ip: ${ip}
    gateway: 192.168.xx.xx
    subnet: 255.255.255.0
    dns1: 8.8.8.8
    dns2: 8.8.4.4

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: ${devicename}
    password: ${password}
    manual_ip:
      static_ip: 192.168.100.2
      gateway: 192.168.100.1
      subnet: 255.255.255.0
      dns1: 8.8.8.8
      dns2: 8.8.4.4

captive_portal:

# Enable logging
logger:
  level: DEBUG

# Enable Home Assistant API
api:
  encryption:
    key: !secret api_key

ota:
  password: ${password}

web_server:
  port: 80

time:
  - platform: sntp
    id: my_time

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
      inverted: True
    name: "${devicename}_button"
    on_press:
      - switch.toggle: relay

status_led:
  pin:
    number: GPIO02
    inverted: True

output:
  - platform: gpio
    pin: GPIO00
    inverted: true
    id: led

switch:
  - platform: gpio
    pin: GPIO15
    id: relay
    name: "${channel_1}"
    on_turn_on:
      - output.turn_on: led
    on_turn_off:
      - output.turn_off: led

sensor:
  - platform: wifi_signal
    name: "${devicename} WiFi Signal"
    update_interval: 300s

  # NTC Temperature
  - platform: ntc
    sensor: temp_resistance_reading
    name: ${devicename} temperature
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
          - switch.turn_off: relay
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
    resistor: 32kOhm
  - platform: adc
    id: temp_analog_reading
    pin: A0

  - platform: hlw8012
    model: BL0937
    sel_pin:
      number: GPIO12
      inverted: true
    cf_pin: GPIO05
    cf1_pin: GPIO14
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}
    current:
      name: "${channel_1} current"
      unit_of_measurement: "A"
      accuracy_decimals: 3
      icon: mdi:flash-outline
      on_value_range:
        - above: ${max_current}
          then:
            - switch.turn_off: relay
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: Message from ${devicename}
                data_template:
                  message: Switch turned off because current exceeded ${max_current}A
    voltage:
      name: "${channel_1} voltage"
      unit_of_measurement: "V"
      icon: mdi:flash-outline
    power:
      name: "${channel_1} power"
      id: power
      unit_of_measurement: "W"
      filters:
        - calibrate_linear:
            - 0.0 -> 0.0
            - ${power_cal_meas} -> ${power_cal_real}
      icon: mdi:flash-outline
      on_value_range:
        - above: ${max_power}
          then:
            - switch.turn_off: relay
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: Message from ${devicename}
                data_template:
                  message: Switch turned off because power exceeded ${max_power}W
    update_interval: 10s

  - platform: total_daily_energy
    name: "${channel_1} daily energy"
    power_id: power
    filters:
      # Multiplication factor from W to kW is 0.001
      - multiply: 0.001
    unit_of_measurement: kWh
```
