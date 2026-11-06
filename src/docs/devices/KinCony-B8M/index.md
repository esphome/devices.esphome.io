---
title: KinCony-B8M (ESP32-S3 8CH MOSFET)
date-published: 2025-07-01
type: relay
standard: global
board: esp32
---

![Product](B8M_1.jpg "Product Image")
![Product](B8M-diagram.jpg "Product Image")

## Resources

- [ESP32 pin define details](https://www.kincony.com/forum/showthread.php?tid=8209)
- [YouTube video tour](https://youtu.be/hFLZZWhzYuA)

## ESPHome Configuration

Here is an example YAML configuration for the KinCony-B8M board.

```yaml
esphome:
  name: b8m
  friendly_name: b8m

esp32:
  variant: esp32s3
  framework:
    type: arduino

api:

ethernet:
  type: W5500
  clk_pin: GPIO1
  mosi_pin: GPIO2
  miso_pin: GPIO41
  cs_pin: GPIO42
  interrupt_pin: GPIO43
  reset_pin: GPIO44

i2c:
  - id: bus_a
    sda: GPIO8
    scl: GPIO18
    scan: true
    frequency: 400kHz

pcf8574:
  - id: pcf8574_hub_out_1 # for output channel 0-7| input channel 8-15
    i2c_id: bus_a
    address: 0x22
    pcf8575: true

uart:
  - id: uart_1 #RS485
    baud_rate: 9600
    debug:
      direction: BOTH
      dummy_receiver: true
      after:
        timeout: 10ms
    tx_pin: GPIO39
    rx_pin: GPIO38

switch:
  - platform: uart
    uart_id: uart_1
    name: "RS485 Button"
    data: [0x11, 0x22, 0x33, 0x44, 0x55]

  - platform: gpio
    name: "b8m-output01"
    id: "b8m_output01"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 0
      mode: OUTPUT
      inverted: true
  - platform: gpio
    name: "b8m-output02"
    id: "b8m_output02"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 1
      mode: OUTPUT
      inverted: true
  - platform: gpio
    name: "b8m-output03"
    id: "b8m_output03"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 2
      mode: OUTPUT
      inverted: true
  - platform: gpio
    name: "b8m-output04"
    id: "b8m_output04"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 3
      mode: OUTPUT
      inverted: true
  - platform: gpio
    name: "b8m-output05"
    id: "b8m_output05"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 4
      mode: OUTPUT
      inverted: true
  - platform: gpio
    name: "b8m-output06"
    id: "b8m_output06"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 5
      mode: OUTPUT
      inverted: true
  - platform: gpio
    name: "b8m-output07"
    id: "b8m_output07"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 6
      mode: OUTPUT
      inverted: true
  - platform: gpio
    name: "b8m-output08"
    id: "b8m_output08"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 7
      mode: OUTPUT
      inverted: true

binary_sensor:
  - platform: gpio
    name: "b8m-input01"
    id: "b8m_input01"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 8
      mode: INPUT
      inverted: true
  - platform: gpio
    name: "b8m-input02"
    id: "b8m_input02"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 9
      mode: INPUT
      inverted: true
  - platform: gpio
    name: "b8m-input03"
    id: "b8m_input03"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 10
      mode: INPUT
      inverted: true
  - platform: gpio
    name: "b8m-input04"
    id: "b8m_input04"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 11
      mode: INPUT
      inverted: true
  - platform: gpio
    name: "b8m-input05"
    id: "b8m_input05"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 12
      mode: INPUT
      inverted: true
  - platform: gpio
    name: "b8m-input06"
    id: "b8m_input06"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 13
      mode: INPUT
      inverted: true
  - platform: gpio
    name: "b8m-input07"
    id: "b8m_input07"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 14
      mode: INPUT
      inverted: true
  - platform: gpio
    name: "b8m-input08"
    id: "b8m_input08"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 15
      mode: INPUT
      inverted: true

  ## pull-up resistance on PCB
  - platform: gpio
    name: "b8m-W1-io47"
    pin:
      number: GPIO47
      inverted: true

  - platform: gpio
    name: "b8m-W1-io48"
    pin:
      number: GPIO48
      inverted: true

  - platform: gpio
    name: "b8m-W1-io7"
    pin:
      number: GPIO7
      inverted: true

  - platform: gpio
    name: "b8m-W1-io40"
    pin:
      number: GPIO40
      inverted: true
  ## without resistance on PCB
  - platform: gpio
    name: "b8m-13"
    pin:
      number: GPIO13
      inverted: false
  - platform: gpio
    name: "b8m-14"
    pin:
      number: GPIO14
      inverted: false
  - platform: gpio
    name: "b8m-21"
    pin:
      number: GPIO21
      inverted: false
  - platform: gpio
    name: "b8m-0"
    pin:
      number: GPIO0
      inverted: false

ads1115:
  - address: 0x48

sensor:
  - platform: ads1115
    multiplexer: A0_GND
    gain: 6.144
    resolution: 16_BITS
    name: "ADS1115 Channel A0-GND"
    update_interval: 5s
  - platform: ads1115
    multiplexer: A1_GND
    gain: 6.144
    name: "ADS1115 Channel A1-GND"
    update_interval: 5s
  - platform: ads1115
    multiplexer: A2_GND
    gain: 6.144
    name: "ADS1115 Channel A2-GND"
    update_interval: 5s
  - platform: ads1115
    multiplexer: A3_GND
    gain: 6.144
    name: "ADS1115 Channel A3-GND"
    update_interval: 5s

font:
  - file: "gfonts://Roboto"
    id: roboto
    size: 20

display:
  - platform: ssd1306_i2c
    i2c_id: bus_a
    model: "SSD1306 128x64"
    address: 0x3C
    lambda: |-
      it.printf(0, 0, id(roboto), "KinCony B8M");
```
