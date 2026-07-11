---
title: Generic Remote Receiver
date-published: 2020-10-30
type: sensor
standard: global
---

## GPIO Pinout

| Pin    | Function     |
| ------ | ------------ |
| GPIO15 | RMT receiver |

## Basic Configuration

I use this with a cheap IR decoder in a three pin package which happens to plug in to GPIO15,VCC,and GND on adjacent
pins of
the esp32dev board. You can get 5 receivers for $5 from [amazon.com](https://www.amazon.com/dp/B07TLBJR5J).

```yaml
# Basic Config for esp32
# https://www.espressif.com/en/products/hardware/esp32/overview
esphome:
  name: irl00

esp32:
  variant: esp32

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:

ota: !secret ota

mqtt: !secret mqtt

remote_receiver:
  pin:
    number: GPIO15
    inverted: true
  dump:
    - lg
    - raw

binary_sensor: !include ircodes/carmp3.yaml
```

## ESP8266

Although the ESP32 has built in hardware support for decoding the signals used by remote controls, the ESP8266
can handle it pretty well with generic GPIO.

```yaml
esphome:
  name: irl01

esp8266:
  board: d1_mini

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

# Enable logging
logger:

ota: !secret ota

mqtt: !secret mqtt

remote_receiver:
  pin:
    number: GPIO5
    inverted: true
  dump:
    - lg
    - raw

binary_sensor: !include "ircodes/verizon.yaml"
```

## Code files

I keep the IR code definitions in separate files which can be included in the skeleton as shown above.

### Car MP3 Remote

As included in [an Elegoo bundle](https://www.amazon.com/dp/B01CZTLHGE).

```yaml
# Codes for the cheap "car mp3" remote
- platform: remote_receiver
  name: ir_car_ditto_detected
  raw:
    code: [8953, -2236, 571]
- platform: remote_receiver
  name: ir_car_ch_minus_detected
  lg:
    data: 0x00FFA25D
    nbits: 32
- platform: remote_receiver
  name: ir_car_ch
  lg:
    data: 0x00FF629D
    nbits: 32
- platform: remote_receiver
  name: ir_car_ch_plus_detected
  lg:
    data: 0x00FFE21D
    nbits: 32
- platform: remote_receiver
  name: ir_car_rewind_detected
  lg:
    data: 0x00FF22DD
    nbits: 32
- platform: remote_receiver
  name: ir_car_fast_forward_detected
  lg:
    data: 0x00FF02FD
    nbits: 32
- platform: remote_receiver
  name: ir_car_play_pause_detected
  lg:
    data: 0x00FFC23D
    nbits: 32
- platform: remote_receiver
  name: ir_car_vol_minus_detected
  lg:
    data: 0x00FFE01F
    nbits: 32
- platform: remote_receiver
  name: ir_car_vol_plus_detected
  lg:
    data: 0x00FFA857
    nbits: 32
- platform: remote_receiver
  name: ir_car_eq_detected
  lg:
    data: 0x00FF906F
    nbits: 32
- platform: remote_receiver
  name: ir_car_0_detected
  lg:
    data: 0x00FF6897
    nbits: 32
- platform: remote_receiver
  name: ir_car_100_detected
  lg:
    data: 0x00FF9867
    nbits: 32
- platform: remote_receiver
  name: ir_car_200_detected
  lg:
    data: 0x00FFB04F
    nbits: 32
- platform: remote_receiver
  name: ir_car_1_detected
  lg:
    data: 0x00FF30CF
    nbits: 32
- platform: remote_receiver
  name: ir_car_2_detected
  lg:
    data: 0x00FF18E7
    nbits: 32
- platform: remote_receiver
  name: ir_car_3_detected
  lg:
    data: 0x00FF7A85
    nbits: 32
- platform: remote_receiver
  name: ir_car_4_detected
  lg:
    data: 0x00FF10EF
    nbits: 32
- platform: remote_receiver
  name: ir_car_5_detected
  lg:
    data: 0x00FF38C7
    nbits: 32
- platform: remote_receiver
  name: ir_car_6_detected
  lg:
    data: 0x00FF5AA5
    nbits: 32
- platform: remote_receiver
  name: ir_car_7_detected
  lg:
    data: 0x00FF42BD
    nbits: 32
- platform: remote_receiver
  name: ir_car_8_detected
  lg:
    data: 0x00FF4AB5
    nbits: 32
- platform: remote_receiver
  name: ir_car_9_detected
  lg:
    data: 0x00FF52AD
    nbits: 32
```

### Verizon Fios DVR

```yaml
# Codes for the Verizon FIOS DVR set top box
- platform: remote_receiver
  name: "ir_fios_ditto_command_detected"
  raw:
    code: [9046, -2218, 518]
- platform: remote_receiver
  name: ir_verizon_power_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_menu_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_info_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_info_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_up_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_down_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_left_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_right_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_ok_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_exit_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_option_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_widgets_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_power_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_favorites_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_last_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_fiostv_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_channelup_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_channeldown_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_previous_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_dvr_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_next_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_rewind_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_playpause_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_fastforward_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_stop_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_record_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_1_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_2_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_3_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_4_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_5_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_6_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_7_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_8_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_9_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_0_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_numeric_star_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_numeric_pound_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_yellow_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_blue_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_red_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_green_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_av_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_pip_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_pip-change_detected
  raw:
    code:
      [
        9028,
        -4450,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -2181,
        555,
        -4433,
        555,
        -4433,
        555,
        -2181,
        555,
        -4433,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_mute_detected
  raw:
    code:
      [
        2462,
        -532,
        663,
        -539,
        663,
        -539,
        1264,
        -539,
        663,
        -539,
        1264,
        -539,
        663,
        -539,
        663,
        -539,
        1264,
        -539,
        663,
        -539,
        663,
        -539,
        663,
        -539,
        663,
        -539,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_volumeup_detected
  raw:
    code:
      [
        2462,
        -532,
        663,
        -539,
        1264,
        -539,
        663,
        -539,
        663,
        -539,
        1264,
        -539,
        663,
        -539,
        663,
        -539,
        1264,
        -539,
        663,
        -539,
        663,
        -539,
        663,
        -539,
        663,
        -539,
        556,
      ]
- platform: remote_receiver
  name: ir_verizon_volumedown_detected
  raw:
    code:
      [
        2462,
        -532,
        1264,
        -539,
        1264,
        -539,
        663,
        -539,
        663,
        -539,
        1264,
        -539,
        663,
        -539,
        663,
        -539,
        1264,
        -539,
        663,
        -539,
        663,
        -539,
        663,
        -539,
        663,
        -539,
        556,
      ]
```
