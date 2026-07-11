---
title: Orno Single Phase Energy meter OR-WE-514
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
  name: energy_meter

esp8266:
  board: esp12e

# Configure logging
# turn off logging because RX/TX pins used for modbus
logger:
  level: DEBUG
  baud_rate: 0 #off

# Enable Home Assistant API
api:

ota:
  password: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

wifi:
  ssid: "your ssid"
  password: "your-wlan-password"

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "Fallback Hotspot"
    password: "xxxxxxxxxxxx"

captive_portal:

uart:
  id: mod_bus
  rx_pin: GPIO03
  tx_pin: GPIO01
  # required for this meter type
  baud_rate: 9600
  parity: EVEN
  stop_bits: 1

modbus:
  id: modbus1
  # flow_control_pin: 5
  # not needed for my RS485 converter, but likely useful for ones with DE / RE pins

modbus_controller:
  - id: orno_we_514 # most likely similar devices will work as well
    # the Modbus device addr
    address: 0x1
    modbus_id: modbus1
    setup_priority: -10

sensor:
  - platform: modbus_controller
    modbus_controller_id: orno_we_514
    name: "Modbus ID"
    id: orno_we_514_modbus_id
    register_type: holding
    address: 0x0110
    unit_of_measurement: ""
    value_type: U_WORD
  - platform: modbus_controller
    modbus_controller_id: orno_we_514
    name: "Modbus Baudrate"
    id: orno_we_514_modbus_baudrate
    register_type: holding
    address: 0x0111
    unit_of_measurement: ""
    value_type: U_WORD
  - platform: modbus_controller
    modbus_controller_id: orno_we_514
    name: "LCD Dislay state"
    id: orno_we_514_modbus_lcd_display_state
    register_type: holding
    address: 0x112
    unit_of_measurement: ""
    value_type: U_WORD
  #LCD activation code:
  #bit0:active energy
  #bit1：reactive energy
  #bit2：voltage
  #Bit3：current
  #bit4：active power bit5：reactivepower
  #bit6：Apparent power
  #Bit7：power factor；measure mode
  - platform: modbus_controller
    modbus_controller_id: orno_we_514
    name: "Grid Frequency"
    id: orno_we_514_modbus_grid_frequency
    register_type: holding
    address: 0x0130
    unit_of_measurement: "hz"
    value_type: U_WORD
    accuracy_decimals: 2
    filters:
      - multiply: 0.01
  - platform: modbus_controller
    modbus_controller_id: orno_we_514
    name: "Voltage"
    id: orno_we_514_modbus_voltage
    register_type: holding
    address: 0x0131
    unit_of_measurement: "V"
    value_type: U_WORD
    accuracy_decimals: 2
    filters:
      - multiply: 0.01
  - platform: modbus_controller
    modbus_controller_id: orno_we_514
    name: "Current"
    id: orno_we_514_modbus_current
    register_type: holding
    address: 0x0139
    unit_of_measurement: "A"
    value_type: U_DWORD
    accuracy_decimals: 3
    filters:
      - multiply: 0.001
  - platform: modbus_controller
    modbus_controller_id: orno_we_514
    name: "Active Power"
    id: orno_we_514_active_power
    register_type: holding
    address: 0x0140
    unit_of_measurement: "kW"
    value_type: U_DWORD
    accuracy_decimals: 3
    filters:
      - multiply: 0.001
  - platform: modbus_controller
    modbus_controller_id: orno_we_514
    name: "Reactive Power"
    id: orno_we_514_reactive_power
    register_type: holding
    address: 0x0148
    unit_of_measurement: "kvarh"
    value_type: U_DWORD
    accuracy_decimals: 3
    filters:
      - multiply: 0.001
  - platform: modbus_controller
    modbus_controller_id: orno_we_514
    name: "Apparent Power"
    id: orno_we_514_apparent_power
    register_type: holding
    address: 0x0150
    unit_of_measurement: "kva"
    value_type: U_DWORD
    accuracy_decimals: 3
    filters:
      - multiply: 0.001
  - platform: modbus_controller
    modbus_controller_id: orno_we_514
    name: "Power Factor"
    id: orno_we_514_power_factor
    register_type: holding
    address: 0x0158
    unit_of_measurement: ""
    value_type: U_WORD
  - platform: modbus_controller
    modbus_controller_id: orno_we_514
    name: "Active Energy"
    id: orno_we_514_power_active_energy
    register_type: holding
    address: 0xA000
    unit_of_measurement: "kWh"
    value_type: U_DWORD
    accuracy_decimals: 2
    filters:
      - multiply: 0.01
  - platform: modbus_controller
    modbus_controller_id: orno_we_514
    name: "Reactive Energy"
    id: orno_we_514_power_reactive_energy
    register_type: holding
    address: 0xA01E
    unit_of_measurement: "kvarh"
    value_type: U_DWORD
    accuracy_decimals: 2
    filters:
      - multiply: 0.01
  # see file:///E:/Users/archi/Downloads/OR-WE-514_MODBUS_Registers_List.pdf for more registers
```
