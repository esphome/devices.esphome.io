---
title: Sonoff BASIC R4 v1.0
date-published: 2023-11-28
type: relay
standard: global
board: esp32
difficulty: 3
---

Sonoff BASIC R4 is upgraded with esp32c3 and a new 'magic mode switch' feature that can be enabled with custom component
by @ssieb.

Pinouts and pictures are taken from [digiblur's website](https://digiblur.com/wiki/devices/relays/sonoff-basic-r4/)

![alt text](sonoff_basic_r4.webp "Sonoff BASIC R4")

## GPIO Pinout

| Pin   | Function                    |
| ----- | --------------------------- |
| GPIO4 | Relay                       |
| GPIO5 | Pin for 'Magic Switch Mode' |
| GPIO6 | Blue LED                    |
| GPIO9 | Button                      |

## PCB

![alt text](sonoff_basic_r4_pcb.webp "Sonoff BASIC R4 PCB")

![alt text](sonoff_basic_r4_pcb_rear.webp "Sonoff BASIC R4 PCB rear")

## Basic Configuration

```yaml
esphome:
  name: basic-r4
  friendly_name: basic-r4
  platformio_options:
    board_build.mcu: esp32c3
    board_build.variant: esp32c3

esp32:
  variant: esp32c3
  framework:
    type: esp-idf
    sdkconfig_options:
      CONFIG_BT_BLE_50_FEATURES_SUPPORTED: y
      CONFIG_BT_BLE_42_FEATURES_SUPPORTED: y
      CONFIG_ESP_TASK_WDT_TIMEOUT_S: "10"
# Would not boot with the stock ESP32-C3 ESPHome 2023.9 default YAML config until I added/change the settings above for ESP32C3
web_server:

mdns:

logger:

captive_portal:

api:
  password: !secret api_password

ota:
  password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

#magic switch mode
external_components:
  - source:
      type: git
      url: https://github.com/ssieb/esphome_components
    components: [magic_switch]
    refresh: 1min

magic_switch:
  pin: 5
  on_switch:
    - switch.toggle: switch_1

esp32_ble_tracker:
  scan_parameters:
    active: true
    interval: 1100ms
    window: 1100ms

bluetooth_proxy:
  active: true

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO9
      mode:
        input: true
        pullup: true
      inverted: true
    id: button_1
    on_press:
      then:
        - switch.toggle: switch_1

switch:
  - platform: gpio
    name: Tomada
    id: switch_1
    pin:
      number: 04
    restore_mode: ALWAYS_OFF

status_led:
  pin:
    number: GPIO6
    inverted: yes
```
