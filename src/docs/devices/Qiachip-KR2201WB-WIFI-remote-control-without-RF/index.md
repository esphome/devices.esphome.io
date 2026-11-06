---
title: Qiachip KR2201WB WIFI remote control (Without RF)
date-published: 2024-01-01
type: switch
standard: global
board: bk72xx
---

## Notice

- This switch is flashable using the latest tuya-cloudcutter with a compiled ESPHome binary. I recommend following this
  [Youtube Video](https://youtu.be/sSj8f-HCHQ0).
- Version 1.1.4 in the App and with BK7231N (WB2S module)

## Product Images

![switch](https://qiachip.com/cdn/shop/products/1_2e22ca5a-07e5-4b06-82bf-afe87dc96dec_540x.jpg?v=1621674409)

## GPIO Pinout

| Pin | Function      |
| --- | ------------- |
| P7  | Switch button |
| P10 | Green LED     |
| P8  | Relay         |

## Configuration

```yml
substitutions:
  devicename: qia-smart-switch
  friendly_name: QIA Smart switch

esphome:
  name: ${devicename}

bk72xx:
  board: generic-bk7231n-qfn32-tuya

logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

# Enable over the air updates
ota:
  password: !secret ota_password

wifi:
  networks:
    - ssid: !secret wifi_ssid
      password: !secret wifi_password
  ap:
    ssid: ${friendly_name} Hotspot
    password: !secret ap_password

captive_portal:

time:
  - platform: homeassistant
    id: homeassistant_time

# Enable Web server
web_server:
  port: 80

debug:
  update_interval: 5s

sensor:
  - platform: debug
    free:
      name: ${friendly_name} Heap Free
    loop_time:
      name: ${friendly_name} Loop Time
  - platform: wifi_signal
    name: ${friendly_name} WiFi Signal
    update_interval: 30s
  - platform: uptime
    name: Uptime Sensor
    id: uptime_sensor
    update_interval: 60s
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

text_sensor:
  - platform: libretiny
    version:
      name: ${friendly_name} LibreTiny Version
      icon: mdi:cube-outline
  - platform: wifi_info
    ip_address:
      name: "${friendly_name} IP address"
    ssid:
      name: "${friendly_name} connected SSID"
    mac_address:
      name: "${friendly_name} MAC WiFi address"

  - platform: template
    name: Uptime Human Readable
    id: uptime_human
    icon: mdi:clock-start

  - platform: debug
    device:
      name: Device Info
    reset_reason:
      name: Reset Reason

light:
  - platform: status_led
    name: "led"
    internal: true
    id: led
    pin:
      number: P10
      inverted: true

binary_sensor:
  - platform: status
    name: ${friendly_name} status
  - platform: gpio
    pin:
      number: P7
      mode: INPUT_PULLUP
      inverted: true
    name: ${friendly_name} button
    internal: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
    on_press:
      - switch.toggle: relay

switch:
  - platform: gpio
    id: relay
    name: ${friendly_name} relay
    pin: P8
    icon: mdi:electric-switch
    on_turn_on:
      - light.turn_on: led
    on_turn_off:
      - light.turn_off: led

button:
  - platform: restart
    id: restart_button
    name: ${friendly_name} restart
    entity_category: diagnostic
```
