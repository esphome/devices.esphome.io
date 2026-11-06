---
title: KinCony KC868-A4S
date-published: 2023-04-17
type: relay
standard: global
board: esp32
---

## GPIO Pinout

| Pin    | Function                        |
| ------ | ------------------------------- |
| GPIO36 | ANALOG_A1                       |
| GPIO39 | ANALOG_A2                       |
| GPIO34 | ANALOG_A3                       |
| GPIO35 | ANALOG_A4                       |
| GPIO4  | IIC_SDA                         |
| GPIO16 | IIC_SCL                         |
| GPIO5  | DS18B20/DHT11/DHT21/LED strip-1 |
| GPIO14 | DS18B20/DHT11/DHT21/LED strip-2 |
| GPIO23 | ETH_MDC                         |
| GPIO18 | ETH_MDIO                        |
| GPIO33 | RS485_RXD                       |
| GPIO32 | RS485_TXD                       |
| GPIO13 | GSM_RXD                         |
| GPIO15 | GSM_TXD                         |

[Additional pinout/design details](https://www.kincony.com/forum/forumdisplay.php?fid=41)

## Basic Configuration

```yaml
esphome:
  name: a4s

esp32:
  variant: esp32

# Example configuration entry for ESP32
i2c:
  sda: 4
  scl: 16
  scan: true
  id: bus_a

# Example configuration entry
ethernet:
  type: LAN8720
  mdc_pin: GPIO23
  mdio_pin: GPIO18
  clk_mode: GPIO17_OUT
  phy_addr: 0

# Example configuration entry
pcf8574:
  - id: "pcf8574_hub_out_1" # for output channel 1-4   for DI9--DI12
    address: 0x24
  - id: "pcf8574_hub_in_1" # for input channel 1-8
    address: 0x22

# Individual outputs
switch:
  - platform: gpio
    name: "a4s-light1"
    id: light1
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 0
      mode: OUTPUT
      inverted: true
  - platform: gpio
    name: "a4s-light2"
    id: light2
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 1
      mode: OUTPUT
      inverted: true
  - platform: gpio
    name: "a4s-light3"
    id: light3
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 2
      mode: OUTPUT
      inverted: true
  - platform: gpio
    name: "a4s-light4"
    id: light4
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 3
      mode: OUTPUT
      inverted: true

binary_sensor:
  - platform: gpio
    name: "a4s-input1"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 0
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a4s-input2"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 1
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a4s-input3"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 2
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a4s-input4"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 3
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a4s-input5"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 4
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a4s-input6"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 5
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a4s-input7"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 6
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a4s-input8"
    pin:
      pcf8574: pcf8574_hub_in_1
      number: 7
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a4s-input9"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 4
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a4s-input10"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 5
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a4s-input11"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 6
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "a4s-input12"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 7
      mode: INPUT
      inverted: true

pca9685:
  id: "pca9685_hub"
  frequency: 500

output:
  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM0"
    channel: 0

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM1"
    channel: 1

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM2"
    channel: 2

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM3"
    channel: 3

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM4"
    channel: 4

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM5"
    channel: 5

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM6"
    channel: 6

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM7"
    channel: 7

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM8"
    channel: 8

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM9"
    channel: 9

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM10"
    channel: 10

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM11"
    channel: 11

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM12"
    channel: 12

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM13"
    channel: 13

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM14"
    channel: 14

  - platform: pca9685
    pca9685_id: "pca9685_hub"
    id: "PWM15"
    channel: 15

light:
  - platform: monochromatic
    name: "a4s-Color-LED-1"
    output: PWM0
  - platform: monochromatic
    name: "a4s-Color-LED-2"
    output: PWM1
  - platform: monochromatic
    name: "a4s-Color-LED-3"
    output: PWM2
  - platform: monochromatic
    name: "a4s-Color-LED-4"
    output: PWM3
  - platform: monochromatic
    name: "a4s-Color-LED-5"
    output: PWM4
  - platform: monochromatic
    name: "a4s-Color-LED-6"
    output: PWM5
  - platform: monochromatic
    name: "a4s-Color-LED-7"
    output: PWM6
  - platform: monochromatic
    name: "a4s-Color-LED-8"
    output: PWM7
  - platform: monochromatic
    name: "a4s-Color-LED-9"
    output: PWM8
  - platform: monochromatic
    name: "a4s-Color-LED-10"
    output: PWM9
  - platform: monochromatic
    name: "a4s-Color-LED-11"
    output: PWM10
  - platform: monochromatic
    name: "a4s-Color-LED-12"
    output: PWM11
  - platform: monochromatic
    name: "a4s-Color-LED-13"
    output: PWM12
  - platform: monochromatic
    name: "a4s-Color-LED-14"
    output: PWM13
  - platform: monochromatic
    name: "a4s-Color-LED-15"
    output: PWM14
  - platform: monochromatic
    name: "a4s-Color-LED-16"
    output: PWM15

  - platform: rgbw
    name: "a4s-rgbw"
    red: PWM1
    green: PWM2
    blue: PWM3
    white: PWM4

# Enable logging
logger:

# Enable Home Assistant API
api:
```
