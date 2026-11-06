---
title: Duux Bora Dehumidifier (DXDH02)
date-published: 2025-07-10
type: misc
standard: eu
board: esp32
made-for-esphome: False
difficulty: 3
---

## Disassembly

The esp32 is mounted in a small case behind the front of the unit (hidden). To disassemble the unit remove all visible
screws including those behind the water tank when removed. The 2 halves (front and back) are held together by 2 hidden
screws behind the top control panel. To gain access to them remove the top carrying handle. This can be done by
carefully aligning it slightly forward (there is a small notch in the handle carrier and once you find the spot you can
easily pull the side of the handle and it will come right off). Dont use too much force. Once the carrying handle is
removed you can see the screws but still wont be able to reach them. For this you have to remove the top control panel.
The panel is hold in place by latches. To release these you have to slightly push against the panel to lift it up from
the newly gained holes untill it comes off - best to start by the corners. Once the panel is out you will have access to
the 2 screws, remove them. Now remove the front halve of the case. There is a small black case mounted just below the
fan. Remove the 2 screws so you can unmount it. Inside the case is the esp32.

## Flashing

Use the pads on the back of the pcb to flash:

| Pad | Connect to                        |
| --- | --------------------------------- |
| P10 | Serial adapter TXD                |
| P11 | Serial adapter RXD                |
| P13 | Short to GND for flashing (GPIO0) |
| P3  | Can be used as GND for P13        |

## GPIO Pinout

| Pin    | Function |
| ------ | -------- |
| GPIO00 | None     |
| GPIO01 | None     |
| GPIO02 | None     |
| GPIO03 | None     |
| GPIO04 | None     |
| GPIO05 | None     |
| GPIO09 | None     |
| GPIO10 | None     |
| GPIO12 | None     |
| GPIO16 | Tuya Rx  |
| GPIO14 | None     |
| GPIO17 | Tuya Tx  |
| GPIO16 | None     |
| FLAG   | None     |

## Basic Configuration

```yaml
esphome:
  name: $devicename
  friendly_name: "Duux Dehumidifier DXDH02"

esp32:
  variant: esp32
  framework:
    type: esp-idf

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key:

ota:
  password:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid:
    password:

captive_portal:

time:
  - platform: homeassistant
    id: homeassistant_time

uart:
  tx_pin: GPIO17
  rx_pin: GPIO16
  baud_rate: 9600
  debug:

# Register the Tuya MCU connection
tuya:
  on_datapoint_update:
    - sensor_datapoint: 11
      datapoint_type: bitmask
      then:
        - lambda: |-
            ESP_LOGD("main", "on_datapoint_update %s", format_hex_pretty(x).c_str());
            // only seen in the wild is decimal value 8, for Water Tank Full
            id(water_tank_full).publish_state((x >> 3) & 1);

binary_sensor:
  - platform: template
    id: water_tank_full
    name: "Water tank"
    device_class: problem
    icon: "mdi:water-alert"

switch:
  - platform: tuya
    name: "Power"
    switch_datapoint: 1
  - platform: tuya
    name: "Night mode"
    icon: "mdi:sleep"
    switch_datapoint: 5
  - platform: tuya
    name: "Child lock"
    icon: "mdi:lock"
    switch_datapoint: 7
  - platform: tuya
    name: "Cleaning Mode"
    icon: "mdi:monitor-shimmer"
    switch_datapoint: 101

number:
  - platform: tuya
    name: "Target humidity"
    number_datapoint: 4
    unit_of_measurement: "%"
    device_class: "humidity"
    min_value: 30
    max_value: 80
    step: 5

sensor:
  - platform: tuya
    name: "Humidity"
    sensor_datapoint: 3
    unit_of_measurement: "%"
    device_class: "humidity"
    accuracy_decimals: 0

select:
  - platform: tuya
    name: "Mode"
    icon: "mdi:cog"
    enum_datapoint: 2
    options:
      0: Auto
      1: Purify only
  - platform: tuya
    name: "Fan speed"
    icon: "mdi:fan"
    enum_datapoint: 6
    options:
      0: High
      1: Low
```
