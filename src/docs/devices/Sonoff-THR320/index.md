---
title: Sonoff THR320
date-published: 2026-02-19
type: relay
standard: global
board: esp32
difficulty: 3
---

## Bootloop Workaround

Some people experience a boot loop when trying to flash esphome directly.
Here's a workaround:
[https://community.home-assistant.io/t/bootloop-workaround-for-flashing-sonoff-th-elite-thr316d-thr320d-and-maybe-others-with-esphome-for-the-first-time/498868](https://community.home-assistant.io/t/bootloop-workaround-for-flashing-sonoff-th-elite-thr316d-thr320d-and-maybe-others-with-esphome-for-the-first-time/498868)

## GPIO Pinout

(Source: [https://templates.blakadder.com/sonoff_THR320D.html](https://templates.blakadder.com/sonoff_THR320D.html))
Some GPIO are active-low, meaning they're "on" when they're pulled low. In ESPHome that's often called "inverted".
The relays GPIO are active-high.

The main relay is bistable/latching, meaning a pulse on pin 1 switches the
relay ON, and a pulse on pin 2 switches the relay OFF.
These two pins should never be active at the same time, or the device will become dangerously hot in a few minutes.

Note that until Feb 2026 there was an error in this page causing a safety issue:
The code was considering the relays GPIO as being active-low, when they are actually active-high. So the two main relay
pins were stay simultaneously active most of the time, making the device dangerously hot.
If you copied the old version of the code from here, please update your devices as soon as possible.

| Pin    | Function                                                 |
| ------ | -------------------------------------------------------- |
| GPIO0  | Push Button (HIGH = off, LOW = on)                       |
| GPIO19 | Large/Main Relay pin 1, pull high briefly for relay OFF  |
| GPIO22 | Large/Main Relay pin 2, pull high briefly for relay ON   |
| GPIO16 | Left LED (Red)                                           |
| GPIO15 | Middle LED (Blue)                                        |
| GPIO13 | Right LED (Green)                                        |

## Basic Configuration

Internal momentary switches are used to pulse the ON/OFF pins on the main relay.
A template switch is used to hide the complexity of controlling the two internal
momentary switches.

One shortcoming here is we don't have any way to confirm the true state of the
main relay, and so there is a possibility that our main relay switch could get out
of sync with the true state of the relay. It is advised to force the relay to a
known state on power up, rather than leave it in an unknown state until some
switching operation is performed.

```yaml

esp32:
  board: nodemcu-32s
  framework:
    type: esp-idf

binary_sensor:
  # single button that also puts device into flash mode when held on boot
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
      ignore_strapping_warning: true
    id: button_
    filters:
      - delayed_on_off: 50ms

switch:
  - platform: hbridge
    id: main_relay
    on_pin:
      number: GPIO22
    off_pin:
      number: GPIO19
    pulse_length: 100ms
    wait_time: 100ms

output:
  - platform: ledc
    id: red_led_output
    pin:
      number: GPIO16
      inverted: true

  - platform: ledc
    id: green_led_output
    pin:
      number: GPIO13
      inverted: true

  # This is needed to power the external sensor.
  # It receives 3v3 from this pin, which should be activated appropriately.
  - platform: gpio
    pin: GPIO27
    id: sensor_power

# The middle (blue) LED is used as wifi status indicator.
status_led:
  pin:
    number: GPIO15
    inverted: true
    ignore_strapping_warning: true

light:
  # Leftmost (red) LED that's used to indicate the relay being on/off
  - platform: binary
    id: red_led
    output: red_led_output

  # Rightmost (green) LED
  - platform: binary
    id: green_led
    output: green_led_output

```

The THR320 can be used with either a 1-wire bus, or else using a
uart-based sensor like the WTS01.

1-wire:

```yaml

one_wire:
  platform: gpio
  pin: GPIO25

```

Then you can add `sensor: platform: dallas_temp` entities as appropriate, or whatever other 1-wire devices you choose.

WTS01:

```yaml

# You need to have a UART bus setup in your configuration
uart:
  - id: sensor_uart
    rx_pin: GPIO25
    baud_rate: 9600

# Then you can add the WTS01 sensor
sensor:
  - platform: wts01
    id: wts01_sensor
    uart_id: sensor_uart

```

