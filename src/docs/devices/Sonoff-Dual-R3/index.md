---
title: Sonoff Dual R3 & Lite
date-published: 2019-12-04
type: relay
standard: global
board: esp32
---

## Product Images

![pcb](./Sonoff-DualR3-Lite-PCB.jpg "DualR3 Lite PCB v1.0")

## GPIO Pinout

### Sonoff Dual R3 Lite - PCB version 1.x

| Pin    | Function                   |
| ------ | -------------------------- |
| GPIO13 | Status LED (blue/inverted) |
| GPIO00 | Push Button (inverted)     |
| GPIO27 | Relay 1 / LED 1 (red)      |
| GPIO14 | Relay 2 / LED 2 (red)      |
| GPIO32 | Switch 1 (inverted)        |
| GPIO33 | Switch 2 (inverted)        |

### Sonoff Dual R3 - PCB version 1.x,2.x

| Pin    | Function                   |
| ------ | -------------------------- |
| GPIO13 | Status LED (blue/inverted) |
| GPIO00 | Push Button (inverted)     |
| GPIO27 | Relay 1 / LED 1 (red)      |
| GPIO14 | Relay 2 / LED 2 (red)      |
| GPIO32 | Switch 1 (inverted)        |
| GPIO33 | Switch 2 (inverted)        |
| GPIO25 | power sensor UART Tx       |
| GPIO26 | power sensor UART Rx       |

For power measuring see CSE7761 Power Sensor (v1.x) or BL0939 Power Sensor (v2.x)

## Basic Configuration

```yaml
esphome:
  name: sonoff-dual-r3

esp32:
  variant: esp32

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

sensor:
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

button:
  - platform: restart
    name: "Restart"
    id: button_restart

light:
  - platform: status_led
    name: "LED"
    id: led_status
    pin:
      number: GPIO13
      inverted: True
    internal: True

switch:
  - platform: gpio
    name: "1"
    pin: GPIO27
    id: relay_1

  - platform: gpio
    name: "2"
    pin: GPIO14
    id: relay_2

binary_sensor:
  - platform: gpio
    name: "Button"
    id: sensor_button
    pin:
      number: GPIO00
      mode:
        input: True
        pullup: True
      inverted: True
    disabled_by_default: True
    icon: "mdi:radiobox-blank"
    filters:
      - delayed_on: 50ms
    on_press:
      - switch.toggle: relay_1

  - platform: gpio
    name: "1"
    pin:
      number: GPIO32
      mode:
        input: True
        pullup: True
      inverted: True
    filters:
      - delayed_on_off: 50ms
    on_press:
      - switch.turn_on: relay_1
    on_release:
      - switch.turn_off: relay_1

  - platform: gpio
    name: "2"
    pin:
      number: GPIO33
      mode:
        input: True
        pullup: True
      inverted: True
    filters:
      - delayed_on_off: 50ms
    on_press:
      - switch.turn_on: relay_2
    on_release:
      - switch.turn_off: relay_2
```

Dual R3 v1.x power meter configuration

```yaml
uart:
  tx_pin: GPIO25
  rx_pin: GPIO26
  baud_rate: 38400
  parity: EVEN
  stop_bits: 1

sensor:
  - platform: cse7761
    update_interval: 21s
    voltage:
      name: "Voltage"
    current_1:
      name: "Current 1"
      disabled_by_default: True
    current_2:
      name: "Current 2"
      disabled_by_default: True
    active_power_1:
      name: "Power 1"
    active_power_2:
      name: "Power 2"
```

Dual R3 v2.x power meter configuration

```yaml
uart:
  tx_pin: GPIO25
  rx_pin: GPIO26
  baud_rate: 4800
  parity: NONE
  stop_bits: 2

sensor:
  - platform: bl0939
    update_interval: 21s
    voltage:
      name: "Voltage"
    current_1:
      name: "Current 1"
      disabled_by_default: True
    current_2:
      name: "Current 2"
      disabled_by_default: True
    active_power_1:
      name: "Power 1"
    active_power_2:
      name: "Power 2"
    energy_1:
      name: "Energy 1"
    energy_2:
      name: "Energy 2"
    energy_total:
      name: "Energy Total"
```
