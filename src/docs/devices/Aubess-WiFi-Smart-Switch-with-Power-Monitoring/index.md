---
title: Aubess WiFi Smart Switch with Power Monitoring
date-published: 2024-05-06
type: switch
standard: global
board: bk72xx
---

![Product Image](./Aubess-WiFi-Smart-Switch-with-Power-Monitoring.jpg "Product Image")

Maker: [https://aubess.net/](https://aubess.net/)

Also on Aliexpress.

## GPIO Pinout

| Pin | Function        |
| --- | --------------- |
| RX1 | BL0942 Rx       |
| TX1 | BL0942 Tx       |
| P23 | Button          |
| P24 | External Switch |
| P26 | Relay           |
| P8  | Status Led      |

## Basic Configuration

```yaml
esphome:
  name: aubesspm01
  friendly_name: AubessPM01

bk72xx:
  board: generic-bk7231n-qfn32-tuya

logger:
api:
captive_portal:
ota:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

uart:
  id: uart_bus
  tx_pin: TX1
  rx_pin: RX1
  baud_rate: 4800
  stop_bits: 1

binary_sensor:
  - platform: gpio
    pin:
      number: P23
      mode:
        input: true
        pullup: true
    id: "AubessPM01_button"
    on_press:
      - switch.toggle: aubespm01
  - platform: gpio
    pin:
      number: P24
      mode:
        input: true
        pullup: True
    id: "AubessPM01_switch"
    on_press:
      - switch.toggle: aubespm01
    on_release:
      - switch.toggle: aubespm01

  - platform: status
    name: "Status"

sensor:
  - platform: wifi_signal
    update_interval: 10s
    id: wifi_signal_db
  - platform: uptime
    name: "Uptime"
  - platform: copy
    source_id: wifi_signal_db
    name: "WiFi Signal Percent"
    filters:
      - lambda: return min(max(2 * (x + 100.0), 0.0), 100.0);
    unit_of_measurement: "%"
  - platform: bl0942
    uart_id: uart_bus
    current:
      name: AubessPM01 Current
    voltage:
      name: AubessPM01 Voltage
    power:
      name: AubessPM01 Power
      filters:
        multiply: -1
    energy:
      name: AubessPM01 Energy
    frequency:
      name: AubessPM01 Frequency

button:
  - platform: restart
    name: "Restart"

switch:
  - platform: gpio
    name: "Geyser"
    pin: P26
    id: aubespm01
    icon: mdi:water-boiler
    restore_mode: RESTORE_DEFAULT_OFF

status_led:
  pin:
    number: P8
    inverted: yes

time:
  - platform: homeassistant
    id: homeassistant_time

text_sensor:
  - platform: wifi_info
    ip_address:
      name: "IP Address"
    ssid:
      name: "Connected SSID"
  - platform: libretiny
    version:
      name: LibreTiny Version
```
