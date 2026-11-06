---
title: SZMDLX IR Hub
date-published: 2020-04-07
type: misc
standard: global
board: esp8266
---

## GPIO Pinout

| Pin    | Function          |
| ------ | ----------------- |
| GPIO04 | Green Status LEDs |
| GPIO05 | IR Receiver       |
| GPIO13 | Push Button       |
| GPIO14 | IR Transmitter    |

## Basic Configuration

```yaml
# This config is for the unit sold by Amazon (US): https://www.amazon.com/dp/B082R44LJM
# It can also be found on AliExpress: https://www.aliexpress.com/i/4000145673070.html
# The AliExpress model appears to have a nightlight function, but the GPIOs for that are currently unknown.
# The Amazon model does not mention nightlight anywhere, but the LEDs are present on the board.
# Please update if you figure out the nightlight function.

# Basic Config
esphome:
  name: SZMDLX IR Hub

esp8266:
  board: esp8285
    
# OTA flashing
ota:
  - platform: esphome

wifi: # Your Wifi network details
  
# Enable fallback hotspot in case wifi connection fails  
  ap:

# Enabling the logging component
logger:

# Enable Home Assistant API
api:

# Enable the captive portal
captive_portal:

status_led:
  pin: GPIO4

sensor:
  - platform: uptime
    name: "IR Uptime"

binary_sensor:
  - platform: status
    name: "IR Status"

  - platform: gpio
    pin: GPIO13
    id: physical_button

remote_transmitter:
  pin:
    number: GPIO14
  carrier_duty_percent: 50%

remote_receiver:
  pin: GPIO5
  dump: all

switch:
  - platform: template
    name: Turn on TV
    turn_on_action:
      - remote_transmitter.transmit_sony:
          data: 0x00000750
          repeat:
            times: 5
            wait_time: 45ms
    id: tv_on
```

![alt text](./irhub1.jpg "Heart-Shaped SZMDX Infrared Hub")
![alt text](./irhub2.jpg "Heart-Shaped SZMDX Infrared Hub")
