---
title: Genvex ECO 375, Nibe ERS 10-500, Alpha-Innotec LG 300 ECO B(E) ventilation
date-published: 2023-04-12
type: misc
standard: global
board: esp32
---

Heat Recovery Ventilation system control via ModBUS protocol for Genvex ECO 375,
Nibe ERS 10-500, Alpha-Innotec LG 300 ECO B(E). The ventilation unit must contain
the Optima 260 (ES 960C) controller board, and have ModBUS enabled at 19600 baud.

Use an RS485 transceiver like MAX485 to the device via ModBUS. Some devices come
pre-installed with a cloud controller already plugged in to the ModBUS port, this
has to be be disconnected (ESPHome will go instead).

![Product Image](./ECO-375-mark2-lukket.jpg)

## Basic configuration

The configuration below is based on an Olimex ESP32-EVB board for Ethernet connection
to the network but any ESP32 module can be used (adjust GPIO pins accordingly).

```yaml
substitutions:
  device_name: ventilation-system
  friendly_name: "Ventitaltion"
  device_ip: 192.168.1.10
  device_description: "Heat Recovery Ventilation System Control"
  modbus_ctrl_id: genvex_modbus

esphome:
  name: ${device_name}
  comment: "${device_description}"

esp32:
  variant: esp32

ethernet:
  type: LAN8720
  mdc_pin: GPIO23
  mdio_pin: GPIO18
  clk_mode: GPIO0_IN
  phy_addr: 0
  manual_ip:
    static_ip: ${device_ip}
    gateway: 192.168.1.1
    subnet: 255.255.255.0
  use_address: ${device_ip}

time:
- platform: homeassistant
  id: homeassistant_time

uart:
  tx_pin: GPIO4 # DI
  rx_pin: GPIO36 # RO
  baud_rate: 19600
  parity: EVEN
  id: mbus

modbus:
  flow_control_pin: GPIO14 # DE+RE
  id: modbus1
  uart_id: mbus

modbus_controller:
- id: ${modbus_ctrl_id}
  address: 1
  modbus_id: modbus1
  setup_priority: -10
  command_throttle: 20ms
  update_interval: 5s

sensor:
- platform: uptime
  name: ${friendly_name} controller uptime

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Inlet fan
  icon: "mdi:fan"
  id: genvex_inlet_fan
  register_type: read
  address: 9
  unit_of_measurement: "%"
  value_type: U_WORD
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Extract fan
  icon: "mdi:fan"
  id: genvex_extract_fan
  register_type: read
  address: 10
  unit_of_measurement: "%"
  value_type: U_WORD

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Supply air
  device_class: temperature
  register_type: read
  address: 0
  unit_of_measurement: "°C"
  value_type: U_WORD
  accuracy_decimals: 1
  filters:
    - filter_out: 0
    - heartbeat: 120s
    - offset: -300
    - multiply: 0.1
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Fresh air
  device_class: temperature
  register_type: read
  address: 2
  unit_of_measurement: "°C"
  value_type: U_WORD
  accuracy_decimals: 1
  filters:
    - filter_out: 0
    - heartbeat: 120s
    - offset: -300
    - multiply: 0.1
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Exhaust air
  device_class: temperature
  register_type: read
  address: 3
  unit_of_measurement: "°C"
  value_type: U_WORD
  accuracy_decimals: 1
  filters:
    - filter_out: 0
    - heartbeat: 120s
    - offset: -300
    - multiply: 0.1
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Extract air
  device_class: temperature
  id: genvex_temp_t7
  register_type: read
  address: 6
  unit_of_measurement: "°C"
  value_type: U_WORD
  accuracy_decimals: 1
  filters:
    - filter_out: 0
    - heartbeat: 120s
    - offset: -300
    - multiply: 0.1

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Bypass
  icon: "mdi:debug-step-over"
  unit_of_measurement: "%"
  register_type: read
  address: 11
  value_type: U_WORD

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Humidity
  device_class: humidity
  unit_of_measurement: "%"
  id: genvex_hum
  register_type: read
  address: 13
  value_type: U_WORD
  filters:
    - filter_out: 0
    - heartbeat: 120s

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Mode (modbus)
  icon: "mdi:speedometer-slow"
  id: genvex_mode
  register_type: holding
  entity_category: diagnostic
  address: 0
  value_type: U_WORD
  disabled_by_default: true
  bitmask: 0x7fffffff

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Alarm code (DEC)
  icon: "mdi:alert-circle-outline"
  register_type: read
  entity_category: diagnostic
  address: 15
  value_type: U_WORD
  disabled_by_default: true
  bitmask: 0x7fffffff

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Reheating
  icon: "mdi:water-boiler"
  register_type: read
  unit_of_measurement: "%"
  address: 5
  value_type: U_WORD
  bitmask: 0x7fffffff

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Reheating control
  icon: "mdi:water-boiler"
  register_type: read
  unit_of_measurement: "%"
  address: 12
  value_type: U_WORD
  bitmask: 0x7fffffff

- platform: template
  name: ${friendly_name} Humidity absolute
  lambda: |-
      const float mw = 18.01534;    // molar mass of water g/mol
      const float r = 8.31447215;   // Universal gas constant J/mol/K
      return (6.112 * powf(2.718281828, (17.67 * id(genvex_temp_t7).state) /
        (id(genvex_temp_t7).state + 243.5)) * id(genvex_hum).state * mw) /
        ((273.15 + id(genvex_temp_t7).state) * r); // in grams/m^3
  accuracy_decimals: 2
  update_interval: 120s
  icon: 'mdi:water'
  unit_of_measurement: 'g/m³'

- platform: template
  name: ${friendly_name} Dew point
  lambda: |-
      return (243.5*(log(id(genvex_hum).state/100)+((17.67*id(genvex_temp_t7).state)/
      (243.5+id(genvex_temp_t7).state)))/(17.67-log(id(genvex_hum).state/100)-
      ((17.67*id(genvex_temp_t7).state)/(243.5+id(genvex_temp_t7).state))));
  unit_of_measurement: °C
  update_interval: 120s
  icon: 'mdi:thermometer-alert'

binary_sensor:
- platform: status
  name: ${friendly_name} controller network
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: Alarm General Error
  device_class: problem
  register_type: read
  entity_category: diagnostic
  address: 15
  bitmask: 0x1
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: Bypass1
  device_class: opening
  register_type: read
  entity_category: diagnostic
  address: 15
  bitmask: 0x2
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: Relay R9
  register_type: read
  entity_category: diagnostic
  address: 15
  bitmask: 0x4
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: Alarm Filter
  device_class: problem
  register_type: read
  entity_category: diagnostic
  address: 15
  bitmask: 0x8
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: Alarm Frost
  device_class: problem
  register_type: read
  entity_category: diagnostic
  address: 15
  bitmask: 0x10
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: Alarm Hygrostat
  device_class: problem
  register_type: read
  entity_category: diagnostic
  address: 15
  bitmask: 0x40
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: Alarm Device Stopped
  device_class: problem
  register_type: read
  entity_category: diagnostic
  address: 15
  bitmask: 0x80
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: Bypass2
  device_class: opening
  register_type: read
  entity_category: diagnostic
  address: 15
  bitmask: 0x400
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: Relay R8
  register_type: read
  entity_category: diagnostic
  address: 15
  bitmask: 0x1000
  disabled_by_default: true
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: Relay R2 Electric Reheating
  register_type: read
  entity_category: diagnostic
  address: 15
  bitmask: 0x2000
  disabled_by_default: true
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: Relay R3 Preheating
  register_type: read
  entity_category: diagnostic
  address: 15
  bitmask: 0x4000
  disabled_by_default: true

- platform: template
  name: ${friendly_name} turning off
  device_class: running
  entity_category: diagnostic
  id: genvex_turningoff
  lambda: |-
    if ((id(genvex_inlet_fan).state != 0 or id(genvex_extract_fan).state != 0) and id(genvex_mode).state == 0) {
      ESP_LOGD("ModbusLambda", "Cooldown extrarun before turning off");
      return true;
    } else {
      return false;
    }
  on_state:
  # When turning off the unit, it will still run for about 3 minutes at its current speed. This trick helps with that,
  # it switches first to the lowest speed and then turns it off, so that those 3 minutes will be done in the most silent way.
    then:
      - if:
          condition:
            and:
              - binary_sensor.is_on: genvex_turningoff
              - lambda: return (id(genvex_inlet_fan).state != id(genvex_speed_in_1).state or id(genvex_extract_fan).state != id(genvex_speed_out_1).state);
          then:
            - lambda: |-
                modbus_controller::ModbusController *controller = id(${modbus_ctrl_id});
                modbus_controller::ModbusCommandItem set_mode_slowfirst_command = modbus_controller::ModbusCommandItem::create_write_single_command(controller, 0, 1);
                modbus_controller::ModbusCommandItem set_mode_command = modbus_controller::ModbusCommandItem::create_write_single_command(controller, 0, 0);
                set_mode_slowfirst_command.on_data_func = [=](modbus_controller::ModbusRegisterType register_type, uint16_t start_address, const std::vector<uint8_t> &data) {
                  ESP_LOGD("ModbusLambda", "Slow down mode 1 succes - Queuing set mode 0 command");
                  controller->queue_command(set_mode_command);
                };
                ESP_LOGD("ModbusLambda", "Queuing set mode 1 slow down to lowest speed first command");
                controller->queue_command(set_mode_slowfirst_command);
number:
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Max duration for level 3-4
  icon: "mdi:timer-sand"
  address: 14
  unit_of_measurement: "h"
  value_type: U_WORD
  entity_category: config
  min_value: 1
  max_value: 9
  step: 1
  mode: box

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Level 1 supply
  icon: "mdi:fan-speed-1"
  address: 7
  unit_of_measurement: "%"
  id: genvex_speed_in_1
  value_type: U_WORD
  entity_category: config
  min_value: 10
  max_value: 45
  step: 1
  mode: box
  
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Level 1 extract
  icon: "mdi:fan-speed-1"
  address: 10
  unit_of_measurement: "%"
  id: genvex_speed_out_1
  value_type: U_WORD
  entity_category: config
  min_value: 10
  max_value: 45
  step: 1
  mode: box

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Level 2 supply
  icon: "mdi:fan-speed-2"
  address: 8
  unit_of_measurement: "%"
  id: genvex_speed_in_2
  value_type: U_WORD
  entity_category: config
  min_value: 40
  max_value: 75
  step: 1
  mode: box

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Level 2 extract
  icon: "mdi:fan-speed-2"
  address: 11
  unit_of_measurement: "%"
  id: genvex_speed_out_2
  value_type: U_WORD
  entity_category: config
  min_value: 40
  max_value: 75
  step: 1
  mode: box

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Level 3 supply
  icon: "mdi:fan-speed-3"
  address: 9
  unit_of_measurement: "%"
  id: genvex_speed_in_3
  value_type: U_WORD
  entity_category: config
  min_value: 60
  max_value: 85
  step: 1
  mode: box

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Level 3 extract
  icon: "mdi:fan-speed-3"
  address: 12
  unit_of_measurement: "%"
  id: genvex_speed_out_3
  value_type: U_WORD
  entity_category: config
  min_value: 60
  max_value: 85
  step: 1
  mode: box

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Temperature target
  unit_of_measurement: "°C"
  icon: "mdi:cog-outline"
  address: 2
  lambda: "return (x + 100) / 10;"
  write_lambda: "return x * 10 - 100;"
  value_type: U_WORD
  entity_category: config
  min_value: 10
  max_value: 30
  step: 0.1
  mode: box

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Bypass open internal delta
  unit_of_measurement: "°C"
  icon: "mdi:cog-outline"
  address: 18
  lambda: "return x / 10;"
  write_lambda: "return x * 10;"
  value_type: U_WORD
  entity_category: config
  min_value: 1
  max_value: 10
  step: 0.1
  mode: box

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Bypass close external delta
  unit_of_measurement: "°C"
  icon: "mdi:cog-outline"
  address: 26
  value_type: U_WORD
  entity_category: config
  min_value: 0
  max_value: 20
  step: 1
  mode: box

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Filter change period
  unit_of_measurement: "mo"
  icon: "mdi:cog-outline"
  address: 5
  value_type: U_WORD
  entity_category: config
  min_value: 0
  max_value: 12
  step: 1
  mode: box
  disabled_by_default: true

text_sensor:
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} unit time
  icon: "mdi:calendar-clock"
  address: 200
  register_type: holding
  register_count: 6
  skip_updates: 12
  force_new_range: true
  lambda: return str_sprintf("20%02d-%02d-%02d %02d:%02d", data[11], data[9], data[7], data[1], data[3]);

select:
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Speed
  icon: "mdi:fan"
  id: genvex_sel
  address: 0
  value_type: U_WORD
  optimistic: true
  optionsmap:
    "Low": 1
    "Medium": 2
    "High": 3
    "Turbo": 4
    "Off": 0

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Display model
  icon: "mdi:cog-outline"
  entity_category: config
  address: 41
  value_type: U_WORD
  skip_updates: 24
  disabled_by_default: true
  optionsmap:
    "None installed": 0
    "OPT100": 1
    "Boost button": 2

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Regulation method
  icon: "mdi:cog-outline"
  entity_category: config
  address: 16
  value_type: U_WORD
  skip_updates: 24
  disabled_by_default: true
  optionsmap:
    "Room": 0
    "Supply": 1
    "Extract": 2

switch:
- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Reheating
  entity_category: config
  icon: "mdi:water-boiler"
  register_type: holding
  address: 1
  bitmask: 1

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Max duration for level 3-4 enable
  entity_category: config
  icon: "mdi:toggle-switch"
  register_type: holding
  address: 4
  bitmask: 1

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Humidity control
  entity_category: config
  icon: "mdi:air-humidifier"
  register_type: holding
  address: 6
  bitmask: 1

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Filter change autostop
  entity_category: config
  icon: "mdi:toggle-switch"
  disabled_by_default: true
  register_type: holding
  address: 15
  bitmask: 1

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Device stop enable
  entity_category: config
  icon: "mdi:toggle-switch"
  disabled_by_default: true
  register_type: holding
  address: 25
  bitmask: 1

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Calendar mode
  entity_category: config
  icon: "mdi:toggle-switch"
  disabled_by_default: true
  register_type: holding
  address: 45
  bitmask: 1

- platform: modbus_controller
  modbus_controller_id: ${modbus_ctrl_id}
  name: ${friendly_name} Filter reset
  entity_category: config
  icon: "mdi:air-filter"
  register_type: holding
  address: 47
  bitmask: 1

button:
- platform: restart
  name: ${friendly_name} controller restart
  entity_category: diagnostic
- platform: safe_mode
  name: ${friendly_name} controller safe mode boot
  entity_category: diagnostic
- platform: template
  name: ${friendly_name} modbus manual update
  entity_category: config
  icon: "mdi:eye-refresh-outline"
  disabled_by_default: true
  on_press:
    then:
      - lambda: 'return id(${modbus_ctrl_id})->update();'
- platform: template
  name: ${friendly_name} Sync date and time
  entity_category: diagnostic
  icon: "mdi:clock-edit-outline"
  disabled_by_default: true
  on_press:
    if:
      condition:
        time.has_time:
      then:
        - lambda: |-
              // get local time and sync to device
              auto time = ESPTime::from_epoch_local(::time(nullptr));
              uint16_t minute = time.minute;
              uint16_t hour = time.hour;
              uint16_t day = time.day_of_month;
              uint16_t month = time.month;
              uint16_t year = time.year % 100;
              modbus_controller::ModbusController *controller = id(${modbus_ctrl_id});
              modbus_controller::ModbusCommandItem set_hour = modbus_controller::ModbusCommandItem::create_write_single_command(controller, 200, hour);
              modbus_controller::ModbusCommandItem set_minute = modbus_controller::ModbusCommandItem::create_write_single_command(controller, 201, minute);
              modbus_controller::ModbusCommandItem set_day = modbus_controller::ModbusCommandItem::create_write_single_command(controller, 203, day);
              modbus_controller::ModbusCommandItem set_month = modbus_controller::ModbusCommandItem::create_write_single_command(controller, 204, month);
              modbus_controller::ModbusCommandItem set_year = modbus_controller::ModbusCommandItem::create_write_single_command(controller, 205, year);
              // commands have to be run in reversed order nested in on_data_func's because the queue_command normally exits the procedure
              set_month.on_data_func = [=](modbus_controller::ModbusRegisterType register_type, uint16_t start_address, const std::vector<uint8_t> &data) {
                ESP_LOGI("ModbusLambda", "Setting year to %02d", year);
                controller->queue_command(set_year);
              };
              set_day.on_data_func = [=](modbus_controller::ModbusRegisterType register_type, uint16_t start_address, const std::vector<uint8_t> &data) {
                ESP_LOGI("ModbusLambda", "Setting month to %02d", month);
                controller->queue_command(set_month);
              };
              set_minute.on_data_func = [=](modbus_controller::ModbusRegisterType register_type, uint16_t start_address, const std::vector<uint8_t> &data) {
                ESP_LOGI("ModbusLambda", "Setting day to %02d", day);
                controller->queue_command(set_day);
              };
              set_hour.on_data_func = [=](modbus_controller::ModbusRegisterType register_type, uint16_t start_address, const std::vector<uint8_t> &data) {
                ESP_LOGI("ModbusLambda", "Setting minute to %02d", minute);
                controller->queue_command(set_minute);
              };
              ESP_LOGI("ModbusLambda", "Setting hour to %02d", hour);
              controller->queue_command(set_hour);
```

## Notes

If you get CRC errors use shorter cables and double-check for the 120 Ohm termination
resistors as per ModBUS standard.

The factory pre-installed cloud controller (usually a separate box or board) has to be
disconnected because it acts a ModBUS Master, just like the ESPHome node configured as
above. You can't have two ModBUS RTU Masters on the same bus.

These units were shipped with various controller boards inside, this configuration only
matches Optima 260 (ES 960C).
