---
title: Shelly 1PM
date-published: 2021-09-11
type: switch
standard: uk, us, eu
board: esp8266
---

## GPIO Pinout

| Pin    | Function      |
| ------ | ------------- |
| GPIO0  | State led     |
| GPIO4  | Switch input  |
| GPIO5  | CF pin        |
| GPIO15 | Relay control |

## Power metering switch configuration

- Power metering
- Switch control
- Overheating protection

```yaml
substitutions:
  devicename: "shelly-1pm"
  max_temp: "70.0"

esphome:
  name: ${devicename}
  comment: "Shelly 1PM"

esp8266:
  board: esp01_1m

logger:

api:
  encryption:
    key: !secret encryption_key

ota:
  password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  power_save_mode: HIGH # for ESP8266 LOW/HIGH are mixed up, esphome/issues/issues/1532
  ap:
    ssid: "${devicename} Fallback"
    password: !secret fallback_password

web_server:
  port: 80
  auth:
    username: admin
    password: !secret web_server_password

time:
  - platform: homeassistant
    id: homeassistant_time

captive_portal:

switch:
  - platform: gpio
    name: ${devicename}
    pin: GPIO15
    id: shelly_relay
    restore_mode: RESTORE_DEFAULT_OFF

sensor:
  - platform: wifi_signal
    name: "${devicename} WiFi Signal"
    device_class: signal_strength
    update_interval: 60s
  - platform: hlw8012
    cf_pin: GPIO05
    cf1_pin: GPIO13 # not used because it is not available on the 1PM but it is needed to compile
    sel_pin: GPIO14 # not used because it is not available on the 1PM but it is needed to compile
    power:
      name: "${devicename} power"
      unit_of_measurement: W
      id: "shelly1pm_power"
      device_class: power
      state_class: measurement
      accuracy_decimals: 0
      filters:
        # Map from sensor -> measured value
        - calibrate_linear:
            - 0.0 -> 1.0
            - 110.33186 -> 20.62
            - 131.01909 -> 24.32
            - 341.33920 -> 62.08
            - 5561.41553 -> 1000.0
            - 2975.51221 -> 535.7
            - 9612.66309 -> 1720.0
            - 14891.35352 -> 2679.0
        # Make everything below 2W appear as just 0W.
        - lambda: if (x < 2) return 0; else return x;
    update_interval: 10s

  - platform: total_daily_energy
    name: "${devicename} daily energy"
    power_id: "shelly1pm_power"
    device_class: energy
    state_class: measurement
    filters:
      - multiply: 0.001
    unit_of_measurement: kWh

  - platform: ntc
    sensor: temp_resistance_reading
    name: "${devicename} temperature"
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    device_class: temperature
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 298.15K
    on_value_range:
      - above: ${max_temp}
        then:
          - homeassistant.event:
              event: esphome.overheat
              data:
                title: "${devicename} has overheated."
  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 32kOhm
  - platform: adc
    id: temp_analog_reading
    pin: A0

output:
  - platform: esp8266_pwm
    id: state_led
    pin:
      number: GPIO00
      inverted: true

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO4
    filters:
      - delayed_on_off: 50ms # small delay to prevent debouncing
    name: "Switch ${devicename}"
    on_press:
      then:
        - switch.toggle: shelly_relay
    internal: true
    id: switchid
```
