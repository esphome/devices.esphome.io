---
title: KinCony KC868-A8
date-published: 2023-04-25
type: relay
standard: global
board: esp32
---

## GPIO Pinout

| Pin    | Function           |
| ------ | ------------------ |
| GPIO34 | ANALOG_A1          |
| GPIO35 | ANALOG_A2          |
| GPIO4  | IIC_SDA            |
| GPIO5  | IIC_SCL            |
| GPIO14 | 1-Wire GPIO        |
| GPIO13 | 1-Wire GPIO        |
| GPIO32 | 1-Wire GPIO        |
| GPIO33 | 1-Wire GPIO        |
| GPIO2 | 433MHz Transmitter |
| GPIO15  | 433MHz Receiver    |

[Additional pinout/design details](https://www.kincony.com/arduino-esp32-8-channel-relay-module-kc868-a8.html)

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: kc868-a8

esp32:
  variant: esp32

i2c:
  sda: 4
  scl: 5
  scan: true
  id: bus_a

ethernet:
  type: LAN8720
  mdc_pin: GPIO23
  mdio_pin: GPIO18
  clk_mode: GPIO17_OUT
  phy_addr: 0

pcf8574:
  - id: "pcf8574_hub_out_1" # for output channel 1-8
    address: 0x24

  - id: "pcf8574_hub_in_1" # for input channel 1-8
    address: 0x22

# Individual outputs
switch:
  - platform: gpio
    name: "a8-light1"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 0
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "a8-light2"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 1
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "a8-light3"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 2
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "a8-light4"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 3
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "a8-light5"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 4
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "a8-light6"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 5
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "a8-light7"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 6
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "a8-light8"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 7
      mode: OUTPUT
      inverted: true

binary_sensor:
  - platform: gpio
    name: "a8-input1"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 0
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a8-input2"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 1
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a8-input3"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 2
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a8-input4"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 3
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a8-input5"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 4
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a8-input6"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 5
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a8-input7"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 6
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a8-input8"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 7
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a8-s3"
    pin:
      number: 32
      inverted: true

  - platform: gpio
    name: "a8-s4"
    pin:
      number: 33
      inverted: true

one_wire:
  - platform: gpio
    pin: GPIO14

sensor:
  - platform: dallas_temp
    address: 0x1c0000031edd2a28 #replace with your sensor's ID
    name: "ds18b20-1"

# Enable logging
logger:

# Enable Home Assistant API
api:
```
