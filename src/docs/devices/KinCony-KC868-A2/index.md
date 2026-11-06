---
title: KinCony KC868-A2
date-published: 2023-04-06
type: relay
standard: global
board: esp32
---

## GPIO Pinout

| Pin    | Function      |
| ------ | ------------- |
| GPIO15 | Relay1        |
| GPIO2  | Relay2        |
| GPIO33 | 1-wire GPIO-1 |
| GPIO14 | 1-wire GPIO-2 |
| GPIO35 | RS485-RXD     |
| GPIO32 | RS485-TXD     |
| GPIO34 | GSM-RXD       |
| GPIO13 | GSM-TXD       |

[Additional pinout/design details](https://www.kincony.com/forum/forumdisplay.php?fid=43)

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: kicony-kc868-a2
  friendly_name: KinCony KC868-A2

esp32:
  variant: esp32
  framework:
    type: arduino

# your OTA/API/Wifi/logger boilerplate here

ethernet:
  type: LAN8720
  mdc_pin: GPIO23
  mdio_pin: GPIO18
  clk_mode: GPIO17_OUT
  phy_addr: 0

switch:
  - platform: gpio
    name: "a2-light1"
    pin: 15
    inverted: False
  - platform: gpio
    name: "a2-light2"
    pin: 2
    inverted: False

binary_sensor:
  - platform: gpio
    name: "a2-input1"
    pin:
      number: 36
      inverted: true
  - platform: gpio
    name: "a2-input2"
    pin:
      number: 39
      inverted: true
```
