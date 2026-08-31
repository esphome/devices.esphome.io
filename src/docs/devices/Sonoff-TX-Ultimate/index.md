---
title: Sonoff TX Ultimate Wall Switch 1/2/3/4-gang
date-published: 2024-01-14
type: switch
standard: eu, us
board: esp32
difficulty: 3
---

## Notes

- Touch panel is operated by IC CA51F353S3, connected via UART.
- Touch panel is the same for all models and has 10 channels (vertical regions),
  regardless of how many relays actually present.
  It supports also swipe-right and swipe-left.
- It has 28 addressable WS2811 LEDs
- It has a vibration motor, that can be combined with touch event
- It has audio speaker over I2S

## References and other project

- [SONOFF TX Ultimate for ESPHome (Custom Component)](https://github.com/SmartHome-yourself/sonoff-tx-ultimate-for-esphome)
- https://templates.blakadder.com/sonoff_T5-1C-86

## GPIO Pinout

| Pin    | Function              |
| ------ | --------------------- |
| GPIO18 | Relay  1              |
| GPIO17 | Relay  2 (*)          |
| GPIO27 | Relay  3 (*)          |
| GPIO23 | Relay  4 (*)          |
| GPIO13 | WS2811 LED Data       |
| GPIO26 | WS2811 LED Power      |
| GPIO19 | Touch panel UART TX   |
| GPIO22 | Touch panel UART RX   |
| GPIO05 | Touch panel power     |
| GPIO21 | Vibration Motor       |
| GPIO04 | Audio I²S LRCLK       |
| GPIO02 | Audio I²S BCLK        |
| GPIO15 | Audio I²S DOUT        |

(*) Relay 2/3/4 exists only on 2/3/4-gang model

## Basic Configuration (4-Gang)

```yaml
esphome:
  name: sonoff-tx-ultimate-na1
  name_add_mac_suffix: false
  friendly_name: Sonoff TX Ultimate 4-gang

esp32:
  board: esp32dev

api:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

captive_portal:

ota:

logger:

uart:
  tx_pin: GPIO19
  rx_pin: GPIO22
  baud_rate: 115200
  data_bits: 8
  stop_bits: 1
  parity: NONE

sonoff_tx_ultimate:
  power_pin:
    number: GPIO5
    inverted: true

binary_sensor:
  - platform: sonoff_tx_ultimate
    name: "Button 1"
    channels: [1, 2]
    on_release:
      - switch.toggle: relay_1

  - platform: sonoff_tx_ultimate
    name: "Button 2"
    channels: [3, 4, 5]
    on_release:
      - switch.toggle: relay_2

  - platform: sonoff_tx_ultimate
    name: "Button 3"
    channels: [6, 7, 8]
    on_release:
      - switch.toggle: relay_3

  - platform: sonoff_tx_ultimate
    name: "Button 4"
    channels: [9, 10]
    on_release:
      - switch.toggle: relay_4

  - platform: sonoff_tx_ultimate
    name: "Button Multi"
    channels: [11]
    on_release:
      - logger.log: "Button Multi Release"

  - platform: sonoff_tx_ultimate
    name: "Swipe Right"
    channels: [12]
    on_release:
      - logger.log: "Swipe Right"

  - platform: sonoff_tx_ultimate
    name: "Swipe Left"
    channels: [13]
    on_release:
      - logger.log: "Swipe Left"

  # Vibrate on press; press event received only on channels 1-10
  - platform: sonoff_tx_ultimate
    id: press_vibra
    internal: true
    channels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    on_presss:
      - switch.turn_on: vibra

switch:
  - platform: gpio
    id: led_power
    pin: GPIO26
    internal: true
    restore_mode: ALWAYS_ON

  - platform: gpio
    id: relay_1
    pin: GPIO18

  - platform: gpio
    id: relay_2
    pin: GPIO17

  - platform: gpio
    id: relay_3
    pin: GPIO27

  - platform: gpio
    id: relay_4
    pin: GPIO23

  - platform: gpio
    id: vibra
    pin: GPIO21
    restore_mode: ALWAYS_OFF
    on_turn_on:
      - delay: 100ms
      - switch.turn_off: vibra

light:
  - platform: neopixelbus
    type: GRB
    variant: WS2811
    pin: GPIO13
    num_leds: 28
    id: leds
    effects:
      - addressable_scan:

media_player:
  - platform: i2s_audio
    name: Player
    dac_type: external
    i2s_dout_pin: GPIO15
    i2s_audio_id: my_i2s_audio
    i2s_comm_fmt: lsb
    mode: mono

i2s_audio:
  id: my_i2s_audio
  i2s_lrclk_pin: GPIO04
  i2s_bclk_pin: GPIO02

```
