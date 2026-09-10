---
title: BlitzWolf BW-SHP3 Power Monitoring Plug
date-published: 2021-05-12
type: plug
standard: us
board: esp8266
---

Model reference: BW-SHP3

Manufacturer: [BlitzWolf](https://www.blitzwolf.com/1200W-US-Dual-WIFI-Smart-Socket-p-294.html)

## Configuration

### GPIO Pinout

| Pin    | Function                         |
|--------|----------------------------------|
| GPIO00 | Right Power LED (Inverted: true) |
| GPIO02 | Blue Status LED (Inverted: true) |
| GPIO13 | Left Button                      |
| GPIO04 | Left Relay                       |
| GPIO16 | Right Button                     |
| GPIO15 | Right Relay                      |
| GPIO12 | HLWBL SEL Pin                    |
| GPIO05 | HLW8012 CF Pin                   |
| GPIO14 | HLWBL CF1 Pin                    |

### Flashing

Unfortunately, unless you have a much older model, or already flashed one with Tasmota or similar,
you will have to destroy the case to get at the pins inside as Tuya-convert does not work with newer
firmwares. My single SHP3 was old enough that I had originally flashed it with Tasmota via tuya-convert,
and just recently replaced it with ESPHome.

### YAML

I love the flexibility that ESPHome gives me. In Tasmota, the right power indicator LED and the
blue status LED were not easily controlled. With this setup, the red power indicators work
properly (the left one requires no setup——it just works), and the blue status LED will indicate
WiFi issues, etc.

I have omitted the basic WiFi and other default settings here for brevity, and only included
what is actually required by the switch.

```yaml
substitutions:
  comment: "(Blitzwolf SHP3) -- Device host: bw-shp3-01.local"
  platform: ESP8266
  board: esp01_1m
  devicename: your_device_name
  propername: "Your Friendly Name"
  current_res: "0.00221" # Random value. Requires power monitoring calibration
  voltage_div: "955" # Random value. Requires power monitoring calibration

# Include your connection, API, etc. settings here

sensor:
  # Reports the Current, Voltage, and Power used by the plugged-in device
  - platform: hlw8012
    sel_pin:
      number: GPIO12
      inverted: true
    cf_pin: GPIO5
    cf1_pin: GPIO14
    change_mode_every: 8
    update_interval: 10s
    current:
      name: ${propername} Amperage
      icon: mdi:current-ac
      unit_of_measurement: A
    voltage:
      name: ${propername} Voltage
      icon: mdi:flash-circle
      unit_of_measurement: V
    power:
      id: wattage
      name: ${propername} Wattage
      icon: mdi:flash-outline
      unit_of_measurement: W
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}

  # Reports the total Power so-far each day, resets at midnight, see https://esphome.io/components/sensor/total_daily_energy/
  - platform: total_daily_energy
    name: ${propername} Total Daily Energy
    icon: mdi:circle-slice-3
    power_id: wattage
    filters:
      # Multiplication factor from W to kW is 0.001
      - multiply: 0.001
    unit_of_measurement: kWh

binary_sensor:
  - platform: gpio
    device_class: power
    internal: true
    pin:
      number: GPIO16
      mode: INPUT_PULLUP
    name: ${propername} Right Button
    on_press:
      - switch.toggle: relay1
  - platform: gpio
    device_class: power
    internal: true
    pin:
      number: GPIO13
      mode: INPUT_PULLUP
    name: ${propername} Left Button
    on_press:
      - switch.toggle: relay2

switch:
  - platform: gpio
    name: "${propername} Right Outlet"
    pin: GPIO15
    id: relay1
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_on:
      then:
        - output.turn_on: right_power_indicator
    on_turn_off:
      then:
        - output.turn_off: right_power_indicator
  - platform: gpio
    name: "${propername} Left Outlet"
    pin: GPIO4
    id: relay2
    restore_mode: RESTORE_DEFAULT_OFF

output:
- platform: gpio
  id: right_power_indicator
  pin:
    number: GPIO00
    inverted: True

status_led:
  pin:
    number: GPIO02
    inverted: True
```
