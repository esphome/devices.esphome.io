---
title: Tuya Smart Weather Station
date-published: 2025-09-10
type: misc
standard: global
board: rtl87xx
difficulty: 5
---

## General Notes

These devices are sold under various brand names but typically share the same internal hardware and TuyaMCU protocol.

The stock firmware relies on the Tuya cloud for weather data. This ESPHome configuration liberates the device by
allowing it to connect directly to Home Assistant. It can then display weather data from any source you have configured
in Home Assistant, such as the OpenWeatherMap integration, a personal weather station, or any other weather service.

The configuration is built on the rtl87xx platform using the LibreTiny framework, we use a custom branch for this since
rtl8720c is not yet fully supported.
We also use a custom tuya component in order to correctly handle the weather commands from TuyaMCU.

![Tuya Smart Weather Station](./device.jpg "Tuya Smart Weather Station")

## Flashing Instuctions

This device is based on the WBR3 Tuya Module, you can check for flashing setup
[on the Elektroda forum](https://www.elektroda.com/rtvforum/topic4097185.html). With the WBR3 removed and with the probe
pins soldered you can use ltchiptool to flash it via UART. We strongly recommend using an external power source for the
3v3 power supply. Make sure to connect the GND of the supply and the serial converter together, so they share the same
GND reference.

## Features

### Home Assistant Integration

Pulls and displays real-time weather data (temperature, humidity, pressure, wind speed, UV index, real feel, and weather
condition) directly from your Home Assistant sensors.

### Local and RF Sensor Support

Displays and exposes data from its built-in sensor and up to three additional wireless RF sub-sensors.

## GPIO Pinout

| Pin  | Function                                      |
| ---- | --------------------------------------------- |
| PA13 | UART RX (Connects to TuyaMCU TX)              |
| PA14 | UART TX (Connects to TuyaMCU RX)              |
| PA12 | Connected to the board, unknown functionality |

## TuyaMCU DP IDs

| DP ID | Function             | Type    | Values / Notes                               |
| :---- | :------------------- | :------ | :------------------------------------------- |
| `102` | 24 Hour Format       | Boolean | `0`: 12h, `1`: 24h                           |
| `103` | Weather Condition    | Raw     | Unknown format                               |
| `105` | Temperature Unit     | Enum    | `0`: Celsius, `1`: Fahrenheit                |
| `106` | Panel Brightness     | Enum    | `0`: Off, `1`: 30%, `2`: 60%, `3`: 100%      |
| `108` | Panel Display Config | Raw     | 11-byte bitmask to show/hide screen elements |
| `109` | Wind Speed Unit      | Enum    | `0`: mph, `1`: km/h                          |
| `110` | Pressure Unit        | Enum    | `0`: hPa, `1`: mbar                          |
| `129` | Night Mode           | Boolean | `0`: Off, `1`: On                            |
| `130` | Night Mode Duration  | Raw     | 4 bytes: `[StartH] [StartM] [EndH] [EndM]`   |
| `131` | Local Temperature    | Value   | Integer, Celsius \* 10                       |
| `132` | Local Humidity       | Value   | Integer                                      |
| `133` | Sub1 Temperature     | Value   | Integer, Celsius \* 10                       |
| `134` | Sub1 Humidity        | Value   | Integer                                      |
| `135` | Sub2 Temperature     | Value   | Integer, Celsius \* 10                       |
| `136` | Sub2 Humidity        | Value   | Integer                                      |
| `137` | Sub3 Temperature     | Value   | Integer, Celsius \* 10                       |
| `138` | Sub3 Humidity        | Value   | Integer                                      |

## Example ESPHome Configuration

```yaml
# WBR3 based Tuya Smart Weather Station

esphome:
  name: weather-station
  friendly_name: weather-station

substitutions:
  temperature_entity: sensor.openweathermap_temperature
  humidity_entity: sensor.openweathermap_humidity
  pressure_entity: sensor.openweathermap_pressure
  realfeel_entity: sensor.openweathermap_feels_like_temperature
  uvi_entity: sensor.openweathermap_uv_index
  windspeed_entity: sensor.openweathermap_wind_speed
  # weathercode_entity will be translated to tuya code, if not
  # using openweather modify the translation table.
  weathercode_entity: sensor.openweathermap_weather_code

rtl87xx:
  board: generic-rtl8720cf-2mb-992k
  framework:
    version: 0.0.0
    # Adds OTA fixes from https://github.com/prokoma/libretiny
    # as well as fixing UART pins so pins 13 and 14 don't
    # fall into SW UART case.
    source: https://github.com/vitoralb/libretiny#1a3f8ce

# implements a PoC weather service to handle TuyaMCU weather
# commands
external_components:
  - source: github://vitoralb/esphome@2025.8.3
    components: [tuya]

logger:
  baud_rate: 0

captive_portal:

mdns:

api:
  password: ""
  reboot_timeout: 0s
  on_client_connected:
    then:
      - script.execute: retry_initial_weather_sync

ota:
  platform: esphome
  password: ""

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap: {}

time:
  - platform: homeassistant
    id: ha_time

datetime:
  - platform: template
    entity_category: CONFIG
    name: "Night Mode Start Time"
    id: night_mode_start
    type: time
    optimistic: true
    set_action:
      then:
        - lambda: |-
            std::vector<uint8_t> data;
            data.push_back(x.hour);
            data.push_back(x.minute);
            data.push_back(id(night_mode_end).hour);
            data.push_back(id(night_mode_end).minute);
            id(tuya_mcu).set_raw_datapoint_value(130, data);
  - platform: template
    entity_category: CONFIG
    name: "Night Mode End Time"
    id: night_mode_end
    type: time
    optimistic: true
    set_action:
      then:
        - lambda: |-
            std::vector<uint8_t> data;
            data.push_back(id(night_mode_start).hour);
            data.push_back(id(night_mode_start).minute);
            data.push_back(x.hour);
            data.push_back(x.minute);
            id(tuya_mcu).set_raw_datapoint_value(130, data);

uart:
  rx_pin: GPIO13
  tx_pin: GPIO14
  baud_rate: 9600

tuya:
  id: tuya_mcu
  time_id: ha_time
  on_datapoint_update:
    - sensor_datapoint: 130
      datapoint_type: raw
      then:
        - lambda: |-
            ESP_LOGD("main", "Received Night Mode update from MCU: %s", format_hex_pretty(x).c_str());
            if (x.size() == 4) { // [StartH][StartM][EndH][EndM]
              TimeEntityRestoreState start;
              TimeEntityRestoreState end;
              start.hour = x[0];
              start.minute = x[1];
              start.second = 0;
              end.hour = x[2];
              end.minute = x[3];
              end.second = 0;

              start.apply(id(night_mode_start));
              end.apply(id(night_mode_end));
            }

sensor:
  - platform: homeassistant
    id: current_temperature
    entity_id: ${temperature_entity}
    internal: true
    filters:
      round: 0
    on_value:
      then:
        - lambda: |-
            auto* weather_service = id(tuya_mcu).get_weather_service();
            if (weather_service != nullptr) {
              weather_service->set_weather_data_int("w.temp", x);
              weather_service->send_weather_data();
            }
  - platform: homeassistant
    id: current_humidity
    entity_id: ${humidity_entity}
    internal: true
    filters:
      round: 0
    on_value:
      then:
        - lambda: |-
            auto* weather_service = id(tuya_mcu).get_weather_service();
            if (weather_service != nullptr) {
              weather_service->set_weather_data_int("w.humidity", x);
              weather_service->send_weather_data();
            }
  - platform: homeassistant
    id: current_pressure
    entity_id: ${pressure_entity}
    internal: true
    filters:
      round: 0
    on_value:
      then:
        - lambda: |-
            auto* weather_service = id(tuya_mcu).get_weather_service();
            if (weather_service != nullptr) {
              weather_service->set_weather_data_int("w.pressure", x);
              weather_service->send_weather_data();
            }
  - platform: homeassistant
    id: current_realfeel
    entity_id: ${realfeel_entity}
    internal: true
    filters:
      round: 0
    on_value:
      then:
        - lambda: |-
            auto* weather_service = id(tuya_mcu).get_weather_service();
            if (weather_service != nullptr) {
              weather_service->set_weather_data_int("w.realFeel", x);
              weather_service->send_weather_data();
            }
  - platform: homeassistant
    id: current_uvi
    entity_id: ${uvi_entity}
    internal: true
    filters:
      round: 0
    on_value:
      then:
        - lambda: |-
            auto* weather_service = id(tuya_mcu).get_weather_service();
            if (weather_service != nullptr) {
              weather_service->set_weather_data_int("w.uvi", x);
              weather_service->send_weather_data();
            }
  - platform: homeassistant
    id: current_windspeed
    entity_id: ${windspeed_entity}
    internal: true
    on_value:
      then:
        - lambda: |-
            auto* weather_service = id(tuya_mcu).get_weather_service();
            if (weather_service != nullptr) {
              char buffer[8];
              snprintf(buffer, sizeof(buffer), "%.1f", (x / 3.6f));
              weather_service->set_weather_data_string("w.windSpeed", buffer);
              weather_service->send_weather_data();
            }
  - platform: homeassistant
    id: raw_weathercode
    entity_id: ${weathercode_entity}
    internal: true
    on_value:
      then:
        - component.update: current_weathercode
  - platform: tuya
    name: "Local Temperature"
    sensor_datapoint: 131
    device_class: "temperature"
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    filters:
      multiply: 0.1
  - platform: tuya
    name: "Local Humidity"
    sensor_datapoint: 132
    device_class: "humidity"
    unit_of_measurement: "%"
    accuracy_decimals: 0
  - platform: tuya
    name: "Sub1 Temperature"
    sensor_datapoint: 133
    device_class: "temperature"
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    filters:
      multiply: 0.1
  - platform: tuya
    name: "Sub1 Humidity"
    sensor_datapoint: 134
    device_class: "humidity"
    unit_of_measurement: "%"
    accuracy_decimals: 0
  - platform: tuya
    name: "Sub2 Temperature"
    sensor_datapoint: 135
    device_class: "temperature"
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    filters:
      multiply: 0.1
  - platform: tuya
    name: "Sub2 Humidity"
    sensor_datapoint: 136
    device_class: "humidity"
    unit_of_measurement: "%"
    accuracy_decimals: 0
  - platform: tuya
    name: "Sub3 Temperature"
    sensor_datapoint: 137
    device_class: "temperature"
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    filters:
      multiply: 0.1
  - platform: tuya
    name: "Sub3 Humidity"
    sensor_datapoint: 138
    device_class: "humidity"
    unit_of_measurement: "%"
    accuracy_decimals: 0

select:
  - platform: tuya
    name: "Display Brightness"
    entity_category: CONFIG
    enum_datapoint: 106
    options:
      "0": "Off"
      "1": "30%"
      "2": "60%"
      "3": "100%"
  - platform: tuya
    name: "Unit Temperature"
    entity_category: CONFIG
    enum_datapoint: 105
    options:
      "0": "Celsius"
      "1": "Fahrenheit"
  - platform: tuya
    name: "Unit Wind Speed"
    entity_category: CONFIG
    enum_datapoint: 109
    options:
      "0": "mph"
      "1": "km/h"
  - platform: tuya
    name: "Unit Pressure"
    entity_category: CONFIG
    enum_datapoint: 110
    options:
      "0": "hPa"
      "1": "mbar"

switch:
  - platform: tuya
    name: "Night Mode Enable"
    entity_category: CONFIG
    switch_datapoint: 129
  - platform: tuya
    name: "Display 24h Format"
    entity_category: CONFIG
    switch_datapoint: 102
  - platform: template
    entity_category: CONFIG
    name: "Display UV Index"
    id: show_uv
    optimistic: true
    restore_mode: RESTORE_DEFAULT_ON
    on_turn_on:
      - script.execute: assemble_and_send_display_config
    on_turn_off:
      - script.execute: assemble_and_send_display_config
  - platform: template
    name: "Display Wind Speed"
    entity_category: CONFIG
    id: show_wind
    optimistic: true
    restore_mode: RESTORE_DEFAULT_ON
    on_turn_on:
      - script.execute: assemble_and_send_display_config
    on_turn_off:
      - script.execute: assemble_and_send_display_config
  - platform: template
    entity_category: CONFIG
    name: "Display Pressure"
    id: show_pressure
    optimistic: true
    restore_mode: RESTORE_DEFAULT_ON
    on_turn_on:
      - script.execute: assemble_and_send_display_config
    on_turn_off:
      - script.execute: assemble_and_send_display_config
  - platform: template
    entity_category: CONFIG
    name: "Display Temperature"
    id: show_temp
    optimistic: true
    restore_mode: RESTORE_DEFAULT_ON
    on_turn_on:
      - script.execute: assemble_and_send_display_config
    on_turn_off:
      - script.execute: assemble_and_send_display_config
  - platform: template
    entity_category: CONFIG
    name: "Display Humidity"
    id: show_hum
    optimistic: true
    restore_mode: RESTORE_DEFAULT_ON
    on_turn_on:
      - script.execute: assemble_and_send_display_config
    on_turn_off:
      - script.execute: assemble_and_send_display_config
  - platform: template
    entity_category: CONFIG
    name: "Display Feels Like"
    id: show_feels
    optimistic: true
    restore_mode: RESTORE_DEFAULT_ON
    on_turn_on:
      - script.execute: assemble_and_send_display_config
    on_turn_off:
      - script.execute: assemble_and_send_display_config
  - platform: template
    entity_category: CONFIG
    name: "Display Local T&H"
    id: show_local
    optimistic: true
    restore_mode: RESTORE_DEFAULT_ON
    on_turn_on:
      - script.execute: assemble_and_send_display_config
    on_turn_off:
      - script.execute: assemble_and_send_display_config
  - platform: template
    entity_category: CONFIG
    name: "Display Sub T&H"
    id: show_sub
    optimistic: true
    restore_mode: RESTORE_DEFAULT_ON
    on_turn_on:
      - script.execute: assemble_and_send_display_config
    on_turn_off:
      - script.execute: assemble_and_send_display_config
  - platform: template
    entity_category: CONFIG
    name: "Display Date"
    id: show_date
    optimistic: true
    restore_mode: RESTORE_DEFAULT_ON
    on_turn_on:
      - script.execute: assemble_and_send_display_config
    on_turn_off:
      - script.execute: assemble_and_send_display_config
  - platform: template
    entity_category: CONFIG
    name: "Display Week"
    id: show_week
    optimistic: true
    restore_mode: RESTORE_DEFAULT_ON
    on_turn_on:
      - script.execute: assemble_and_send_display_config
    on_turn_off:
      - script.execute: assemble_and_send_display_config
  - platform: template
    entity_category: CONFIG
    name: "Display Weather"
    id: show_weather
    optimistic: true
    restore_mode: RESTORE_DEFAULT_ON
    on_turn_on:
      - script.execute: assemble_and_send_display_config
    on_turn_off:
      - script.execute: assemble_and_send_display_config

text_sensor:
  - platform: template
    id: current_weathercode
    internal: true
    update_interval: never
    lambda: |-
      std::string tuya_code = "0";
      if (!isnan(id(raw_weathercode).state)) {
        int owm_code = (int)id(raw_weathercode).state;
        switch (owm_code) {
          case 800: tuya_code = "146"; break; // Clear
          case 801: tuya_code = "119"; break; // Few clouds
          case 802: tuya_code = "129"; break; // Scattered clouds
          case 803: tuya_code = "142"; break; // Broken clouds
          case 804: tuya_code = "132"; break; // Overcast
          case 701: case 741: tuya_code = "121"; break; // Mist, Fog
          case 711: case 721: case 731: case 761: case 762: tuya_code = "140"; break; // Smoke, Haze, Dust, Ash
          case 751: tuya_code = "103"; break; // Sand
          case 771: tuya_code = "102"; break; // Squall
          case 781: tuya_code = "116"; break; // Tornado
        }
        if (owm_code >= 200 && owm_code <= 232) tuya_code = "143"; // Thunderstorm
        if (owm_code >= 300 && owm_code <= 321) tuya_code = "139"; // Drizzle
        if (owm_code == 500 || owm_code == 520) tuya_code = "139"; // Light Rain
        if (owm_code == 501 || owm_code == 521) tuya_code = "141"; // Moderate Rain
        if ((owm_code >= 502 && owm_code <= 504) || (owm_code >= 522 && owm_code <= 531)) tuya_code = "101"; // Heavy Rain
        if (owm_code == 511) tuya_code = "137"; // Freezing Rain
        if (owm_code == 600 || owm_code == 615 || owm_code == 620) tuya_code = "130"; // Light Snow
        if (owm_code == 601) tuya_code = "131"; // Snow
        if (owm_code == 602 || owm_code == 622) tuya_code = "124"; // Heavy Snow
        if ((owm_code >= 611 && owm_code <= 613) || owm_code == 616) tuya_code = "113"; // Sleet
      }
      return {tuya_code.c_str()};
    on_value:
      then:
        - lambda: |-
            auto* weather_service = id(tuya_mcu).get_weather_service();
            if (weather_service != nullptr) {
              weather_service->set_weather_data_string("w.conditionNum", x);
              weather_service->send_weather_data();
            }

script:
  - id: assemble_and_send_display_config
    then:
      - lambda: |-
          std::vector<uint8_t> data;
          data.push_back(id(show_uv).state ? 1 : 0);
          data.push_back(id(show_wind).state ? 1 : 0);
          data.push_back(id(show_pressure).state ? 1 : 0);
          data.push_back(id(show_temp).state ? 1 : 0);
          data.push_back(id(show_hum).state ? 1 : 0);
          data.push_back(id(show_feels).state ? 1 : 0);
          data.push_back(id(show_local).state ? 1 : 0);
          data.push_back(id(show_sub).state ? 1 : 0);
          data.push_back(id(show_date).state ? 1 : 0);
          data.push_back(id(show_week).state ? 1 : 0);
          data.push_back(id(show_weather).state ? 1 : 0);
          id(tuya_mcu).set_raw_datapoint_value(108, data);

  - id: retry_initial_weather_sync
    mode: queued
    then:
      - lambda: |-
          auto* weather_service = id(tuya_mcu).get_weather_service();
          if (weather_service != nullptr) {
            // Temperature
            if (!isnan(id(current_temperature).state)) {
              weather_service->set_weather_data_int("w.temp", id(current_temperature).state);
            } else {
              weather_service->set_weather_data_int("w.temp", 0);
            }
            // Humidity
            if (!isnan(id(current_humidity).state)) {
              weather_service->set_weather_data_int("w.humidity", id(current_humidity).state);
            } else {
              weather_service->set_weather_data_int("w.humidity", 0);
            }
            // Pressure
            if (!isnan(id(current_pressure).state)) {
              weather_service->set_weather_data_int("w.pressure", id(current_pressure).state);
            } else {
              weather_service->set_weather_data_int("w.pressure", 0);
            }
            // Real Feel
            if (!isnan(id(current_realfeel).state)) {
              weather_service->set_weather_data_int("w.realFeel", id(current_realfeel).state);
            } else {
              weather_service->set_weather_data_int("w.realFeel", 0);
            }
            // UV Index
            if (!isnan(id(current_uvi).state)) {
              weather_service->set_weather_data_int("w.uvi", id(current_uvi).state);
            } else {
              weather_service->set_weather_data_int("w.uvi", 0);
            }
            // Wind Speed
            if (!isnan(id(current_windspeed).state)) {
              char buffer[8];
              snprintf(buffer, sizeof(buffer), "%.1f", (id(current_windspeed).state / 3.6f));
              weather_service->set_weather_data_string("w.windSpeed", buffer);
            } else {
              weather_service->set_weather_data_string("w.windSpeed", "0");
            }

            weather_service->set_weather_data_string("w.conditionNum", id(current_weathercode).state);
            weather_service->send_weather_data();
            id(retry_initial_weather_sync).stop();
          }
      - delay: 10s
      - script.execute: retry_initial_weather_sync
```
