---
title: KinCony-DM8 (ESP32-S3 8CH Dimmer board)
date-published: 2026-03-17
type: dimmer
standard: global
board: esp32
---

![Product](DM8-1.jpg "Product Image")

## Resources

- [ESP32 pin define details](https://www.kincony.com/forum/showthread.php?tid=9005)

## ESPHome Configuration

Here is an example YAML configuration for the KinCony DM8 ESP32-S3 dimmer board.

```yaml
esphome:
  name: dm8
  friendly_name: dm8

esp32:
  board: esp32-s3-devkitc-1
  framework:
    type: arduino

# Enable logging
logger:

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

uart:
  - id: uart_1 # RS485
    baud_rate: 9600
    debug:
      direction: BOTH
      dummy_receiver: true
      after:
        timeout: 10ms
    tx_pin: 39
    rx_pin: 38

  - id: dac_uart
    rx_pin: 4
    tx_pin: 6
    baud_rate: 115200
    stop_bits: 1
    data_bits: 8
    parity: NONE
    debug:

modbus:
  uart_id: dac_uart

modbus_controller:
  - address: 1
    update_interval: 5s

i2c:
  - id: bus_a
    sda: 8
    scl: 18
    scan: true
    frequency: 400kHz

text_sensor:
  - platform: ethernet_info
    ip_address:
      name: ESP IP Address
      id: eth_ip
      address_0:
        name: ESP IP Address 0
      address_1:
        name: ESP IP Address 1
      address_2:
        name: ESP IP Address 2
      address_3:
        name: ESP IP Address 3
      address_4:
        name: ESP IP Address 4
    dns_address:
      name: ESP DNS Address
    mac_address:
      name: ESP MAC Address

font:
  - file: "gfonts://Roboto"
    id: roboto
    size: 15

display:
  - platform: ssd1306_i2c
    model: "SSD1306 128x64"
    address: 0x3C
    lambda: |-
      it.printf(0, 15, id(roboto), "IP: %s", id(eth_ip).state.c_str());

output:
  # CH1 (0x0FA0 / 4000)
  - platform: modbus_controller
    id: dac_ch1_out
    address: 0x0FA0
    value_type: U_WORD
    write_lambda: |-
      // state = 0.0 ~ 1.0 → 0 ~ 4095
      uint16_t reg = (uint16_t) round(x * 4095.0);
      return reg;

  # CH2 (0x0FA1 / 4001)
  - platform: modbus_controller
    id: dac_ch2_out
    address: 0x0FA1
    value_type: U_WORD
    write_lambda: |-
      uint16_t reg = (uint16_t) round(x * 4095.0);
      return reg;

  # CH3
  - platform: modbus_controller
    id: dac_ch3_out
    address: 0x0FA2
    value_type: U_WORD
    write_lambda: |-
      uint16_t reg = (uint16_t) round(x * 4095.0);
      return reg;

  # CH4
  - platform: modbus_controller
    id: dac_ch4_out
    address: 0x0FA3
    value_type: U_WORD
    write_lambda: |-
      uint16_t reg = (uint16_t) round(x * 4095.0);
      return reg;

  # CH5
  - platform: modbus_controller
    id: dac_ch5_out
    address: 0x0FA4
    value_type: U_WORD
    write_lambda: |-
      uint16_t reg = (uint16_t) round(x * 4095.0);
      return reg;

  # CH6
  - platform: modbus_controller
    id: dac_ch6_out
    address: 0x0FA5
    value_type: U_WORD
    write_lambda: |-
      uint16_t reg = (uint16_t) round(x * 4095.0);
      return reg;

  # CH7
  - platform: modbus_controller
    id: dac_ch7_out
    address: 0x0FA6
    value_type: U_WORD
    write_lambda: |-
      uint16_t reg = (uint16_t) round(x * 4095.0);
      return reg;

  # CH8 (0x0FA7 / 4007)
  - platform: modbus_controller
    id: dac_ch8_out
    address: 0x0FA7
    value_type: U_WORD
    write_lambda: |-
      uint16_t reg = (uint16_t) round(x * 4095.0);
      return reg;

light:
  - platform: monochromatic
    name: "DAC CH1"
    output: dac_ch1_out
    default_transition_length: 0s

  - platform: monochromatic
    name: "DAC CH2"
    output: dac_ch2_out
    default_transition_length: 0s

  - platform: monochromatic
    name: "DAC CH3"
    output: dac_ch3_out
    default_transition_length: 0s

  - platform: monochromatic
    name: "DAC CH4"
    output: dac_ch4_out
    default_transition_length: 0s

  - platform: monochromatic
    name: "DAC CH5"
    output: dac_ch5_out
    default_transition_length: 0s

  - platform: monochromatic
    name: "DAC CH6"
    output: dac_ch6_out
    default_transition_length: 0s

  - platform: monochromatic
    name: "DAC CH7"
    output: dac_ch7_out
    default_transition_length: 0s

  - platform: monochromatic
    name: "DAC CH8"
    output: dac_ch8_out
    default_transition_length: 0s

pcf8574:
  - id: pcf8574_hub_1 # for input channel 1-8
    i2c_id: bus_a
    address: 0x24

switch:
  - platform: uart
    uart_id: uart_1
    name: "RS485 Button"
    data: [0x11, 0x22, 0x33, 0x44, 0x55]

binary_sensor:
  - platform: gpio
    name: "dm8-input01"
    id: dm8_input01
    pin:
      pcf8574: pcf8574_hub_1
      number: 0
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "dm8-input02"
    id: dm8_input02
    pin:
      pcf8574: pcf8574_hub_1
      number: 1
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "dm8-input03"
    id: dm8_input03
    pin:
      pcf8574: pcf8574_hub_1
      number: 2
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "dm8-input04"
    id: dm8_input04
    pin:
      pcf8574: pcf8574_hub_1
      number: 3
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "dm8-input05"
    id: dm8_input05
    pin:
      pcf8574: pcf8574_hub_1
      number: 4
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "dm8-input06"
    id: dm8_input06
    pin:
      pcf8574: pcf8574_hub_1
      number: 5
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "dm8-input07"
    id: dm8_input07
    pin:
      pcf8574: pcf8574_hub_1
      number: 6
      mode: INPUT
      inverted: true

  - platform: gpio
    name: "dm8-input08"
    id: dm8_input08
    pin:
      pcf8574: pcf8574_hub_1
      number: 7
      mode: INPUT
      inverted: true

  ## pull-up resistance on PCB
  - platform: gpio
    name: "dm8-W1-io47"
    pin:
      number: 47
      inverted: true

  - platform: gpio
    name: "dm8-W1-io48"
    pin:
      number: 48
      inverted: true

  - platform: gpio
    name: "dm8-W1-io17"
    pin:
      number: 17
      inverted: true

  - platform: gpio
    name: "dm8-W1-io40"
    pin:
      number: 40
      inverted: true

  ## without resistance on PCB
  - platform: gpio
    name: "dm8-W1-io13"
    pin:
      number: 13
      inverted: false

  - platform: gpio
    name: "dm8-W1-io14"
    pin:
      number: 14
      inverted: false

  - platform: gpio
    name: "dm8-W1-io21"
    pin:
      number: 21
      inverted: false

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
```
