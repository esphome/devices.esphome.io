---
title: KinCony-KC868-M16v2
date-published: 2023-07-25
type: sensor
standard: global
board: esp32
---

![Product](KC868-M16v2-1_06.jpg "Product Image")

## Resources

- [ESP32 pin define details](https://www.kincony.com/forum/showthread.php?tid=3087)
- [YouTube video tour](https://youtu.be/JfqzXulZ73A)

## ESPHome Configuration

Here is an example YAML configuration for the KinCony-KC868-M16v2 board with custom sensor integration.

```yaml
esphome:
  name: m16v2
  includes:
    - zmpt101b/ZMPT101B.h
    - zmpt101b/ZMPT101B.cpp
    - zmpt101b/zmpt101b_custom_sensor.h

esp32:
  variant: esp32
  framework:
    type: arduino

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: "D69bY/GXlmjYkovak6WIhgmbOH8vwyqvMxIHBriYoaY="

ethernet:
  type: LAN8720
  mdc_pin: GPIO23
  mdio_pin: GPIO18
  clk_mode: GPIO17_OUT
  phy_addr: 0

i2c:
  sda: 4
  scl: 5
  scan: true
  id: bus_a

cd74hc4067:
  - id: cd74hc4067_1
    pin_s0: 32
    pin_s1: 33
    pin_s2: 13
    pin_s3: 16

web_server:
  port: 80

font:
  - file: "gfonts://Roboto"
    id: roboto
    size: 20

display:
  - platform: ssd1306_i2c
    model: "SSD1306 128x64"
    address: 0x3C
    lambda: |-
      it.printf(0, 0, id(roboto), "T: %.1f°C", id(temperature).state);
      it.printf(0, 20, id(roboto), "H: %.1f%%", id(humidity).state);
      it.printf(0, 40, id(roboto), "AC:%.1fV", id(voltage_1).state);
sensor:
  - platform: custom
    lambda: |-
      auto my_sensor34 = new ZMPT101BSensor(34);
      auto my_sensor36 = new ZMPT101BSensor(36);
      auto my_sensor39 = new ZMPT101BSensor(39);
      App.register_component(my_sensor34);
      App.register_component(my_sensor36);
      App.register_component(my_sensor39);
      return {my_sensor34, my_sensor36, my_sensor39};
    sensors:
      - name: "m16--AI zmpt 34"
        id: voltage_1
        unit_of_measurement: V
        accuracy_decimals: 1
        state_class: "measurement"
      - name: "m16--AI zmpt 36"
        id: voltage_2
        unit_of_measurement: V
        accuracy_decimals: 1
        state_class: "measurement"
      - name: "m16--AI zmpt 39"
        id: voltage_3
        unit_of_measurement: V
        accuracy_decimals: 1
        state_class: "measurement"

  - platform: sht3xd
    temperature:
      name: "sht Temperature"
      id: temperature
    humidity:
      name: "sht Humidity"
      id: humidity
    address: 0x44
    update_interval: 5s

  - platform: adc
    pin: 35
    id: adc35
    update_interval: never
    attenuation: 11db
  - platform: cd74hc4067
    id: ai1
    number: 0
    sensor: adc35
    update_interval: 60s
  - platform: cd74hc4067
    id: ai2
    number: 1
    sensor: adc35
    update_interval: 60s
  # ... up to ai16
  - platform: ct_clamp
    sensor: ai1
    id: Measured_Current_1
    name: "Measured Current-1"
    update_interval: 5s
    filters:
      - calibrate_linear:
          - 0.0034 -> 0
          - 0.31749 -> 8.95608
time:
  - platform: sntp
    id: my_time
