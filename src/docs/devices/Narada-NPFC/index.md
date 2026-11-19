---
title: Narada NPFC
date-published: 2024-01-09
type: misc
standard: global
---

This documents the Narada NPFC series of high capacity batteries, which
can be accessed over modbus. There are a number of variables which can
be queried to determine the current state of the battery, such as overall
voltage, current, temperature, etc, as well as per cell voltage and temp.

The entities are provided in a package which can be included in the config
of any ESPHome device that has a RS485 transceiver, a UART and
modbus_controller: configured.

Example:

```yaml
uart:
  - id: modbus_uart
    baud_rate: 9600
    tx_pin: GPIO17
    rx_pin: GPIO16

modbus:
  id: modbus1
  uart_id: modbus_uart
  flow_control_pin: GPIO4

modbus_controller:
  - id: narada_39
    address: 39
    modbus_id: modbus1
    setup_priority: -10

  - id: narada_40
    address: 40
    modbus_id: modbus1
    setup_priority: -10

packages:
  battery_1: !include
    file: .narada-npfc.yaml
    vars:
      modbus_controller_id: narada_39
      battery: Battery 1
  battery_2: !include
    file: .narada-npfc.yaml
    vars:
      modbus_controller_id: narada_40
      battery: Battery 2
```

Note that while the battery ID is set to a value between 1 and 15 using
the dip switches, the modbus address is 38+(ID). i.e. starts at 39.

