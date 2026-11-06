---
title: Wyze Outdoor Plug
date-published: 2022-03-05
type: plug
standard: us
board: esp32
---

## Initial Install

### Hardware Flashing

This device requires a triangle screw driver bit to [remove the cover and use the serial header][1] for the first
upload.

[1]: https://digiblur.com/2021/03/27/how-to-flash-the-wyze-outdoor-plug-esphome-or-tasmota-local-control/

### Software Flashing

Some of these devices may be able to be flashed OTA with ESPHome using [this guide][2].
The firmware is first downgraded to 1.2.0.73 with the [Wyze Updater Tool][3],
and then flashing ESPHome OTA for the first upload.

[2]: https://www.inlimbo.org/2025/06/wyze-outdoor-plug-esphome/
[3]: https://github.com/gtxaspec/WyzeUpdater

## GPIO Pinout

| Pin    | Function    |
| ------ | ----------- |
| GPIO5  | Status LED  |
| GPIO18 | Button 1    |
| GPIO17 | Button 2    |
| GPIO15 | Relay 1     |
| GPIO32 | Relay 2     |
| GPIO19 | Relay 1 LED |
| GPIO16 | Relay 2 LED |
| GPIO34 | LUX Sensor  |
| GPIO25 | SEL         |
| GPIO27 | CF          |
| GPIO26 | CF1         |

## Notes

- The Lux sensor is a binary sensor and can be used like a daylight sensor. (e.g. turn on lights when it gets dark)
- This device can be used as a Bluetooh proxy in Home Assistant see the
  [docs on how to enable](https://esphome.io/components/bluetooth_proxy/)

## Basic Configuration

```yaml
# Basic Config
substitutions:
  display_name: WyzeOutdoor
  # Higher value gives lower watt readout
  current_res: "0.001"
  # Lower value gives lower voltage readout
  voltage_div: "770"

esphome:
  name: wyzeoutdoor

esp32:
  variant: esp32
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
logger:
api:
ota:

# Device Specific Config
switch:
  - platform: gpio
    name: ${display_name} Relay1
    pin:
      number: GPIO15
      inverted: false
    id: relay1
    on_turn_on:
      - light.turn_on: relay1_led
    on_turn_off:
      - light.turn_off: relay1_led
  - platform: gpio
    name: ${display_name} Relay2
    pin:
      number: GPIO32
      inverted: false
    id: relay2
    on_turn_on:
      - light.turn_on: relay2_led
    on_turn_off:
      - light.turn_off: relay2_led
  - platform: restart
    name: ${display_name} Restart

output:
  - platform: gpio
    pin: GPIO19
    inverted: True
    id: relay1_led_gpio
  - platform: gpio
    pin: GPIO16
    inverted: True
    id: relay2_led_gpio

light:
  - platform: binary
    name: "Relay1 LED"
    id: relay1_led
    internal: true
    output: relay1_led_gpio
  - platform: binary
    name: "Relay2 LED"
    id: relay2_led
    internal: true
    output: relay2_led_gpio

sensor:
  - platform: adc
    pin: GPIO34
    name: "${display_name} LUX"
    id: lux_sensor
    device_class: illuminance
    unit_of_measurement: lx
    attenuation: 12db
  - platform: hlw8012
    sel_pin:
      number: GPIO25
      inverted: true
    cf_pin: GPIO27
    cf1_pin: GPIO26
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}
    change_mode_every: 3
    update_interval: 3s
    current:
      name: "${display_name} Amps"
      unit_of_measurement: A
      accuracy_decimals: 2
    voltage:
      name: "${display_name} Volts"
      unit_of_measurement: V
      accuracy_decimals: 1
    energy:
      name: "${display_name} Energy"
    power:
      name: "${display_name} Watts"
      unit_of_measurement: W
      accuracy_decimals: 0
      filters:
        - calibrate_linear:
            - 0.0 -> 0.0
            - 134 -> 58

binary_sensor:
  - platform: gpio
    internal: true
    pin:
      number: GPIO18
      mode: INPUT_PULLDOWN
      inverted: False
    name: ${display_name} Button1
    on_press:
      - switch.toggle: relay1
  - platform: gpio
    internal: true
    pin:
      number: GPIO17
      mode: INPUT_PULLDOWN
      inverted: False
    name: ${display_name} Button2
    on_press:
      - switch.toggle: relay2
  - platform: template
    name: ${display_name} daylight
    device_class: light
    lambda: |-
      // the senor reads 3.1 volts if there is light and 0.5 if there is not light not much inbetween
      if (id(lux_sensor).state > 2) {
        // there is daylight outside.
        return true;
      } else {
        // there is no daylight outside (e.g. it is dark).
        return false;
      }

status_led:
  pin:
    number: GPIO5
    inverted: true
```
