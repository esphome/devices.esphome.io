---
title: M5Stack AirQ
date-published: 2025-01-08
type: sensor
standard: global
difficulty: 2
---

## Product Images

![M5Stack AirQ](M5stack-AirQsensorDisplay.jpeg "M5Stack AirQ esphome edition")
![M5Stack AirQ](M5stack-AirQ.webp "M5Stack AirQ Product Details")

## Description

M5Stack AirQ is an integrated, low-power air quality monitoring device designed to provide comprehensive air quality
monitoring solutions. It features multiple components, including the SEN55 air quality sensor and the SCD40 CO2 sensor,
enabling the monitoring of PM1.0, PM2.5, PM4, PM10 particles, temperature, humidity, VOC, and CO2 concentrations.
Powered by the M5stack StampS3 main controller utilizing ESP32-S3FN8 and equipped with 8M Flash memory.

This ESPHome YAML will enable the ability to display some of the sensor data on the integrated paperwhite display, as
well as send all of the sensor data to Home Assistant.

The device comes with a 1.54-inch e-ink display with a resolution of 200x200, providing a clear visual representation of
the data.

This YAML was adapted from a sample provided by **joshblake87** at
[https://www.reddit.com/r/Esphome/comments/1e2q8jj/m5_stack_airq_air_quality_sensor/](https://www.reddit.com/r/Esphome/comments/1e2q8jj/m5_stack_airq_air_quality_sensor/)

## Known Issues

- It doesn't utilize the onboard 450mAh battery.

## GPIO Pinout

| Pin    | Function           |
| ------ | ------------------ |
| GPIO1  | Ink Screen Busy    |
| GPIO2  | Ink Screen RST     |
| GPIO3  | Ink Screen D/C     |
| GPIO4  | Ink Screen CS      |
| GPIO5  | Ink Screen SCK     |
| GPIO6  | Ink Screen MOSI    |
| GPIO8  | Button B           |
| GPIO9  | beep               |
| GPIO10 | SEN55 Power Switch |
| GPIO11 | SEN55 SDA          |
| GPIO12 | SEN55 SCL          |
| GPIO26 | Speaker Pin 2      |
| GPIO15 | GROVE A SCL        |
| GPIO13 | GROVE A SDA        |

## Example Configuration

```yml
# M5Stack AirQ ESPHome Configuration
# ------------------------------------------
# Before using this configuration:
# 1. Update the substitutions section with your values from Home Assistant:
#    - encryption_key: 32-character key for API encryption
#    - ota_password: Password for OTA updates
#    - ap_password: Password for fallback AP mode (optional)
# 2. Ensure your secrets.yaml contains:
#    wifi_ssid: "YOUR_WIFI_SSID"
#    wifi_password: "YOUR_WIFI_PASSWORD"
# 3. Adjust other substitutions as needed (devicename, location, etc)

substitutions:
  devicename: airq
  friendlyname: AirQ
  location: Office
  sensor_interval: 60s
  log_level: DEBUG
  altitude_compensation: "0m" # Local altitude for CO2 sensor
  temp_offset: -3.0
  temp_time_constant: 1200

esphome:
  name: ${devicename}
  friendly_name: ${friendlyname}
  area: ${location}
  platformio_options:
    board_build.mcu: esp32s3
    board_build.name: "M5Stack StampS3"
    board_build.upload.flash_size: 8MB
    board_build.upload.maximum_size: 8388608
    board_build.vendor: M5Stack
  on_boot:
    - priority: 800
      then:
        - output.turn_on: enable
    - priority: 200 # na wifi/sensor init
      then:
        - script.execute: warmup_refresh

esp32:
  variant: esp32s3

logger:
  level: ${log_level}

api:

ota:
  - platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${devicename} Fallback Hotspot"

captive_portal:

output:
  - platform: gpio
    pin: GPIO10
    id: enable

web_server:
  port: 80
  include_internal: true

i2c:
  sda: GPIO11
  scl: GPIO12
  scan: true
  frequency: 50kHz
  id: bus_a

spi:
  clk_pin: GPIO05
  mosi_pin: GPIO06

time:
  - platform: homeassistant
    id: ha_time

  - platform: sntp
    id: sntp_time
    timezone: Europe/Amsterdam
    # optioneel: eigen NTP servers
    # servers:
    #   - 0.nl.pool.ntp.org
    #   - 1.nl.pool.ntp.org

light:
  - platform: esp32_rmt_led_strip
    rgb_order: GRB
    pin: GPIO21
    num_leds: 1
    chipset: SK6812
    name: "LED"
    restore_mode: RESTORE_AND_OFF
    id: id_led
    color_correct: [20%, 20%, 20%]

script:
  - id: warmup_refresh
    mode: restart
    then:
      - while:
          condition:
            lambda: |-
              return id(uptime_sensor).state < 120;
          then:
            - component.update: disp
            - delay: 1s

text_sensor:
  - platform: wifi_info
    ssid:
      name: SSID
      id: ssid

  - platform: template
    name: "VOC IAQ Classification"
    id: iaq_voc
    icon: "mdi:checkbox-marked-circle-outline"
    lambda: |-
      if (int(id(voc).state) < 100.0) {
        return {"Great"};
      }
      else if (int(id(voc).state) <= 200.0) {
        return {"Good"};
      }
      else if (int(id(voc).state) <= 300.0) {
        return {"Light"};
      }
      else if (int(id(voc).state) <= 400.0) {
        return {"Moderate"};
      }
      else if (int(id(voc).state) <= 500.0) {
        return {"Heavy"};
      }
      else {
        return {"unknown"};
      }

  - platform: template
    name: "NOX IAQ Classification"
    id: iaq_nox
    icon: "mdi:checkbox-marked-circle-outline"
    lambda: |-
      if (int(id(nox).state) < 100.0) {
        return {"Great"};
      }
      else if (int(id(nox).state) <= 200.0) {
        return {"Good"};
      }
      else if (int(id(nox).state) <= 300.0) {
        return {"Light"};
      }
      else if (int(id(nox).state) <= 400.0) {
        return {"Moderate"};
      }
      else if (int(id(nox).state) <= 500.0) {
        return {"Heavy"};
      }
      else {
        return {"unknown"};
      }

sensor:
  - platform: uptime
    name: "Uptime"
    id: uptime_sensor
    update_interval: 1s
    internal: true

  - platform: scd4x
    co2:
      name: CO2
      id: CO2
      filters:
        - lambda: |-
            float MIN_VALUE = 300.0;
            float MAX_VALUE = 2500.0;
            if (MIN_VALUE <= x && x <= MAX_VALUE) return x;
            else return {};
    temperature:
      name: CO2 Temperature
      id: CO2_temperature
      filters:
        - lambda: |-
            float MIN_VALUE = -40.0;
            float MAX_VALUE = 100.0;
            if (MIN_VALUE <= x && x <= MAX_VALUE) return x;
            else return {};
    humidity:
      name: CO2 Humidity
      id: CO2_humidity
      filters:
        - lambda: |-
            float MIN_VALUE = 0.0;
            float MAX_VALUE = 100.0;
            if (MIN_VALUE <= x && x <= MAX_VALUE) return x;
            else return {};
    altitude_compensation: ${altitude_compensation}
    address: 0x62
    update_interval: $sensor_interval

  - platform: wifi_signal # Reports the WiFi signal strength/RSSI in dB
    name: "Wifi Signal dB"
    id: wifi_signal_db
    update_interval: 60s
    entity_category: "diagnostic"

  - platform: sen5x
    id: sen55
    pm_1_0:
      name: "PM 1"
      id: PM1_0
      accuracy_decimals: 2
    pm_2_5:
      name: "PM 2.5"
      id: PM2_5
      accuracy_decimals: 2
    pm_4_0:
      name: "PM 4"
      id: PM4_0
      accuracy_decimals: 2
    pm_10_0:
      name: "PM 10"
      id: PM10_0
      accuracy_decimals: 2
    temperature:
      name: "SEN55 Temperature"
      id: sen55_temperature
      accuracy_decimals: 2
    humidity:
      name: "SEN55 Humidity"
      id: sen55_humidity
      accuracy_decimals: 2
    voc:
      name: VOC
      id: voc
      accuracy_decimals: 2
      algorithm_tuning:
        index_offset: 100
        learning_time_offset_hours: 12
        learning_time_gain_hours: 12
        gating_max_duration_minutes: 180
        std_initial: 50
        gain_factor: 230
    nox:
      name: NOX
      id: nox
      accuracy_decimals: 2
      algorithm_tuning:
        index_offset: 100
        learning_time_offset_hours: 12
        learning_time_gain_hours: 12
        gating_max_duration_minutes: 180
        std_initial: 50
        gain_factor: 230
    temperature_compensation:
      offset: ${temp_offset}
      normalized_offset_slope: 0
      time_constant: ${temp_time_constant}
    acceleration_mode: low
    store_baseline: true
    address: 0x69
    update_interval: $sensor_interval

  - platform: template
    name: Temperature
    id: temperature
    lambda: |-
      return (( id(sen55_temperature).state + id(CO2_temperature).state ) / 2 ) - id(temperature_offset).state;
    unit_of_measurement: "°C"
    icon: "mdi:thermometer"
    device_class: "temperature"
    state_class: "measurement"
    update_interval: $sensor_interval
    accuracy_decimals: 2

  - platform: template
    name: Humidity
    id: humidity
    lambda: |-
      return (( id(sen55_humidity).state + id(CO2_humidity).state ) / 2) - id(humidity_offset).state;
    unit_of_measurement: "%"
    icon: "mdi:water-percent"
    device_class: "humidity"
    state_class: "measurement"
    update_interval: $sensor_interval
    accuracy_decimals: 2

binary_sensor:
  - platform: gpio
    name: Button A
    pin:
      number: GPIO0
      ignore_strapping_warning: true
      mode:
        input: true
      inverted: true
    on_press:
      then:
        - component.update: disp

  - platform: gpio
    pin:
      number: GPIO08
      #      ignore_strapping_warning: true
      mode:
        input: true
        pullup: true
      inverted: true
    name: Button B

  - platform: gpio
    pin:
      number: GPIO46
      ignore_strapping_warning: true
    name: Button Hold

  - platform: gpio
    pin:
      number: GPIO42
    #      ignore_strapping_warning: true
    name: Button Power

button:
  - platform: restart
    name: Restart

  - platform: template
    name: "CO2 Force Manual Calibration"
    entity_category: "config"
    on_press:
      then:
        - scd4x.perform_forced_calibration:
            value: !lambda "return id(co2_cal).state;"

  - platform: template
    name: "SEN55 Force Manual Clean"
    entity_category: "config"
    on_press:
      then:
        - sen5x.start_fan_autoclean: sen55

number:
  - platform: template
    name: "CO2 Calibration Value"
    optimistic: true
    min_value: 400
    max_value: 1000
    step: 5
    id: co2_cal
    icon: "mdi:molecule-co2"
    entity_category: "config"

  - platform: template
    name: Humidity Offset
    id: humidity_offset
    restore_value: true
    initial_value: 0.0
    min_value: -70.0
    max_value: 70.0
    entity_category: "CONFIG"
    unit_of_measurement: "%"
    optimistic: true
    update_interval: never
    step: 0.1
    mode: box

  - platform: template
    name: Temperature Offset
    id: temperature_offset
    restore_value: true
    initial_value: 0.0
    min_value: -70.0
    max_value: 70.0
    entity_category: "CONFIG"
    unit_of_measurement: "°C"
    optimistic: true
    update_interval: never
    step: 0.1
    mode: box

display:
  - platform: waveshare_epaper
    model: 1.54inv2
    id: disp
    cs_pin: GPIO04
    dc_pin: GPIO03
    reset_pin: GPIO02
    busy_pin:
      number: GPIO01
      inverted: false
    full_update_every: 5
    reset_duration: 2ms
    update_interval: $sensor_interval
    lambda: |-
      // 1) Warming up check: eerste 120 s enkel melding tonen
      if (id(uptime_sensor).state < 120) {
        it.fill(COLOR_OFF);
        it.printf(it.get_width()/2, it.get_height()/2 - 16,
                  id(f18), COLOR_ON, TextAlign::CENTER,
                  "Warming up sensors");
        it.printf(it.get_width()/2, it.get_height()/2 + 16,
                  id(f16), COLOR_ON, TextAlign::CENTER,
                  "Waiting for 2 minutes");
        return;
      }

      // 1) GRID lijnen
      // Verticale verdeellijn
      it.line(100, 0,   100, 200);
      // Horizontale bovenste scheiding
      //it.line(0,   50, 200, 0);
      // Middenlijn onder Sen55 alleen rechts (x ≥ 100)
      // it.line(100,120,200,120);
      // Onderste scheiding
      it.line(it.get_width()-1, 0, it.get_width()-1, it.get_height());

      // 2) Vakken
      // SCD40 linksonder, zonder onderrand
      it.line(0,   50, 0,   160);   // linkerkant
      it.line(0,   50, 100, 50);    // bovenkant
      //it.line(100, 50, 100,160);    // rechterkant
      // Sen55 rechtsboven (0→120)
      it.rectangle(100, 0, 100, 160);
      // Wi-Fi rechtsonder (160→200)
      //it.rectangle(100,160,100, 40);
      // Optioneel: vak linksonder voor je logo
      it.rectangle(0, 160,100, 40);

      // KLOK & DATUM (kleiner font)
      auto t = id(sntp_time).now();
      char buf[20];
      snprintf(buf, sizeof(buf), "%02d:%02d", t.hour, t.minute);
      it.printf(2, 0,   id(f24), COLOR_ON,  TextAlign::TOP_LEFT,  "%s", buf);
      t.strftime(buf, sizeof(buf), "%Y-%m-%d");
      it.printf(2, 30,  id(f12), COLOR_ON,  TextAlign::TOP_LEFT,  "%s", buf);

      // SCD40 LINKS
      it.printf(5, 52,  id(f16), COLOR_ON, TextAlign::TOP_LEFT, "SCD40");
      it.printf(5, 75,  id(f12), COLOR_ON, TextAlign::TOP_LEFT, "Co2:");
      it.printf(90,75,  id(f16), COLOR_ON, TextAlign::TOP_RIGHT, "%.0f", id(CO2).state);
      it.printf(5, 95,  id(f12), COLOR_ON, TextAlign::TOP_LEFT, "Temp:");
      it.printf(90,95,  id(f16), COLOR_ON, TextAlign::TOP_RIGHT, "%.1f", id(temperature).state);
      it.printf(5,115,  id(f12), COLOR_ON, TextAlign::TOP_LEFT, "Humid:");
      it.printf(90,115, id(f16), COLOR_ON, TextAlign::TOP_RIGHT, "%.1f", id(humidity).state);

      // SEN55 RECHTS
      it.printf(105,5,  id(f16), COLOR_ON, TextAlign::TOP_LEFT, "SEN55");
      const char* labels[] = {"PM1.0:","PM2.5:","PM4.0:","PM10:","VOC:","NOX:"};
      float vals[] = {
        id(PM1_0).state, id(PM2_5).state, id(PM4_0).state, id(PM10_0).state,
        id(voc).state, id(nox).state
      };
      for(int i = 0; i < 6; i++) {
        int y = 25 + i * 20;
        it.printf(105, y, id(f12), COLOR_ON, TextAlign::TOP_LEFT,  labels[i]);
        it.printf(190, y, id(f16), COLOR_ON, TextAlign::TOP_RIGHT,
                  i < 4 ? "%.1f" : "%.0f", vals[i]);
      }

      // 6) Wi-Fi (rechtsonder, y=160→200)
      it.printf(105,161, id(f16), COLOR_ON, TextAlign::TOP_LEFT, "WIFI");
      it.printf(105,180, id(f12), COLOR_ON, TextAlign::TOP_LEFT, "%s", id(ssid).state.c_str());

      // 7) Logo of friendlyname (linksonder)
      it.filled_rectangle(1, 161, 98, 39, COLOR_ON);
      it.print(50, 180, id(f18), COLOR_OFF, TextAlign::CENTER, "${friendlyname}");

font:
  - file:
      type: gfonts
      family: Noto Sans Display
      weight: 500
    glyphs:
      [
        "&",
        "@",
        "!",
        ",",
        ".",
        '"',
        "%",
        "(",
        ")",
        "+",
        "-",
        "_",
        ":",
        "°",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        " ",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "å",
        "ä",
        "ö",
        "/",
        "µ",
        "³",
        "’",
      ]
    id: f16
    size: 16
  - file:
      type: gfonts
      family: Noto Sans Display
      weight: 500
    glyphs:
      [
        "&",
        "@",
        "!",
        ",",
        ".",
        '"',
        "%",
        "(",
        ")",
        "+",
        "-",
        "_",
        ":",
        "°",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        " ",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "å",
        "ä",
        "ö",
        "/",
        "µ",
        "³",
        "’",
      ]
    id: f18
    size: 18
  - file:
      type: gfonts
      family: Noto Sans Display
      weight: 500
    id: f12
    size: 12
    glyphs:
      [
        "&",
        "@",
        "!",
        ",",
        ".",
        '"',
        "%",
        "(",
        ")",
        "+",
        "-",
        "_",
        ":",
        "°",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        " ",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "å",
        "ä",
        "ö",
        "/",
        "µ",
        "³",
        "’",
      ]
  - file:
      type: gfonts
      family: Noto Sans Display
      weight: 500
    id: f24
    size: 24
    glyphs:
      [
        "&",
        "@",
        "!",
        ",",
        ".",
        '"',
        "%",
        "(",
        ")",
        "+",
        "-",
        "_",
        ":",
        "°",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        " ",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "å",
        "ä",
        "ö",
        "/",
        "µ",
        "³",
        "’",
      ]
  - file:
      type: gfonts
      family: Noto Sans Display
      weight: 500
    id: f36
    size: 36
    glyphs:
      [
        "&",
        "@",
        "!",
        ",",
        ".",
        '"',
        "%",
        "(",
        ")",
        "+",
        "-",
        "_",
        ":",
        "°",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        " ",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "å",
        "ä",
        "ö",
        "/",
        "µ",
        "³",
        "’",
      ]
  - file:
      type: gfonts
      family: Noto Sans Display
      weight: 500
    id: f48
    size: 48
    glyphs:
      [
        "&",
        "@",
        "!",
        ",",
        ".",
        '"',
        "%",
        "(",
        ")",
        "+",
        "-",
        "_",
        ":",
        "°",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        " ",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "å",
        "ä",
        "ö",
        "/",
        "µ",
        "³",
        "’",
      ]
  - file:
      type: gfonts
      family: Noto Sans Display
      weight: 500
    id: f32
    size: 32
    glyphs:
      [
        "&",
        "@",
        "!",
        ",",
        ".",
        '"',
        "%",
        "(",
        ")",
        "+",
        "-",
        "_",
        ":",
        "°",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        " ",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "å",
        "ä",
        "ö",
        "/",
        "µ",
        "³",
        "’",
      ]

  - file:
      type: gfonts
      family: Noto Sans Display
      weight: 500
    id: f64
    size: 64
    glyphs:
      [
        "&",
        "@",
        "!",
        ",",
        ".",
        '"',
        "%",
        "(",
        ")",
        "+",
        "-",
        "_",
        ":",
        "°",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        " ",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "å",
        "ä",
        "ö",
        "/",
        "µ",
        "³",
        "’",
      ]

  - file:
      type: gfonts
      family: Noto Sans Display
      weight: 800
    id: f64b
    size: 64
    glyphs:
      [
        "&",
        "@",
        "!",
        ",",
        ".",
        '"',
        "%",
        "(",
        ")",
        "+",
        "-",
        "_",
        ":",
        "°",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        " ",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "å",
        "ä",
        "ö",
        "/",
        "µ",
        "³",
        "’",
      ]

  - file:
      type: gfonts
      family: Noto Sans Display
      weight: 800
    id: f55b
    size: 55
    glyphs:
      [
        "&",
        "@",
        "!",
        ",",
        ".",
        '"',
        "%",
        "(",
        ")",
        "+",
        "-",
        "_",
        ":",
        "°",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        " ",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "å",
        "ä",
        "ö",
        "/",
        "µ",
        "³",
        "’",
      ]

  - file:
      type: gfonts
      family: Material Symbols Sharp
      weight: 400
    id: font_weather_icons_xsmall
    size: 20
    glyphs:
      - "\U0000F159" # clear-night
      - "\U0000F15B" # cloudy
      - "\U0000F172" # partlycloudy
      - "\U0000E818" # fog
      - "\U0000F67F" # hail
      - "\U0000EBDB" # lightning, lightning-rainy
      - "\U0000F61F" # pouring
      - "\U0000F61E" # rainy
      - "\U0000F61C" # snowy
      - "\U0000F61D" # snowy-rainy
      - "\U0000E81A" # sunny
      - "\U0000EFD8" # windy, windy-variant
      - "\U0000F7F3" # exceptional
  - file:
      type: gfonts
      family: Material Symbols Sharp
      weight: 400
    id: font_weather_icons_small
    size: 32
    glyphs:
      - "\U0000F159" # clear-night
      - "\U0000F15B" # cloudy
      - "\U0000F172" # partlycloudy
      - "\U0000E818" # fog
      - "\U0000F67F" # hail
      - "\U0000EBDB" # lightning, lightning-rainy
      - "\U0000F61F" # pouring
      - "\U0000F61E" # rainy
      - "\U0000F61C" # snowy
      - "\U0000F61D" # snowy-rainy
      - "\U0000E81A" # sunny
      - "\U0000EFD8" # windy, windy-variant
      - "\U0000F7F3" # exceptional

  - file:
      type: gfonts
      family: Open Sans
      weight: 700
    id: font_clock
    glyphs: "0123456789:"
    size: 70
  - file:
      type: gfonts
      family: Open Sans
      weight: 700
    id: font_clock_big
    glyphs: "0123456789:"
    size: 100
  - file: "gfonts://Roboto"
    id: font_temp
    size: 28
  - file:
      type: gfonts
      family: Open Sans
      weight: 500
    id: font_small
    size: 30
    glyphs: '!"%()+=,-_.:°0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz»'
  - file:
      type: gfonts
      family: Open Sans
      weight: 500
    id: font_medium
    size: 45
    glyphs: '!"%()+=,-_.:°0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz»'
  - file:
      type: gfonts
      family: Open Sans
      weight: 300
    id: font_xsmall
    size: 16
    glyphs: '!"%()+=,-_.:°0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz»'
```
