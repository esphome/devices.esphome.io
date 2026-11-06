---
title: Sonoff POW Elite 16a (POWR316D)
date-published: 2022-12-30
type: relay
standard: global
board: esp32
difficulty: 3
---

## Bootloop Workaround

Some people experience a boot loop after flashing esphome directly. The boot loop seems to appear on 3.3V DC power only
(not on AC). Here's a workaround:
[https://community.home-assistant.io/t/bootloop-workaround-for-flashing-sonoff-th-elite-thr316d-thr320d-and-maybe-others-with-esphome-for-the-first-time/498868](https://community.home-assistant.io/t/bootloop-workaround-for-flashing-sonoff-th-elite-thr316d-thr320d-and-maybe-others-with-esphome-for-the-first-time/498868)

## GPIO Pinout

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO00 | Push Button (HIGH = off, LOW = on) |
| GPIO05 | Wifi_LED                           |
| GPIO13 | Relay1                             |
| GPIO14 | TM1621 DA                          |
| GPIO16 | CSE7766 Rx                         |
| GPIO18 | Status LED (HIGH = off, LOW = on)  |
| GPIO25 | TM1621 CS                          |
| GPIO26 | TM1621 RD                          |
| GPIO27 | TM1621 WR                          |

## Basic Configuration

```yaml
# Basic Config
substitutions:
  friendly_name: POW Elite 16A
  device_name: pow-elite-16a
  update_interval: 2s

esphome:
  name: $device_name

esp32:
  variant: esp32
  framework:
    type: esp-idf

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: $device_name
    password: !secret wifi_failover

captive_portal:

logger:
  level: INFO
  baud_rate: 0

api:

ota:
  - platform: esphome

#optional
web_server:
  port: 80

#optional
esp32_ble_tracker:
  scan_parameters:
    interval: 1100ms
    window: 1100ms
    active: true

#optional
bluetooth_proxy:
  active: true

uart:
  rx_pin: GPIO16
  baud_rate: 4800
  parity: EVEN

time:
  - platform: homeassistant
    id: homeassistant_time

sensor:
  - platform: cse7766
    current:
      name: $friendly_name Current
      id: a_sensor
      filters:
        - throttle_average: ${update_interval}
    voltage:
      name: $friendly_name Voltage
      id: v_sensor
      filters:
        - throttle_average: ${update_interval}
    power:
      name: $friendly_name Power
      id: w_sensor
      filters:
        - throttle_average: ${update_interval}
    energy:
      name: $friendly_name Energy
      id: wh_sensor
      filters:
        - throttle_average: ${update_interval}

  - platform: total_daily_energy
    name: $friendly_name Total Daily Energy
    power_id: w_sensor

  - platform: wifi_signal
    name: $friendly_name Wifi RSSI
    update_interval: 60s

  - platform: uptime
    id: uptime_sensor
    internal: True
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

  - platform: internal_temperature
    name: ESP32 Internal Temp
    id: esp32_temp

  - platform: template
    name: $friendly_name Power Factor
    device_class: power_factor
    id: power_factor
    lambda: return id(w_sensor).state / id(v_sensor).state / id(a_sensor).state;

binary_sensor:
  - platform: gpio
    pin: GPIO00
    id: reset
    internal: true
    filters:
      - invert:
      - delayed_off: 10ms
    on_click:
      - max_length: 350ms # short press to toggle the relay
        then:
          switch.toggle: relay_1
      - min_length: 360ms # long press to cycle display info
        max_length: 3s
        then:
          - if:
              condition:
                binary_sensor.is_on: page
              then:
                binary_sensor.template.publish:
                  id: page
                  state: OFF
              else:
                binary_sensor.template.publish:
                  id: page
                  state: ON
  - platform: template # this is a fake sensor to tell the screen which info to show on display
    id: page
    publish_initial_state: true
    internal: true
  - platform: template
    name: $friendly_name subordinate device
    id: subordinate_device_on
    lambda: |-
      if (isnan(id(w_sensor).state)) {
        return {};
      } else if (id(w_sensor).state > 4) {
        // Running
        return true;
      } else {
        // Not running
        return false;
      }

display:
  platform: tm1621
  id: tm1621_display
  cs_pin: GPIO25
  data_pin: GPIO14
  read_pin: GPIO26
  write_pin: GPIO27
  lambda: |-
    if (id(page).state) {
      it.display_voltage(true);
      it.display_kwh(false);
      it.printf(0, "%.1f", id(v_sensor).state);
      it.printf(1, "%.1f", id(a_sensor).state);
    } else {  
      it.display_voltage(false);
      it.display_kwh(true);
      it.printf(0, "%.1f", id(wh_sensor).state);
      it.printf(1, "%.1f", id(w_sensor).state);
    }

output:
  - platform: ledc
    id: led
    pin:
      number: GPIO18
      inverted: True

switch:
  - platform: gpio
    name: $friendly_name
    pin: GPIO13
    id: relay_1
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_on:
      - delay: 500ms
      - light.turn_on: switch_led
    on_turn_off:
      - delay: 500ms
      - light.turn_off: switch_led
  - platform: restart
    name: $friendly_name Restart

text_sensor:
  - platform: template
    name: $friendly_name Uptime
    id: uptime_human
    icon: mdi:clock-start
  - platform: wifi_info
    ip_address:
      name: $friendly_name IP
    ssid:
      name: $friendly_name SSID
    bssid:
      name: $friendly_name BSSID

light:
  - platform: monochromatic
    id: switch_led
    output: led
    internal: True
  - platform: status_led
    id: wifi_status_led
    internal: True
    pin:
      number: GPIO05
      inverted: True

interval:
  - interval: 30s
    then:
      if:
        condition:
          wifi.connected:
        then:
          - light.turn_on: wifi_status_led
        else:
          - light.turn_off: wifi_status_led
```
