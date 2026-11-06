---
title: KinCony-B4 (ESP32-S3 4CH Relay board)
date-published: 2026-02-06
type: relay
standard: global
board: esp32
---

![Product](B4-1.jpg "Product Image")

## Resources

- [ESP32 pin define details](https://www.kincony.com/forum/showthread.php?tid=8913)

## ESPHome Configuration

Here is an example YAML configuration for the KinCony B4 ESP32-S3 relay board.

```yaml
esphome:
  name: b4
  friendly_name: b4

esp32:
  board: esp32-s3-devkitc-1
  framework:
    type: arduino
    
# Enable logging
logger: 
   hardware_uart: USB_SERIAL_JTAG
# Enable Home Assistant API
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
     sda: 8
     scl: 18
     scan: true
     frequency: 400kHz

pcf8574:
  - id: 'pcf8574_hub_out_1'  # for output channel 0-7| input channel 8-15   
    i2c_id: bus_a
    address: 0x24

uart:
  - id: uart_1    #RS485
    baud_rate: 9600
    debug:
      direction: BOTH
      dummy_receiver: true
      after:
        timeout: 10ms
    tx_pin: 38
    rx_pin: 39

switch:
  - platform: uart
    uart_id: uart_1
    name: "RS485 Button"
    data: [0x11, 0x22, 0x33, 0x44, 0x55]

  - platform: gpio
    name: "b4-output01"
    id: "b4_output01"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 4
      mode: OUTPUT
      inverted: true


  - platform: gpio
    name: "b4-output02"
    id: "b4_output02"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 5
      mode: OUTPUT
      inverted: true


  - platform: gpio
    name: "b4-output03"
    id: "b4_output03"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 6
      mode: OUTPUT
      inverted: true


  - platform: gpio
    name: "b4-output04"
    id: "b4_output04"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 7
      mode: OUTPUT
      inverted: true


binary_sensor:
  - platform: gpio
    name: "b4-input01"
    id: "b4_input01"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 0
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "b4-input02"
    id: "b4_input02"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 1
      mode: INPUT
      inverted: true


  - platform: gpio
    name: "b4-input03"
    id: "b4_input03"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 2
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "b4-input04"
    id: "b4_input04"
    pin:
      pcf8574: pcf8574_hub_out_1
      number: 3
      mode: INPUT
      inverted: true


##pull-up resistance on PCB
  - platform: gpio
    name: "b4-W1-io47"
    pin: 
      number: 47
      inverted: true

  - platform: gpio
    name: "b4-W1-io48"
    pin: 
      number: 48
      inverted: true

  - platform: gpio
    name: "b4-W1-io17"
    pin: 
      number: 17
      inverted: true

  - platform: gpio
    name: "b4-W1-io40"
    pin: 
      number: 40
      inverted: true
## without resistance on PCB
  - platform: gpio
    name: "b4-13"
    pin: 
      number: 13
      inverted:  false
  - platform: gpio
    name: "b4-14"
    pin: 
      number: 14
      inverted:  false
  - platform: gpio
    name: "b4-21"
    pin: 
      number: 21
      inverted:  false
  - platform: gpio
    name: "b4-0"
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

web_server:
  port: 80

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
      it.printf(0, 0, id(roboto), "KinCony B4");
```
