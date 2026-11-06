---
title: Shelly Uni
date-published: 2023-11-30
type: sensor
standard: eu
board: esp8266
difficulty: 2
---

## Notes

Shelly UNI is the smallest universal module with two available digital inputs and potential-free outputs, providing
endless functionalities.

- 2 digital inputs
- 2 potential-free outputs
- ADC can measure any voltage from 0 to 30 VDC
- supports DS18B20 temperature sensors or a DHT22 humidity and temperature sensor, ...

![device](./shelly_uni_625x625.webp "Device picture")
![wiring](./shelly_uni_scheme-1536x717.jpg "Wiring diagrams")
![header](./shelly_uni_gpio.jpg "GPIO header pinout")

## GPIO Pinout

| Pin | GPIO   | Function  | Wire   |
| --- | ------ | --------- | ------ |
|     | GPIO00 | Red LED   |        |
| 1   |        | VAC, VDC+ | red    |
| 2   |        | VAC, VDC- | black  |
| 3   | GPIO17 | ADC Input | white  |
| 4   |        | 3.3V      | yellow |
| 5   | GPIO05 | Sensor    | blue   |
| 6   |        | GND       | green  |
| 7   | GPIO12 | Input 1   | orange |
| 8   | GPIO13 | Input 2   | brown  |
|     | GPIO15 | Output 1  |        |
|     | GPIO04 | Output 2  |        |
|     | GPIO14 | ADC Range |        |

## ADC range Selector

ADC Input (GPIO17) have two ranges (0 - 15 or 0 - 30V), selectable by GPIO14.
If you configure GPIO14 as switch and turn it on you get 30V input range.
Tested by [Protoncek](https://community.home-assistant.io/u/Protoncek).

Device return pure ADC readings, so need to multiply to get actual voltage.
Linear approximation looks more or less acceptable.
Possible multiply factors: 14.64 on 15V range, 30.64 on 30V range.

## Basic Configuration

```yaml
esphome:
  name: Shelly Uni

esp8266:
  board: esp_wroom_02
  restore_from_flash: true

logger:
  esp8266_store_log_strings_in_flash: False

logger:
  level: INFO

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

api:
  encryption:
    key: !secret esp_api_key

ota:
  password: !secret ota_secret

external_components:
  - source: github://nrandell/dallasng

dallasng:
  - pin:
      number: GPIO05
      mode:
        input: True
        pullup: True
    update_interval: '7s'

sensor:
  - platform: dallasng
    address: 0xaf00000001b25428
    name: "Temperature"
    filters:
      - filter_out: 85.0

  - platform: wifi_signal
    name: "RSSI"
    id: sensor_rssi
    update_interval: 90s
    entity_category: "diagnostic"

  - platform: uptime
    name: "Uptime"
    id: sensor_uptime
    update_interval: 300s
    entity_category: "diagnostic"

  - platform: adc
    pin: GPIO17
    name: Voltage
    id: sensor_voltage
    accuracy_decimals: 1
    update_interval: 9s
    filters:
      - lambda: if (id(adc_range).state) return x*30.64; else return x*14.64;

button:
  - platform: restart
    name: "Restart"
    id: button_restart

switch:
  - platform: output
    name: "Output 1"
    output: out_1
  - platform: output
    name: "Output 2"
    output: out_2
  - platform: gpio
    id: adc_range
    name: ADC Range
    pin: GPIO14
    restore_mode: RESTORE_DEFAULT_ON

output:
  - platform: gpio
    id: out_1
    pin:
      number: GPIO15
      inverted: False
  - platform: gpio
    id: out_2
    pin:
      number: GPIO04
      inverted: False

binary_sensor:
  - platform: status
    name: "Status"
    id: sensor_status

  - platform: template
    name: "API connected"
    id: sensor_api_connected
    internal: True
    entity_category: 'diagnostic'
    device_class: 'connectivity'
    lambda: return global_api_server->is_connected();
    on_press:
      - light.turn_on: led_status
    on_release:
      - light.turn_off: led_status

  - platform: gpio
    name: "Input 1"
    pin:
      number: GPIO12
      mode: INPUT_PULLUP
      inverted: False
  - platform: gpio
    name: "Input 2"
    pin:
      number: GPIO13
      mode: INPUT_PULLUP
      inverted: False

light:
  - platform: status_led
    name: "LED"
    id: led_status
    pin:
      number: GPIO00
      inverted: True
    internal: True
    restore_mode: ALWAYS_OFF
```
