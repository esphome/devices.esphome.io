---
title: KinCony KC868-AG Hub
date-published: 2023-03-25
type: misc
standard: global
board: esp32
---

## GPIO Pinout

| Pin    | Function           |
| ------ | ------------------ |
| GPIO22 | 433MHz Transmitter |
| GPIO13 | 433MHz Receiver    |
| GPIO23 | IR Receiver        |
| GPIO2  | IR Transmitter     |
| GPIO4  | Buzzer             |

[Additional pinout/design details](https://www.kincony.com/kc868-ag-iot-ir-controller.html)

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: kicony-kc868-ag
  friendly_name: KinCony KC868-AG Hub

esp32:
  variant: esp32
  framework:
    type: arduino

# your OTA/API/Wifi/logger boilerplate here

remote_transmitter:
  - id: transmitter_ir
    pin: GPIO2
    carrier_duty_percent: 50%
  - id: transmitter_rf
    pin: GPIO22
    carrier_duty_percent: 50%

remote_receiver:
  # see https://esphome.io/guides/setting_up_rmt_devices/#remote-setting-up-infrared
  # for details on discovering the correct codes for your devices
  - id: receiver_ir
    pin:
      number: GPIO23
      inverted: True
    dump: all

  # see https://esphome.io/guides/setting_up_rmt_devices/#remote-setting-up-rf
  # for details on discovering the correct codes for your devices
  - id: receiver_rf
    pin:
      number: GPIO13
    dump: all
    # Settings to optimize recognition of RF devices
    tolerance: 50%
    filter: 250us
    idle: 4ms
    buffer_size: 2kb

switch:
  # an example
  - platform: template
    name: Turn on TV
    turn_on_action:
      - transmitter_ir.transmit_sony:
          data: 0x00000750
          repeat:
            times: 5
            wait_time: 45ms
    id: tv_on
```
