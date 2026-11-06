---
title: Shelly EM
date-published: 2022-06-19
type: sensor
standard: uk, us, eu
board: esp8266
---

## GPIO Pinout

| Pin    | Function          |
| ------ | ----------------- |
| GPIO0  | LED               |
| GPIO12 | I2C SDA           |
| GPIO13 | ADE7953 IRQ       |
| GPIO14 | I2C SCL           |
| GPIO15 | Contactor Control |

## Configuration for 2-Phase Whole-Home Energy Monitor

Configuration to use a Shelly EM as per its native design. Requries 2x CT clamps, which can be purchased from the
shelly.cloud store. Set the scales of the ST clamps according to your model (50A or 120A or other model you may want to
use).

Be sure to set GPIO13 to the ADE7953 IRQ pin to prevent overheating!

```yaml
substitutions:
  # "esphome" prefix to avoid confusion with native Shelly devices
  devicename: esphome-shelly-em
  # 120A clamp (3000:1): 1.143207411
  # 50A clamp (2400:1): 1.156612516
  # 50A Victron clamp (2000:1): 0.76
  scale_a_power: '1.143207411'
  scale_b_power: '1.143207411'
  # Consider calibrating CT clamps, measurements were closer to the stock Shelly EM firmware for me without calibration
  # See: https://community.home-assistant.io/t/149867

esphome:
  name: $devicename
  friendly_name: Esphome Shelly EM

esp8266:
  board: esp01_1m

# Enable logging
logger:

# Enable HA API
api:
  encryption:
    key: !secret api_key

# Enable OTAs
ota:
  password: !secret api_password

# Sync RTC with HA
time:
  - platform: homeassistant
    timezone: America/Chicago

# Wi-Fi Setup
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: true
  #power_save_mode: LIGHT

  # Enable fallback hotspot (captive portal) in case Wi-Fi connection fails
  ap:
    ssid: shelly-em AP
    password: !secret ap_password

captive_portal:

i2c:
  sda: GPIO12
  scl: GPIO14

sensor:
  - platform: ade7953_i2c
    # WARNING: Prevent overheating by setting this IRQ pin! - See https://esphome.io/components/sensor/ade7953/
    irq_pin: GPIO13
    voltage:
      name: Voltage
      id: voltage
      filters:
        - or:
          - delta: 1%
          - throttle_average: 60s
    frequency:
      name: Frequency
      id: frequency
      filters:
          - throttle: 60s
    current_a:
      name: Phase 1 Current
      id: current_phase_1
      filters:
        - or:
          - delta: 10%
          - throttle_average: 15s
    current_b:
      name: Phase 2 Current
      id: current_phase_2
      filters:
        - or:
          - delta: 10%
          - throttle_average: 15s
    active_power_a:
      name: Phase 1 Power
      id: power_phase_1
      filters:
        - multiply: $scale_a_power
        - or:
          - delta: 10%
          - throttle_average: 15s
        # In case you don't want negative power values. I don't see why you wouldn't - this allows to measure returned power, for instance by PV panels.
        # Regarding the energy calculation with both forward and return energy, this may need further consideration.
        #- lambda: if (x <= 0.0) return 0; else return x * $scale_a_power;
    active_power_b:
      name: Phase 2 Power
      id: power_phase_2
      filters:
        - multiply: $scale_b_power
        - or:
          - delta: 10%
          - throttle_average: 15s
        #- lambda: if (x <= 0.0) return 0; else return x * $scale_b_power;
    apparent_power_a:
      name: Phase 1 Apparent Power
      id: apparent_power_phase_1
      filters:
        - multiply: $scale_a_power
        - or:
          - delta: 10%
          - throttle_average: 15s
    apparent_power_b:
      name: Phase 2 Apparent Power
      id: apparent_power_phase_2
      filters:
        - multiply: $scale_b_power
        - or:
          - delta: 10%
          - throttle_average: 15s
    power_factor_a:
      name: Phase 1 Power Factor
      id: power_factor_phase_1
      filters:
        - throttle_average: 15s
    power_factor_b:
      name: Phase 2 Power Factor
      id: power_factor_phase_2
      filters:
        - throttle_average: 15s
    reactive_power_a:
      name: Phase 1 Reactive Power
      id: reactive_power_phase_1
      filters:
        - multiply: $scale_a_power
        - or:
          - delta: 10%
          - throttle_average: 15s
    reactive_power_b:
      name: Phase 2 Reactive Power
      id: reactive_power_phase_2
      filters:
        - multiply: $scale_b_power
        - or:
          - delta: 10%
          - throttle_average: 15s
    # Short (internal) update interval while using the throttling settings in all sensors above (provides results close to the native Shellys)
    update_interval: 1s

  - platform: total_daily_energy
    name: Phase 1 Energy
    id: energy_phase_1
    power_id: power_phase_1
    filters:
      # Multiplication factor from W to kWh is 0.001
      - multiply: 0.001
      - throttle: 60s
    unit_of_measurement: kWh

  - platform: total_daily_energy
    name: Phase 2 Energy
    id: energy_phase_2
    power_id: power_phase_2
    filters:
      # Multiplication factor from W to kWh is 0.001
      - multiply: 0.001
      - throttle: 60s
    unit_of_measurement: kWh

    # NTC Temperature
    - platform: ntc
      sensor: temp_resistance_reading
      name: "Temperature"
      calibration:
        b_constant: 3350
        reference_resistance: 10kOhm
        reference_temperature: 298.15K
    - platform: resistance
      id: temp_resistance_reading
      sensor: temp_analog_reading
      configuration: DOWNSTREAM
      # This value is a guess, based on the temperature values compared to native Shelly EM devices
      resistor: 100kOhm
    - platform: adc
      id: temp_analog_reading
      pin: A0

status_led:
  pin:
    number: GPIO0
    inverted: yes

switch:
  - platform: gpio
    name: Shelly EM Switch
    pin: GPIO15
    id: relay
```
