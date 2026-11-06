---
title: Shelly Pro 1
date-published: 2022-03-03
type: relay
standard: uk, eu
board: esp32
---

Information about the pinout and internals of the Shelly Pro 1.

It uses the ESP32 DOWDQ6.

![Shelly Pro 1](https://user-images.githubusercontent.com/38843794/156604231-d2eca7b7-fd61-4845-bf83-a8d0047a6793.png)

## Pinout

| ESP32 DOWDQ6 | SN74HC595B | LAN8720A | Component      |
| ------------ | ---------- | -------- | -------------- |
| GPIO 4       | RCLK       |          |                |
| GPIO 13      | SER        |          |                |
| GPIO 14      | SRCLK      |          |                |
| GPIO 17      |            | CLKIN    |                |
| GPIO 18      |            | MDIO     |                |
| GPIO 19      |            | TXD0     |                |
| GPIO 21      |            | TXEN     |                |
| GPIO 22      |            | TXD1     |                |
| GPIO 23      |            | MDC      |                |
| GPIO 25      |            | RXD0     |                |
| GPIO 26      |            | RXD1     |                |
| GPIO 27      |            | CRS_DV   |                |
| GPIO 35      |            |          | Reset Button   |
| GPIO 38      |            |          | Switch input 1 |
| GPIO 39      |            |          | Switch input 2 |

## Shift register

A shift register is controlling the status LEDs and the relay output, the pinout for it is the following:

| SN74HC595B | Component |
| ---------- | --------- |
| QA         | Relay     |
| QB         | Out 2LED  |
| QC         | RGB Blue  |
| QD         | RGB Green |
| QE         | RGB Red   |
| QF         | nc        |
| QG         | nc        |
| QH         | nc        |

The Out 1 status LED and the relay are on the same output. From what I've seen the board looks like it's being used for
the Shelly Pro 1, Pro 2, Pro 1PM, and Pro 2PM. But I can't comfirm it.
There are all the spaces needed for all device variants.

![Shelly Pro 1 2](https://user-images.githubusercontent.com/38843794/156607379-c914f5e8-fbc2-407e-b529-71da5f173b7a.png)

## Programming Pinout

![Shelly Pro pinout](https://user-images.githubusercontent.com/38843794/156607973-259d2b27-976c-4b71-9198-ec737f6e95fb.png)

## Basic Configuration

```yaml
esphome:
  name: shelly-pro-1

esp32:
  variant: esp32
  framework:
    type: arduino

logger:

api:

ota:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  ap:
    ssid: "Shelly-Pro-1"
    password: "BzwFc7HsRihG"

captive_portal:

light:
  - platform: status_led
    name: "Switch state"
    pin:
      sn74hc595: sn74hc595_hub
      number: 1
      inverted: true

#ethernet:
#  type: LAN8720
#  mdc_pin: GPIO23
#  mdio_pin: GPIO18
#  clk_mode: GPIO17_OUT

button:
  - platform: restart
    id: restart_1

binary_sensor:
  - platform: status
    id: status_1
    on_press:
      then:
        switch.turn_on: rgb_b
    on_release:
      then:
        switch.turn_off: rgb_b

  - platform: gpio
    id: reset_button
    pin:
      number: 35
      inverted: true
    on_click:
      min_length: 400ms
      max_length: 800ms
      then:
        button.press: restart_1
    on_double_click:
      then:
        switch.toggle: light1

  - platform: gpio
    id: input1
    pin:
      number: 38
    on_press:
      then:
        switch.toggle: light1

  - platform: gpio
    id: input2
    name: "Shelly Pro Button 2"
    pin:
      number: 39

sn74hc595:
  - id: "sn74hc595_hub"
    data_pin: GPIO13
    clock_pin: GPIO14
    latch_pin: GPIO4
    sr_count: 1

switch:
  - platform: gpio
    name: "Shelly Pro Relay"
    id: light1
    pin:
      sn74hc595: sn74hc595_hub
      number: 0
      inverted: false

  - platform: gpio
    id: out2
    pin:
      sn74hc595: sn74hc595_hub
      number: 1
      inverted: false

  - platform: gpio
    id: rgb_b
    pin:
      sn74hc595: sn74hc595_hub
      number: 2
      inverted: false

  - platform: gpio
    id: rgb_g
    pin:
      sn74hc595: sn74hc595_hub
      number: 3
      inverted: false

  - platform: gpio
    id: rgb_r
    pin:
      sn74hc595: sn74hc595_hub
      number: 4
      inverted: false
```
