---
title: Dingtian DT-R008
date-published: 2023-04-12
type: relay
standard: global
---

## Product description

This is a 8-relay board with an ESP32.

I bought it from: [https://pl.aliexpress.com/item/1005004281943758.html](https://pl.aliexpress.com/item/1005004281943758.html)

When ordering this board ask for relay board with test firmware, otherwise the ESP32 will be locked.

## Basic Config

```yaml

esphome:
  name: dt-r008
  friendly_name: DT-R008

esp32:
  variant: esp32
  framework:
    type: arduino

external_components:
  - source: github://kecajtop/dtr0xx_io@master
    refresh: 60s
    components:
      - dtr0xx_io

# Enable logging
logger:
  #level: VERY_VERBOSE
  baud_rate: 0

# Enable Home Assistant API
api:
  encryption:
    key: $key
  reboot_timeout: 172800s

ota:
  password: $ota

wifi:
#ethernet:
#  type: JL1101
#  mdc_pin: 23
#  mdio_pin: 18
#  clk_mode: GPIO17_OUT
#  power_pin: 0
#  phy_addr: 1

  ssid: !secret wifi_ssid
  password: !secret wifi_password
  reboot_timeout: 172800s
  use_address: $IP
#  use_address: 192.168.0.8
#  manual_ip:
#    static_ip: 192.168.0.8
#    gateway: 192.168.0.1
#    subnet: 255.255.255.0

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: ${friendly_name} Fallback Hotspot
    password: $fallback_pass

captive_portal:

web_server:
  port: 80

time:
- platform: sntp
  id: my_time

i2c:
  sda: 4
  scl: 5
  scan: true
  id: bus_a
  frequency: 400kHz

uart:
  id: mod_bus
  tx_pin: 1
  rx_pin: 3
  baud_rate: 9600
  stop_bits: 1

dtr0xx_io:
  - id: dtr0xx_io_hub
    dingtian_clk_pin: 14
    dingtian_q7_pin: 16
    dingtian_sdi_pin: 13
    dingtian_pl_pin: 32
    dingtian_rck_pin: 15

binary_sensor:
  - platform: gpio
    id: input_1
    name: ${friendly_name} Input 1
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 7
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
    on_press:
      then:
        switch.toggle: relay_1

  - platform: gpio
    name: ${friendly_name} Input 2
    id: input_2
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 6
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
    on_press:
      then:
        switch.toggle: relay_2

  - platform: gpio
    name: ${friendly_name} Input 3
    id: input_3
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 5
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
    on_press:
      then:
        switch.toggle: relay_3

  - platform: gpio
    name: ${friendly_name} Input 4
    id: input_4
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 4
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
    on_press:
      then:
        switch.toggle: relay_4

  - platform: gpio
    name: ${friendly_name} Input 5
    id: input_5
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 3
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
    on_press:
      then:
        switch.toggle: relay_5

  - platform: gpio
    name: ${friendly_name} Input 6
    id: input_6
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 2
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
    on_press:
      then:
        switch.toggle: relay_6

  - platform: gpio
    name: ${friendly_name} Input 7
    id: input_7
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 1
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
    on_press:
      then:
        switch.toggle: relay_7

  - platform: gpio
    name: ${friendly_name} Input 8
    id: input_8
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 0
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
    on_press:
      then:
        switch.toggle: relay_8

switch:
  - platform: gpio
    name: ${friendly_name} Relay 1
    id: relay_1
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 7
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 2
    id: relay_2
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 6
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 3
    id: relay_3
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 5
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 4
    id: relay_4
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 4
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 5
    id: relay_5
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 3
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 6
    id: relay_6
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 2
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 7
    id: relay_7
    restore_mode: ALWAYS_OFF
    interlock: [relay_8]
    interlock_wait_time: 250ms
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 1
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 8
    id: relay_8
    restore_mode: ALWAYS_OFF
    interlock: [relay_7]
    interlock_wait_time: 250ms
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 0
      inverted: false
      allow_other_uses: true
```
