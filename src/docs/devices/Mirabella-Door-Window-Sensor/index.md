---
title: Mirabella Genio Door & Window Sensor 
date-published: 2020-01-26
type: sensor
standard: global
board: esp8266
---


## General Notes

This is for
[Mirabella Genio Door & Window Sensor](https://www.mirabellagenio.com.au/product-range/mirabella-genio-wi-fi-door-and-window-sensor/).

The file [sb1_uart.h](https://github.com/brandond/esphome-tuya_pir/blob/master/sb1_uart.h) must be added to your Home
Assistant /config/esphome directory for a succesful compile.

Credit to [Brandon D](https://github.com/brandond) for the file and esphome config

![Mirabella Genio Door & Window Sensor](./Mirabella-Door-Window-Sensor.jpg "Mirabella Genio Door & Window Sensor")

## Basic Configuration

```yaml
# Basic Config
# https://mirabellagenio.net.au/door-%26-window-sensor
esphome:
  name: mirabella_genio_door_window_sensor
  arduino_version: 2.5.1
  includes:
    - sb1_uart.h

esp8266:
  board: esp01_1m
  board_flash_mode: dout

wifi:
  ssid: 'Wifi SSID'
  password: !secret wifi_pw
  fast_connect: true

mqtt:
  broker: 'x.x.x.x'
  username: !secret mqtt_un
  password: !secret mqtt_pw
  birth_message:
  shutdown_message:
  will_message:

uart:
  - tx_pin: 1
    rx_pin: 3
    baud_rate: 9600
    id: uart0

ota:

logger:
  level: INFO
  hardware_uart: UART1

sensor:
#  - platform: wifi_signal
#    name: "Door WiFi Signal"
#    update_interval: never
#    expire_after:
#    filters: []
  - platform: adc
    name: "Doow Window Battery"
    update_interval: 1s
    expire_after:
    pin: VCC
    filters:
      - calibrate_linear:
          # Map volts (from sensor) to % (for HA)
          - 2.8 -> 0.0
          - 3.6 -> 100
    unit_of_measurement: "%"
    accuracy_decimals: 0

binary_sensor:
  - platform: template
    id: door
    name: "Door Window Sensor"
    filters: []
    device_class: door
    lambda: "return {};"

custom_component:
  - id: sb1_uart
    lambda: |-
      auto component = new SB1UARTComponent(id(uart0), id(door));
      return {component};
```