```yaml title=.narada-npfc.yaml
esphome:
  name: example-device
  friendly_name: Example Device
      
# OTA flashing
ota:
  - platform: esphome

wifi: # Your Wifi network details
  
# Enable fallback hotspot in case wifi connection fails  
  ap:

# Enabling the logging component
logger:

# Enable Home Assistant API
api:

# Enable the captive portal
captive_portal:

sensor:
  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x0FFF
    register_type: read
    name: "${battery} Pack Volt"
    id: ${modbus_controller_id}_pack_volt
    unit_of_measurement: V
    device_class: voltage
    state_class: measurement
    entity_category: diagnostic
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 2
    filters:
    - multiply: 0.01

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x1000
    register_type: read
    name: "${battery} Current"
    id: ${modbus_controller_id}_pack_current
    unit_of_measurement: A
    device_class: current
    state_class: measurement
    entity_category: diagnostic
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 1
    filters:
    - offset: -10000
    - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x1001
    register_type: read
    name: "${battery} Remain Capacity"
    id: ${modbus_controller_id}_remain_capacity
    unit_of_measurement: Ah
    device_class: energy_storage
    state_class: measurement
    entity_category: diagnostic
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 1
    filters:
    - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x1002
    register_type: read
    name: "${battery} Average Cell T"
    id: ${modbus_controller_id}_average_cell_t
    unit_of_measurement: C
    device_class: temperature
    state_class: measurement
    entity_category: diagnostic
    skip_updates: 5
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 2
    filters:
    - offset: -400
    - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x1003
    register_type: read
    name: "${battery} Env T"
    id: ${modbus_controller_id}_env_t
    unit_of_measurement: C
    device_class: temperature
    state_class: measurement
    entity_category: diagnostic
    skip_updates: 5
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 1
    filters:
    - offset: -400
    - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x1007
    register_type: read
    name: "${battery} SoC"
    id: ${modbus_controller_id}_soc
    device_class: battery
    unit_of_measurement: percent
    state_class: measurement
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 2
    filters:
    - multiply: 0.01

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x1009
    register_type: read
    name: "${battery} SoH"
    id: ${modbus_controller_id}_soh
    unit_of_measurement: percent
    state_class: measurement
    entity_category: diagnostic
    skip_updates: 5
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 2
    filters:
    - multiply: 0.01

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x100A
    register_type: read
    name: "${battery} PCB T"
    id: ${modbus_controller_id}_pcb_t
    unit_of_measurement: C
    device_class: temperature
    state_class: measurement
    entity_category: diagnostic
    skip_updates: 5
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 1
    filters:
    - offset: -400
    - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x100C
    register_type: read
    name: "${battery} Cell Num"
    id: ${modbus_controller_id}_cell_num
    state_class: measurement
    entity_category: diagnostic
    skip_updates: 100
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 0

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x101D
    register_type: read
    name: "${battery} Temp Num"
    id: ${modbus_controller_id}_temp_num
    state_class: measurement
    entity_category: diagnostic
    skip_updates: 100
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 0

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x102E
    register_type: read
    name: "${battery} Full Capacity"
    id: ${modbus_controller_id}_full_capacity
    unit_of_measurement: 'Ah'
    device_class: energy_storage
    state_class: measurement
    entity_category: diagnostic
    skip_updates: 5
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 1
    filters:
    - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x102F
    register_type: read
    name: "${battery} Remain Charge Time"
    id: ${modbus_controller_id}_remain_charge_time
    unit_of_measurement: 'min'
    state_class: measurement
    entity_category: diagnostic
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 0

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: 0x1030
    register_type: read
    name: "${battery} Remain Discharge Time"
    id: ${modbus_controller_id}_remain_discharge_time
    unit_of_measurement: 'min'
    state_class: measurement
    entity_category: diagnostic
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 0

packages:
  ${modbus_controller_id}_cell_0: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x100D, temp_address: 0x101E, cell: 0}}
  ${modbus_controller_id}_cell_1: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x100E, temp_address: 0x101F, cell: 1}}
  ${modbus_controller_id}_cell_2: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x100F, temp_address: 0x1020, cell: 2}}
  ${modbus_controller_id}_cell_3: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x1010, temp_address: 0x1021, cell: 3}}
  ${modbus_controller_id}_cell_4: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x1011, temp_address: 0x1022, cell: 4}}
  ${modbus_controller_id}_cell_5: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x1012, temp_address: 0x1023, cell: 5}}
  ${modbus_controller_id}_cell_6: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x1013, temp_address: 0x1024, cell: 6}}
  ${modbus_controller_id}_cell_7: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x1014, temp_address: 0x1025, cell: 7}}
  ${modbus_controller_id}_cell_8: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x1015, temp_address: 0x1026, cell: 8}}
  ${modbus_controller_id}_cell_9: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x1016, temp_address: 0x1027, cell: 9}}
  ${modbus_controller_id}_cell_10: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x1017, temp_address: 0x1028, cell: 10}}
  ${modbus_controller_id}_cell_11: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x1018, temp_address: 0x1029, cell: 11}}
  ${modbus_controller_id}_cell_12: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x1019, temp_address: 0x102A, cell: 12}}
  ${modbus_controller_id}_cell_13: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x101A, temp_address: 0x102B, cell: 13}}
  ${modbus_controller_id}_cell_14: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x101B, temp_address: 0x102C, cell: 14}}
  ${modbus_controller_id}_cell_15: !include { file: .narada-npfc-cell.yaml, vars: { volt_address: 0x101C, temp_address: 0x102D, cell: 15}}
```

```yaml title=.narada-npfc-cell.yaml
sensor:
  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: ${volt_address}
    register_type: read
    name: "${battery} CellVoltage${cell}"
    id: ${modbus_controller_id}_${cell}_volt
    unit_of_measurement: V
    device_class: voltage
    state_class: measurement
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 3
    entity_category: diagnostic
    filters:
    - multiply: 0.001
    skip_updates: 5

  - platform: modbus_controller
    modbus_controller_id: ${modbus_controller_id}
    address: ${temp_address}
    register_type: read
    name: "${battery} TempCell${cell}"
    id: ${modbus_controller_id}_${cell}_temp
    unit_of_measurement: C
    device_class: temperature
    state_class: measurement
    icon: mdi:flash
    value_type: U_WORD
    accuracy_decimals: 1
    entity_category: diagnostic
    filters:
    - offset: -400
    - multiply: 0.1
    skip_updates: 5
```
