---
title: Unbranded Smart Plug BSD01
date-published: 2021-02-09
type: plug
standard: global, us
board: esp8266
---

This device did not have a serial number, brand name or FCC ID. Bought from AliExpress. The plugs I received did not
respond to tuya-convert so a hard flash was necessary.

The plug uses a wifi module with ID ajw-02_8285. Not much online but enough to figure out the pin pads for a hard flash.
A couple of users have gone before me and desoldered the module from the main board but I chose to solder DuPont cables
to the pin pads and then use a pik tool to trigger flash mode via GPIO0. If I can figure out how to upload images here
I'll do that later.

The GPIO pinout was learned from [Blakadder Tasmota](https://templates.blakadder.com/BSD01.html) documentation and
adapted through trial and error.

## GPIO Pinout

| Pin    | Function                     |
| ------ | ---------------------------- |
| GPIO1  | Status LED - Red             |
| GPIO12 | Relay                        |
| GPIO13 | Button (inverted)            |
| GPIO14 | Status LED - Blue (inverted) |

## Basic Configuration

```yaml
# Type BSD01 plug (AliExpress x 5)
esphome:
  name: ${lower_devicename}

esp8266:
  board: esp01_1m

logger:

wifi:
  manual_ip:
    static_ip: ${static_ip}
    gateway: 192.168.10.1
    subnet: 255.255.255.0
    dns1: 192.168.10.1
    dns2: 0.0.0.0
  ap:
    ssid: Fallback-${lower_devicename}
    password: ""
    ap_timeout: 1min
  domain: .local
  reboot_timeout: 5min
  power_save_mode: NONE
  fast_connect: false
  output_power: 20.0
  networks:
    - ssid: !secret wifi_ssid
      password: !secret wifi_password
      priority: 0.0
  use_address: ${static_ip}

captive_portal:

api:
  port: 6053
  reboot_timeout: 15min
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret ota_password
  safe_mode: true
  port: 8266

binary_sensor:
  - platform: status
    name: ${upper_short_devicename} Status
    device_class: connectivity
  - platform: gpio
    id: button
    internal: true
    pin:
      number: 13
      mode: INPUT
      inverted: true
    on_press:
      - then:
          - switch.toggle:
              id: ${id_devicename}_relay
    name: button

switch:
  - platform: gpio
    name: ${upper_short_devicename}
    id: ${id_devicename}_relay
    pin:
      number: 12
      mode: OUTPUT
      inverted: false
    on_turn_on:
      - then:
          - light.turn_off:
              id: status_led_red
              state: false
          - light.turn_on:
              id: status_led_blue
              state: true
    on_turn_off:
      - then:
          - light.turn_off:
              id: status_led_blue
              state: false
          - light.turn_on:
              id: status_led_red
              state: true
    restore_mode: RESTORE_DEFAULT_OFF
    interlock_wait_time: 0ms

  - platform: restart
    name: ${upper_short_devicename} Restart

output:
  - platform: gpio
    id: led_blue
    pin:
      number: 14
      inverted: false
      mode: OUTPUT

  - platform: gpio
    id: led_red
    pin:
      number: 1
      inverted: false
      mode: OUTPUT

light:
  - platform: binary
    name: Status LED Blue
    id: status_led_blue
    internal: true
    output: led_blue
    restore_mode: RESTORE_DEFAULT_OFF

  - platform: binary
    name: Status LED Red
    id: status_led_red
    internal: true
    output: led_red
    restore_mode: RESTORE_DEFAULT_ON

sensor:
  - platform: wifi_signal
    name: ${upper_short_devicename} Wifi Signal
    id: ${id_devicename}_wifi_signal
    update_interval: 15s
    force_update: false
    unit_of_measurement: dB
    icon: mdi:wifi
    accuracy_decimals: 0

text_sensor:
  - platform: wifi_info
    mac_address:
      name: ${upper_short_devicename} Mac Address
      icon: mdi:network
```
