---
title: Orno Single Phase Energy meter OR-WE-504
date-published: 2024-01-27
type: misc
standard: eu
board: esp32
---

## GPIO Pinout

| Pin    | Function         |
| ------ | ---------------- |
| GPIO03 | RS485 adapter TX |
| GPIO01 | RS485 adapter RX |

Note: you may need to reverse the RX/TX cabling depending on your platform.

## Connection

Use a RS485 adapter (RS485 to TTL) like [this one](https://esphome.io/images/rs485.jpg).

## ESPHome configuration

Available memory registries can be found [in the Tasmota discussions](https://github.com/arendst/Tasmota/discussions/15541#discussion-4053434).

```yaml
esphome:
  name: energy_meter

esp32:
  variant: esp32

api:

ota:
  password: "CHANGE_ME"

wifi:
  ssid: "your ssid"
  password: "your password"

# Turn off logging because RX/TX pins used for modbus
logger:
  level: DEBUG
  baud_rate: 0 # off

uart:
  id: mod_bus
  rx_pin: GPIO03
  tx_pin: GPIO01
  baud_rate: 9600
  parity: EVEN
  stop_bits: 1

modbus:
  id: modbus1

modbus_controller:
  - id: orno_we_504
    address: 0x1
    modbus_id: modbus1
    setup_priority: -10
    update_interval: 20s

sensor:
  # Voltage
  - platform: modbus_controller
    modbus_controller_id: orno_we_504
    name: "Voltage"
    id: orno_we_504_modbus_voltage
    register_type: holding
    address: 0
    device_class: VOLTAGE
    unit_of_measurement: "V"
    value_type: U_WORD
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  # Current
  - platform: modbus_controller
    modbus_controller_id: orno_we_504
    name: "Current"
    id: orno_we_504_modbus_current
    register_type: holding
    address: 1
    device_class: CURRENT
    unit_of_measurement: "A"
    value_type: U_WORD
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  # Grid frequency
  - platform: modbus_controller
    modbus_controller_id: orno_we_504
    name: "Grid frequency"
    id: orno_we_504_modbus_grid_frequency
    register_type: holding
    address: 2
    device_class: FREQUENCY
    unit_of_measurement: "Hz"
    value_type: U_WORD
    accuracy_decimals: 2
    filters:
      - multiply: 0.1

  # Active power
  - platform: modbus_controller
    modbus_controller_id: orno_we_504
    name: "Active power"
    id: orno_we_504_active_power
    register_type: holding
    address: 3
    device_class: POWER
    unit_of_measurement: "W"
    value_type: U_WORD
    accuracy_decimals: 0

  # Reactive power
  - platform: modbus_controller
    modbus_controller_id: orno_we_504
    name: "Reactive power"
    id: orno_we_504_reactive_power
    register_type: holding
    address: 4
    device_class: REACTIVE_POWER
    unit_of_measurement: "var"
    value_type: U_WORD
    accuracy_decimals: 0

  # Apparent power
  - platform: modbus_controller
    modbus_controller_id: orno_we_504
    name: "Apparent power"
    id: orno_we_504_apparent_power
    register_type: holding
    address: 5
    device_class: APPARENT_POWER
    unit_of_measurement: "VA"
    value_type: U_WORD
    accuracy_decimals: 0

  # Power factor
  - platform: modbus_controller
    modbus_controller_id: orno_we_504
    name: "Power factor"
    id: orno_we_504_power_factor
    register_type: holding
    address: 6
    device_class: POWER_FACTOR
    unit_of_measurement: ""
    value_type: U_WORD
    accuracy_decimals: 3
    filters:
      - multiply: 0.001

  # Active energy
  - platform: modbus_controller
    modbus_controller_id: orno_we_504
    name: "Active energy"
    id: orno_we_504_power_active_energy
    register_type: holding
    address: 7
    device_class: ENERGY
    state_class: total
    unit_of_measurement: "kWh"
    value_type: U_DWORD
    accuracy_decimals: 2
    filters:
      - multiply: 0.001

  # Reactive energy
  - platform: modbus_controller
    modbus_controller_id: orno_we_504
    name: "Reactive energy"
    id: orno_we_504_power_reactive_energy
    register_type: holding
    address: 9
    device_class: ENERGY
    state_class: total
    unit_of_measurement: "kvarh"
    value_type: U_DWORD
    accuracy_decimals: 2
    filters:
      - multiply: 0.001
```
