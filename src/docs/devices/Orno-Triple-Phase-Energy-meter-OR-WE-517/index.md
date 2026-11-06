---
title: Orno Triple Phase Energy meter OR-WE-517
date-published: 2021-11-20
type: misc
standard: eu
board: esp8266
---

## GPIO Pinout

| Pin    | Function  |
| ------ | --------- |
| GPIO03 | modbus RX |
| GPIO01 | modbus TX |

## Connection

Use RS485 adapter like this one: [https://esphome.io/images/rs485.jpg](https://esphome.io/images/rs485.jpg)
This one works with 3.3V and does direction switching automatically

```yaml
esphome:
  name: energie12

esp8266:
  board: d1_mini

# Configure logging
# turn off logging because RX/TX pins used for modbus
logger:
  level: DEBUG
  baud_rate: 0 #off

# Enable Home Assistant API
api:

wifi:
  ssid: "your_ssid"
  password: "your_password"

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "Fallback Hotspot"
    password: "xxxxxxxxxxxxxxx"

captive_portal:

uart:
  id: mod_bus
  rx_pin: GPIO01
  tx_pin: GPIO03
  # required for this meter type
  baud_rate: 9600
  parity: EVEN
  stop_bits: 1

modbus:
  id: modbus1
  # flow_control_pin: 5
  # not needed for my RS485 converter, but likely useful for ones with DE / RE pins
  # uart_id: mod_bus
  # maybe required when having multiple UARTs
modbus_controller:
  - id: orno_we_517 # most likely similar devices will work as well
    # the Modbus device addr
    address: 0x1
    modbus_id: modbus1
    update_interval: 60s
    command_throttle: 1s
    # command throttle recommended to process only one command and result at a time
    # number of 'registers/sensors' * command_throttle  < update_interval
    setup_priority: -10

sensor:
  - platform: modbus_controller
    modbus_controller_id: orno_we_517
    name: "02_Voltage_L1"
    id: orno_we_17_modbus_voltage_L1
    register_type: holding
    address: 0x00E
    unit_of_measurement: V
    accuracy_decimals: 2
    value_type: FP32
  - platform: modbus_controller
    modbus_controller_id: orno_we_517
    name: "02_Voltage_L2"
    id: orno_we_17_modbus_voltage_L2
    register_type: holding
    address: 0x010
    unit_of_measurement: V
    accuracy_decimals: 2
    value_type: FP32
  - platform: modbus_controller
    modbus_controller_id: orno_we_517
    name: "02_Voltage_L3"
    id: orno_we_17_modbus_voltage_L3
    register_type: holding
    address: 0x012
    unit_of_measurement: V
    accuracy_decimals: 2
    value_type: FP32

  - platform: modbus_controller
    modbus_controller_id: orno_we_517
    name: "02_Current_L1"
    id: orno_we_517_modbus_current_L1
    register_type: holding
    address: 0x016
    unit_of_measurement: A
    value_type: FP32
    filters:
      - multiply: 0.01
  - platform: modbus_controller
    modbus_controller_id: orno_we_517
    name: "02_Current_L2"
    id: orno_we_517_modbus_current_L2
    register_type: holding
    address: 0x018
    unit_of_measurement: A
    value_type: FP32
    filters:
      - multiply: 0.01
  - platform: modbus_controller
    modbus_controller_id: orno_we_517
    name: "03_Current_L3"
    id: orno_we_517_modbus_current_L3
    register_type: holding
    address: 0x01A
    unit_of_measurement: A
    value_type: FP32
    filters:
      - multiply: 0.01

  - platform: modbus_controller
    modbus_controller_id: orno_we_517
    name: "03_Current_ALL"
    id: orno_we_517_modbus_current_ALL
    register_type: holding
    address: 0x01C
    unit_of_measurement: kW
    value_type: FP32
    filters:
      - multiply: 0.01
  - platform: modbus_controller
    modbus_controller_id: orno_we_517
    name: "02_Leistung_L1"
    id: orno_we_517_modbus_Kw_01
    register_type: holding
    address: 0x01E
    unit_of_measurement: kW
    value_type: FP32
    filters:
      - multiply: 1000
  - platform: modbus_controller
    modbus_controller_id: orno_we_517
    name: "02_Leistung_L2"
    id: orno_we_517_modbus_Kw_02
    register_type: holding
    address: 0x020
    unit_of_measurement: kW
    value_type: FP32
    filters:
      - multiply: 1000
  - platform: modbus_controller
    modbus_controller_id: orno_we_517
    name: "02_Leistung_L3"
    id: orno_we_517_modbus_Kw_03
    register_type: holding
    address: 0x022
    unit_of_measurement: kW
    value_type: FP32
    filters:
      - multiply: 1000

  - platform: modbus_controller
    modbus_controller_id: orno_we_517
    name: "02_Hz_L1"
    id: orno_we_17_modbus_Hz
    register_type: holding
    address: 0x014
    unit_of_measurement: "Hz"
    accuracy_decimals: 2
    value_type: FP32
```
