---
title: Inkbird ITC-308-WIFI
date-published: 2023-11-22
type: misc
standard: uk, us, eu, au
board: esp8266
made-for-esphome: False
difficulty: 4
---

![Inkbird ITC-308-WIFI](Inkbird-ITC-308-WIFI.png "Inkbird ITC-308-WIFI")

The Inkbird ITC-308-WIFI is a wireless temperature controller that comes in a variety of socket types for independant
refridgeration and heating of wired devices.

## WiFi Modules

Older models ship with a Tuya TYWE3S module, which is an Espressif ESP8266-based module. Later models have replaced the
module with the Tuya WBR3S module, utilizing the Realtek RTL8720DN chip. It's important to note that as of late 2023,
LibreTiny, and therefore ESPHome, do not offer support for this particular chipset.  It is possible to solder an ESP12-S
which is pin compatible in place of the WBR3 module and everything works the same.

## Flashing

The TYWE3S sits on a daughter board which needs to be desoldered before flashing.  The RST and EN pins to be held at
3.3V in order to programmable.

## Board Configuration

```yaml
esphome:
  # Required to get the relay status at boot
  on_boot:
    priority: 600
    then:
        - lambda: |-
            if ((id(relay_status_internal).state == 1)) {
              id(relay_status).publish_state("Cooling");
            }
            else if ((id(relay_status_internal).state == 2)) {
              id(relay_status).publish_state("Off");
            }
            else if ((id(relay_status_internal).state == 3)) {
              id(relay_status).publish_state("Heating");
            }

esp8266:
  board: esp01_1m

logger:
  baud_rate: 0

uart:
  rx_pin: GPIO3
  tx_pin: GPIO1
  baud_rate: 9600

tuya:

sensor:
  # WiFi Signal Sensor
  - platform: wifi_signal
    name: "${friendly_name} WiFi Status"
    update_interval: 60s
  # Temperature
  - platform: "tuya"
    name: "Temperature"
    sensor_datapoint: 104
    accuracy_decimals: 1
    icon: mdi:thermometer
    unit_of_measurement: "°C"
    filters:
     - multiply: 0.1
  # Relay status
  - platform: "tuya"
    id: "relay_status_internal"
    sensor_datapoint: 115
    internal: true
    on_value:
      then:
        - lambda: |-
            if ((id(relay_status_internal).state == 1)) {
              id(relay_status).publish_state("Cooling");
            }
            else if ((id(relay_status_internal).state == 2)) {
              id(relay_status).publish_state("Off");
            }
            else if ((id(relay_status_internal).state == 3)) {
              id(relay_status).publish_state("Heating");
            }
text_sensor:
  - platform: template
    id: "relay_status"
    name: "Relay Status"
    icon: "mdi:play-pause"
    update_interval: 60s

number:
  # Temperature Calibration
  - platform: "tuya"
    name: "Calibration"
    number_datapoint: 102
    min_value: -15
    max_value: 15
    step: 0.1
    unit_of_measurement: "°C"
    multiply: 10
    icon: mdi:thermometer
  # Temperature Set Point
  - platform: "tuya"
    name: "Temperature Set Point"
    number_datapoint: 106
    min_value: -50.00
    max_value: 99.90
    step: 0.1
    unit_of_measurement: "°C"
    multiply: 10
    icon: mdi:thermometer
  # Compressor Delay Time
  - platform: "tuya"
    name: "Compressor Delay Time"
    number_datapoint: 108
    min_value: 0
    max_value: 10
    step: 1
    unit_of_measurement: "Minutes"
    icon: mdi:clock
  # Alarm High Limit
  - platform: "tuya"
    name: "Alarm High Limit"
    number_datapoint: 109
    min_value: -50.00
    max_value: 99.90
    step: 0.1
    multiply: 10
    icon: mdi:thermometer
  # Alarm Low Limit
  - platform: "tuya"
    name: "Alarm Low Limit"
    number_datapoint: 110
    min_value: -50.00
    max_value: 99.90
    step: 0.1
    multiply: 10
    icon: mdi:thermometer
  # Heating Differential
  - platform: "tuya"
    name: "Heating Differential Value"
    number_datapoint: 117
    min_value: 0.30
    max_value: 15
    step: 0.1
    multiply: 10
    icon: mdi:thermometer
  # Cooling Differential
  - platform: "tuya"
    name: "Cooling Differential Value"
    number_datapoint: 118
    min_value: 0.30
    max_value: 15
    step: 0.1
    multiply: 10
    icon: mdi:thermometer
