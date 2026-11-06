---
title: KinCony-B8 (ESP32-S3 8CH Relay board)
date-published: 2025-09-07

type: relay
standard: global
board: esp32
---

![Product](B8-1.jpg "Product Image")

## Resources

- [ESP32 pin define details](https://www.kincony.com/forum/showthread.php?tid=8225)

## ESPHome Configuration

Here is an example YAML configuration for the KinCony B8 ESP32-S3 relay board.

```yaml
esphome:
  name: b8
  friendly_name: b8

esp32:
  variant: esp32s3
  framework:
    type: arduino

# Enable logging
# logger:
#   hardware_uart: USB_SERIAL_JTAG

# Enable Home Assistant API
api:

ota:
  platform: esphome

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
     sda: 8
     scl: 18
     scan: true
     frequency: 400kHz

pcf8574:
  - id: 'pcf8574_hub_out_1'  # for output channel 0-7| input channel 8-15
    i2c_id: bus_a
    address: 0x22
    pcf8575: true

uart:
  - id: uart_1    #RS485
    baud_rate: 9600
    debug:
      direction: BOTH
      dummy_receiver: true
      after:
        timeout: 10ms
    tx_pin: 39
    rx_pin: 38


switch:
  - platform: uart
    uart_id: uart_1
    name: "RS485 Button"
    data: [0x11, 0x22, 0x33, 0x44, 0x55]

  - platform: gpio
    name: "b8-output01"
    id: "b8_output01"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 8
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "b8-output02"
    id: "b8_output02"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 9
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "b8-output03"
    id: "b8_output03"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 10
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "b8-output04"
    id: "b8_output04"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 11
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "b8-output05"
    id: "b8_output05"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 12
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "b8-output06"
    id: "b8_output06"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 13
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "b8-output07"
    id: "b8_output07"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 14
      mode: OUTPUT
      inverted: true

  - platform: gpio
    name: "b8-output08"
    id: "b8_output08"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 15
      mode: OUTPUT
      inverted: true

binary_sensor:
  - platform: gpio
    name: "b8-input01"
    id: "b8_input01"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 0
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "b8-input02"
    id: "b8_input02"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 1
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "b8-input03"
    id: "b8_input03"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 2
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "b8-input04"
    id: "b8_input04"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 3
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "b8-input05"
    id: "b8_input05"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 4
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "b8-input06"
    id: "b8_input06"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 5
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "b8-input07"
    id: "b8_input07"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 6
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "b8-input08"
    id: "b8_input08"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 7
      mode: INPUT
      inverted: true

##pull-up resistance on PCB
  - platform: gpio
    name: "b8-W1-io47"
    pin:
      number: 47
      inverted: true

  - platform: gpio
    name: "b8-W1-io48"
    pin:
      number: 48
      inverted: true

  - platform: gpio
    name: "b8-W1-io7"
    pin:
      number: 7
      inverted: true

  - platform: gpio
    name: "b8-W1-io40"
    pin:
      number: 40
      inverted: true
## without resistance on PCB
  - platform: gpio
    name: "b8-13"
    pin:
      number: 13
      inverted:  false
  - platform: gpio
    name: "b8-14"
    pin:
      number: 14
      inverted:  false
  - platform: gpio
    name: "b8-21"
    pin:
      number: 21
      inverted:  false
  - platform: gpio
    name: "b8-0"
    pin:
      number: 0
      inverted:  false

ads1115:
  - address: 0x48
sensor:
  - platform: ads1115
    multiplexer: 'A0_GND'
    gain: 6.144
    resolution: 16_BITS
    name: "ADS1115 Channel A0-GND"
    update_interval: 5s
  - platform: ads1115
    multiplexer: 'A1_GND'
    gain: 6.144
    name: "ADS1115 Channel A1-GND"
    update_interval: 5s
  - platform: ads1115
    multiplexer: 'A2_GND'
    gain: 6.144
    name: "ADS1115 Channel A2-GND"
    update_interval: 5s
  - platform: ads1115
    multiplexer: 'A3_GND'
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
      it.printf(0, 0, id(roboto), "KinCony b8");
```
