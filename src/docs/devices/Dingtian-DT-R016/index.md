---
title: Dingtian DT-R016
date-published: 2024-10-31
type: relay
standard: global
board: esp32
---

## Product description

This is a 16-relay board with an ESP32.

I bought it from: [https://it.aliexpress.com/item/1005007002132841.html?spm=a2g0o.order_list.order_list_main.17.450b3696cHQW0O&gatewayAdapt=glo2ita](https://it.aliexpress.com/item/1005007002132841.html?spm=a2g0o.order_list.order_list_main.17.450b3696cHQW0O&gatewayAdapt=glo2ita)

When ordering this board ask for relay board with test firmware, otherwise the ESP32 will be locked.
Use a USB-TTL adapter to flash EspHome the first time.

![Debug Port Pinout](https://github.com/user-attachments/assets/0c2b63b9-149f-4e11-9a80-4a2f48706a97)

![Debug Port Physical Pins](https://github.com/user-attachments/assets/4b3101df-b3f1-412c-a6d6-777ade8fcffc)

![USB-TTL Adapter](https://github.com/user-attachments/assets/c703cc66-06ec-4772-840e-2bc28bbbc7c6)

**Connect IO0 to GND** (I used one of the screwterminals)

Connect 3v3 on the board and on the TTL adapter
Connect GND on the board and on the TTL adapter
Connect Rx on the TTL adapter to IO1 on the board (Tx)
Connect Tx on the TTL adapter to IO3 on the board (Rx)

## Basic Config

```yaml

substitutions:
  devicename: dt-r016
  upper_devicename: DT-R016
  friendly_name: DT-R016
  key: !secret key_dt-r016
  ota: !secret ota_dt-r016
  IP: !secret IP_dt-r016
  fallback_pass: !secret fallback_pass_dt-r016

esphome:
  name: sprinkler
  friendly_name: Sprinkler

esp32:
  variant: esp32
  framework:
    type: arduino

external_components:
  - source: github://AlessandroTischer/dtr0xx_io@master
    refresh: 60s
    components:
      - dtr0xx_io

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: $key

ota:
  - platform: esphome
    password: $ota

#wifi:
ethernet:
  type: JL1101
  mdc_pin: 23
  mdio_pin: 18
  clk_mode: GPIO17_OUT
  power_pin: 12
  phy_addr: 1

  # ssid: !secret wifi_ssid
  # password: !secret wifi_password
  use_address: $IP

  # Enable fallback hotspot (captive portal) in case wifi connection fails
#  ap:
#    ssid: ${friendly_name} Fallback Hotspot
#    password: $fallback_pass

# captive_portal:

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
    dingtian_q7_pin: 35
    dingtian_sdi_pin: 13
    dingtian_pl_pin: 0
    dingtian_rck_pin: 15
    sr_count: 2

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
    # on_press:
    #   then:
    #     switch.toggle: relay_1

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
    # on_press:
    #   then:
    #     switch.toggle: relay_2

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
    # on_press:
    #   then:
    #     switch.toggle: relay_3

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
    # on_press:
    #   then:
    #     switch.toggle: relay_4

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
    # on_press:
    #   then:
    #     switch.toggle: relay_5

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
    # on_press:
    #   then:
    #     switch.toggle: relay_6

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
    # on_press:
    #   then:
    #     switch.toggle: relay_7

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
    # on_press:
    #   then:
    #     switch.toggle: relay_8

  - platform: gpio
    name: ${friendly_name} Input 9
    id: input_9
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 15
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
  - platform: gpio
    name: ${friendly_name} Input 10
    id: input_10
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 14
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
  - platform: gpio
    name: ${friendly_name} Input 11
    id: input_11
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 13
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
  - platform: gpio
    name: ${friendly_name} Input 12
    id: input_12
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 12
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
  - platform: gpio
    name: ${friendly_name} Input 13
    id: input_13
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 11
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
  - platform: gpio
    name: ${friendly_name} Input 14
    id: input_14
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 10
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
  - platform: gpio
    name: ${friendly_name} Input 15
    id: input_15
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 9
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms
  - platform: gpio
    name: ${friendly_name} Input 16
    id: input_16
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 8
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on: 10ms
      - delayed_off: 10ms


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
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 1
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 8
    id: relay_8
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 0
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 9
    id: relay_9
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 15
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 10
    id: relay_10
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 14
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 11
    id: relay_11
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 13
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 12
    id: relay_12
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 12
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 13
    id: relay_13
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 11
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 14
    id: relay_14
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 10
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 15
    id: relay_15
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 9
      inverted: false
      allow_other_uses: true
  - platform: gpio
    name: ${friendly_name} Relay 16
    id: relay_16
    restore_mode: ALWAYS_OFF
    pin:
      dtr0xx_io: dtr0xx_io_hub
      number: 8
      inverted: false
      allow_other_uses: true

```
