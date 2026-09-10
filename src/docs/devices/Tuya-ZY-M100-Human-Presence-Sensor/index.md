---
title: Tuya ZY-M100 Human Presence Sensor
date-published: 2022-12-23
type: sensor
standard: global
---

![Tuya ZY-M100](tuya-zy-m100.jpg "Tuya ZY-M100")

## General Notes

The Tuya ZY-M100 Sensor uses the UART on pin 15 and 16. This Sensor comes with a WBR3 chip and requires replacement in
order to be used with ESPHome.
It is still possible to convert these switches to ESPHome by replacing the WBR3 chip with an Espressif
ESP8685-WROOM-04-H2/H4 or Ai Thinker ESP-C3-12F or any ESP-12 Variant chip and this process will require heat gun,
soldering tools and moderate soldering skill, for all chip replacements can be made easier with low melt solder as well.

## Flashing

Flash using ESP Web install and select ESP32-C3 option.

To put ESP32-C3 in flash mode EN needs to be pulled high and GPIO9 need to be pulled low. May take a 2-3 attempts, but
just disconnect and reconnect 3V3 while keeping GPIO9 pulled low and click the retry button again until it works.

The [datasheet](https://docs.ai-thinker.com/_media/esp32/docs/esp-c3-12f_specification.pdf) references GPIO8 which needs
to be pulled low during flashing, use the following board to achieve this you can purchase ([AliExpress][1],
[Amazon][2], [Banggood][3]) a test board for effortless flashing. Just drop the module in, plug in the USB cable, hold
the boot button while powering up and flash!

[1]: https://www.aliexpress.com/item/1005002668365356.html
[2]: https://www.amazon.com/dp/B083QB2XVP
[3]: https://www.banggood.com/ESP8266-Test-Board-Burner-Development-Board-WIFI-Module-For-ESP-01-ESP-01S-ESP-12E-ESP-12F-ESP-12S-ESP-18T-p-1684992.html

![Test Board](test_board.jpg "Test Board")

| ESP32 Pin | USB Serial Pin | Comments                                                           |
| --------- | -------------- | ------------------------------------------------------------------ |
| 3V3       | 3V3            | Connect to dedicated 3V3 1A power supply if encountering brown out |
| G         | GND            |                                                                    |
| IO9       | Ground         | Round contact pad on back of board, pull low BEFORE attaching 3V3  |
| IO8       | 3V3            | Could not find this pin, but it didn't seem to be required         |
| TX        | RX             |                                                                    |
| RX        | TX             |                                                                    |
| EN        | 3V3            | Pull high to enable ESP32 (do not leave floating)                  |

## Running

For normal operation connect EN to VCC (pull high) to enable the C3 chip. GPIO9 has an internal pullup and it needs to
be high on power up for the module to boot so try and avoid that pin similar to GPIO0 on ESP8266.

ESP32's are power hungry on boot and the USB to serial adapter might not be able to provide enough power for that. Use a
stable 3.3v power supply that can supply more than 1A.

## GPIO Pinout for ESP32-C3

| Pin    | Function |
| ------ | -------- |
| GPIO20 | RX       |
| GPIO21 | TX       |

## Getting it up and running

The sensor is a Tuya device, however as the main WBR3 chip needs to be replaced with a ESP12 Variant or ESP32-C3-12F,
which is easily flashed before soldering. After that, you can use ESPHome's OTA functionality to make any further
changes.

## Configuration for ESP-IDF

```yaml
substitutions:
  device_ssid: "Tuya Sensor"
  device_name: tuyasensor
  device_description: "Tuya ZY-M100 Human Prescence Sensor ESP32-C3 ESP-IDF"
  friendly_name: "Tuya ZY-M100 Human Prescence Sensor"
  main_device_id: "tuyasensor" # Put the name that you want to see in Home Assistant.
  project_name: "tuya.zy-m100-wifi-esp-idf"
  project_version: "1.0"

esphome:
  name: ${device_name}
  comment: ${device_description}
  project:
    name: tuya.zy-m100-wifi
    version: "1.0"
  platformio_options:
    board_build.flash_mode: dio
  project:
    name: "${project_name}"
    version: "${project_version}"

esp32:
  variant: esp32c3
  framework:
    type: esp-idf

# Enable Home Assistant API
api:
  password: !secret api_password
  encryption:
    key: !secret api_encryption_key

# Enable logging
logger:

ota:
  safe_mode: true
  password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  power_save_mode: none
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: ${device_ssid} Fallback Hotspot
    password: !secret ap_password

uart:
  rx_pin: GPIO20
  tx_pin: GPIO21
  baud_rate: 115200

# Register the Tuya MCU connection
tuya:

sensor:
  # WiFi Signal sensor.
  - platform: wifi_signal
    name: ${friendly_name} Signal strength
    update_interval: 60s
    internal: true
  # Uptime Sensor
  - platform: uptime
    name: "${friendly_name} Uptime"
    id: uptime_sensor
    update_interval: 360s
    on_raw_value:
      then:
        - text_sensor.template.publish:
            id: uptime_human
            state: !lambda |-
              int seconds = round(id(uptime_sensor).raw_state);
              int days = seconds / (24 * 3600);
              seconds = seconds % (24 * 3600);
              int hours = seconds / 3600;
              seconds = seconds % 3600;
              int minutes = seconds /  60;
              seconds = seconds % 60;
              return (
                (days ? to_string(days) + "d " : "") +
                (hours ? to_string(hours) + "h " : "") +
                (minutes ? to_string(minutes) + "m " : "") +
                (to_string(seconds) + "s")
              ).c_str();
    # Light Sensor
  - platform: tuya
    name: "${friendly_name} Light Intensity"
    id: light_intensity
    sensor_datapoint: 104
    unit_of_measurement: "lux"
    icon: "mdi:brightness-5"
    device_class: "illuminance"
    state_class: "measurement"
    # Distance from Detected Object
  - platform: "tuya"
    name: "${friendly_name} Target Distance"
    id: target_distance
    sensor_datapoint: 9
    unit_of_measurement: "cm"
    icon: "mdi:eye"
    device_class: "distance"
    state_class: "measurement"

text_sensor:
  # Expose WiFi information as sensors.
  - platform: wifi_info
    ip_address:
      name: ${friendly_name} IP
    ssid:
      name: ${friendly_name} SSID
    bssid:
      name: ${friendly_name} BSSID
  # Expose Uptime
  - platform: template
    name: ${friendly_name} Uptime Human Readable
    id: uptime_human
    icon: mdi:clock-start

# Restart Buttons
button:
  - platform: restart
    id: "restart_device"
    name: "${friendly_name} Restart"
    entity_category: "diagnostic"
  - platform: safe_mode
    id: "restart_device_safe_mode"
    name: "${friendly_name} Restart (Safe Mode)"
    entity_category: "diagnostic"
number:
    # Sensitivity
  - platform: "tuya"
    name: "${friendly_name} Sensitivity"
    number_datapoint: 2
    min_value: 0
    max_value: 9
    step: 1
    icon: "mdi:ray-vertex"
    # Min Detection Distance
  - platform: "tuya"
    name: "${friendly_name} Near Detection"
    number_datapoint: 3
    min_value: 0
    max_value: 1000
    step: 1
    mode: slider
    unit_of_measurement: "cm"
    icon: "mdi:signal-distance-variant"
    # Max Detection Distance
  - platform: "tuya"
    name: "${friendly_name} Far Detection"
    number_datapoint: 4
    min_value: 0
    max_value: 1000
    step: 1
    mode: slider
    unit_of_measurement: "cm"
    icon: "mdi:signal-distance-variant"
    # Detection Delay
  - platform: "tuya"
    name: "${friendly_name} Detection Delay"
    number_datapoint: 101
    min_value: 0
    max_value: 100
    step: 1
    unit_of_measurement: "s"
    mode: slider
    icon: "mdi:clock"
    # Fading Time - Cool Down Period
  - platform: "tuya"
    name: "${friendly_name} Fading Time"
    number_datapoint: 102
    min_value: 0
    max_value: 1500
    step: 1
    unit_of_measurement: "s"
    mode: slider
    icon: "mdi:clock"

select:
    # Self Check Enum
  - platform: "tuya"
    name: "${friendly_name} Self Check Result"
    icon: mdi:eye
    enum_datapoint: 6
    options:
      0: Checking
      1: Check Success
      2: Check Failure
      3: Others
      4: Comm Fault
      5: Radar Fault

binary_sensor:
    # Status
  - platform: status
    name: "${friendly_name} Status"
    # Occupancy Binary Sensor
  - platform: "tuya"
    name: "${friendly_name} Presence State"
    sensor_datapoint: 1
    device_class: occupancy
```

## Configuration for Arduino (not recommended, but has been working fine for ages)

```yaml
substitutions:
  device_ssid: "Tuya Sensor"
  device_name: tuyasensor
  device_description: "Tuya ZY-M100 Human Prescence Sensor ESP32-C3 Arduino"
  friendly_name: "Tuya ZY-M100 Human Prescence Sensor"
  main_device_id: "tuyasensor" # Put the name that you want to see in Home Assistant.
  project_name: "tuya.zy-m100-wifi-arduino"
  project_version: "1.0"

esphome:
  name: ${device_name}
  comment: ${device_description}
  project:
    name: "${project_name}"
    version: "${project_version}"
  platformio_options:
    board_build.flash_mode: dio

esp32:
  variant: esp32c3
  framework:
    type: arduino
    version: 2.0.5
    platform_version: 5.2.0

# Enable Home Assistant API
api:
  password: !secret api_password
  encryption:
    key: !secret api_encryption_key

# Enable logging
logger:

ota:
  safe_mode: true
  password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  power_save_mode: none
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: ${device_ssid} Fallback Hotspot
    password: !secret ap_password

captive_portal:

web_server:
  port: 80

uart:
  rx_pin: GPIO20
  tx_pin: GPIO21
  baud_rate: 115200

# Register the Tuya MCU connection
tuya:

sensor:
  # WiFi Signal sensor.
  - platform: wifi_signal
    name: ${friendly_name} Signal strength
    update_interval: 60s
    internal: true
  # Uptime Sensor
  - platform: uptime
    name: "${friendly_name} Uptime"
    id: uptime_sensor
    update_interval: 360s
    on_raw_value:
      then:
        - text_sensor.template.publish:
            id: uptime_human
            state: !lambda |-
              int seconds = round(id(uptime_sensor).raw_state);
              int days = seconds / (24 * 3600);
              seconds = seconds % (24 * 3600);
              int hours = seconds / 3600;
              seconds = seconds % 3600;
              int minutes = seconds /  60;
              seconds = seconds % 60;
              return (
                (days ? to_string(days) + "d " : "") +
                (hours ? to_string(hours) + "h " : "") +
                (minutes ? to_string(minutes) + "m " : "") +
                (to_string(seconds) + "s")
              ).c_str();
    # ESP32 Temperature
  - platform: template
    name: ${friendly_name} ESP32 Internal Temperature
    id: temp
    lambda: return temperatureRead();
    unit_of_measurement: °C
    accuracy_decimals: 2
    # Light Sensor
  - platform: tuya
    name: "${friendly_name} Light Intensity"
    id: light_intensity
    sensor_datapoint: 104
    unit_of_measurement: "lux"
    icon: "mdi:brightness-5"
    device_class: "illuminance"
    state_class: "measurement"
    # Distance from Detected Object
  - platform: "tuya"
    name: "${friendly_name} Target Distance"
    id: target_distance
    sensor_datapoint: 9
    unit_of_measurement: "cm"
    icon: "mdi:eye"
    device_class: "distance"
    state_class: "measurement"

text_sensor:
  # Expose WiFi information as sensors.
  - platform: wifi_info
    ip_address:
      name: ${friendly_name} IP
    ssid:
      name: ${friendly_name} SSID
    bssid:
      name: ${friendly_name} BSSID
  # Expose Uptime
  - platform: template
    name: ${friendly_name} Uptime Human Readable
    id: uptime_human
    icon: mdi:clock-start

# Restart Buttons
button:
  - platform: restart
    id: "restart_device"
    name: "${friendly_name} Restart"
    entity_category: "diagnostic"
  - platform: safe_mode
    id: "restart_device_safe_mode"
    name: "${friendly_name} Restart (Safe Mode)"
    entity_category: "diagnostic"

number:
  # Sensitivity
  - platform: "tuya"
    name: "${friendly_name} Sensitivity"
    number_datapoint: 2
    min_value: 0
    max_value: 9
    step: 1
    icon: "mdi:ray-vertex"
    # Min Detection Distance
  - platform: "tuya"
    name: "${friendly_name} Near Detection"
    number_datapoint: 3
    min_value: 0
    max_value: 1000
    step: 1
    mode: slider
    unit_of_measurement: "cm"
    icon: "mdi:signal-distance-variant"
    # Max Detection Distance
  - platform: "tuya"
    name: "${friendly_name} Far Detection"
    number_datapoint: 4
    min_value: 0
    max_value: 1000
    step: 1
    mode: slider
    unit_of_measurement: "cm"
    icon: "mdi:signal-distance-variant"
    # Detection Delay
  - platform: "tuya"
    name: "${friendly_name} Detection Delay"
    number_datapoint: 101
    min_value: 0
    max_value: 100
    step: 1
    unit_of_measurement: "s"
    mode: slider
    icon: "mdi:clock"
    # Fading Time - Cool Down Period
  - platform: "tuya"
    name: "${friendly_name} Fading Time"
    number_datapoint: 102
    min_value: 0
    max_value: 1500
    step: 1
    unit_of_measurement: "s"
    mode: slider
    icon: "mdi:clock"

select:
  # Self Check Enum
  - platform: "tuya"
    name: "${friendly_name} Self Check Result"
    icon: mdi:eye
    enum_datapoint: 6
    options:
      0: Checking
      1: Check Success
      2: Check Failure
      3: Others
      4: Comm Fault
      5: Radar Fault

binary_sensor:
  # Status
  - platform: status
    name: "${friendly_name} Status"
    # Occupancy Binary Sensor
  - platform: "tuya"
    name: "${friendly_name} Presence State"
    sensor_datapoint: 1
    device_class: occupancy
```
