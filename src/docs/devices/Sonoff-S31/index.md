---
title: Sonoff S31
date-published: 2019-10-11
type: plug
standard: us
board: esp8266
---

## Initial Install

This device cannot be converted to ESPHome using tuya-convert.

You must [remove the cover and use the serial header](https://www.adventurousway.com/blog/sonoff-s31) for first upload.
Hold down the button while powering on the device to put it into bootloader mode.

## GPIO Pinout

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO0  | Push Button (HIGH = off, LOW = on) |
| GPIO12 | Relay and its status LED           |
| GPIO13 | Green LED (HIGH = off, LOW = on)   |
| GPIO1  | RX pin (for external sensors)      |
| GPIO3  | TX pin (for external sensors)      |

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: sonoff_s31

esp8266:
  board: esp12e
  early_pin_init: false
  restore_from_flash: false # Set to true to use one of the switch's RESTORE_X restore_mode options

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

# Remove the following line if you're not using Home Assistant or your switch will restart every now and again
api:

ota:
  platform: esphome

# Device Specific Config

logger:
  baud_rate: 0 # (UART logging interferes with cse7766)
  logs:
    sensor: DEBUG # (Overide any global setting, to VERBOSE will spamming the cse7766 sensors)

uart:
  rx_pin: RX
  baud_rate: 4800
  parity: EVEN

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: True
    name: "Sonoff S31 Button"
    on_press:
      - switch.toggle: relay
  - platform: status
    name: "Sonoff S31 Status"

sensor:
  - platform: wifi_signal
    name: "Sonoff S31 WiFi Signal"
    update_interval: 60s
  - platform: cse7766
    current:
      name: "Sonoff S31 Current"
      accuracy_decimals: 2
      filters:
        - throttle_average: 60s
    voltage:
      name: "Sonoff S31 Voltage"
      accuracy_decimals: 2
      filters:
        - throttle_average: 60s
    power:
      name: "Sonoff S31 Power"
      accuracy_decimals: 2
      id: my_power
      filters:
        - throttle_average: 60s
    energy:
      name: "Sonoff S31 Energy"
      accuracy_decimals: 2
      filters:
        - throttle: 60s
    apparent_power: #(only available with version 2024.3.0 or greater)
      name: "Sonoff S31 Apparent Power"
      filters:
        - throttle_average: 60s
    power_factor: #(only available with version 2024.3.0 or greater)
      name: "Sonoff S31 Power Factor"
      accuracy_decimals: 2
      filters:
        - throttle_average: 60s

  - platform: total_daily_energy #(Optional, not specific to cse7766)
    name: "Sonoff S31 Daily Energy"
    power_id: my_power
    accuracy_decimals: 2

switch:
  - platform: gpio
    name: "Sonoff S31 Relay"
    pin: GPIO12
    id: relay
    restore_mode: ALWAYS_OFF # Powering the relay may cause damage or instability when the programmer is supplying Vcc.

time:
  - platform: sntp #(required for total_daily_energy)
    id: my_time

status_led:
  pin:
    number: GPIO13
    inverted: True
```

## Warnings

- `board: esp12e` is required to enable all 4MB of flash, allowing OTA updates to work after approximately version
  2024.4.0
- `throttle_average: 60s` on cse7766 sensors is highly recommended with version 2024.2.0 or greater.
- `restore_mode: ALWAYS_OFF` avoids potential damage or instability when using the programmer’s supply.
  - Once you've performed the initial installation using a programmer, you can set this to `RESTORE_DEFAULT_OFF`
    to make the device keep its state through power cycles. Only install firmware configured this way via OTA updates.
    You will also need to set `restore_from_flash` to `true` in the `esp8266` block.
- `web_server:` can cause instability due to the device's slower ESP8266 processor
