---
title: Hiking DDS238-4-W WiFi Single Phase 63A Energy Meter / Hiking DDS238-4-W WiFi 3-Phase 63A Energy Meter
date-published: 2025-08-12
type: misc
standard: global
board: esp8266
difficulty: 5
---

## Manufacturer

Hiking TOMZN (Tuya)

## Product Info

| Spec                 | Value                                                              |
| -------------------- | ------------------------------------------------------------------ |
| Rate Frequency       | 50 or 60 Hz                                                        |
| Rated Current        | 5(60)A, 10(100)A                                                   |
| Rate Voltage         | 120V / 220V / 230V /240V AC                                        |
| Normal Voltage range | 90%Un ～ 110%Un                                                    |
| kWH accuracy         | Class 1                                                            |
| R.M.S. accuracy      | Class 0.5                                                          |
| Starting current     | 20 mA                                                              |
| WiFi network         | 2.4GHz only                                                        |
| Operational temp.    | -40~70°C                                                           |
| RS485 port           | MODBUS-RTU protocol, 1200 ～ 9600bps, None parity, default 9600bps |
| Pulse constant       | 1600 imp/kW                                                        |
| WIFI 802.11b/g/n     | only support 2.4GHz network , not support 5GHz network             |

35mm Din Rail install, 4 modules width

## Product Images

![dxs238xw_4w](https://github.com/user-attachments/assets/8dbf7cbf-d088-439d-8c7a-555e7b71c49c)
![dxs238xw_7w](https://github.com/user-attachments/assets/d3e32c38-1e86-4c4f-9690-8c635da3c6b1)

## DDS238-4 W and DTS238-7 W Wifi Energy Meters

The `dxs238xw` component allows full use of all the functions of the DDS238-4 W and DTS238-7 W Wifi energy meters. The
`dxs238xw` component together with ESPHome is a good replacement for the original firmware of these meters and allows a
perfect integration with Home Assistant.

## Flashing info

The installation of this component in your energy meter necessarily requires opening the meter, desoldering the ESP8266
module and installing the new firmware. Then solder the ESP8266 module again and test its operation.

Subsequent updates no longer require disarming the energy meter again, as they are done over OTA.

Because it is necessary to desolder the ESP8266 module, minimal knowledge of electronics is required.

It is convenient before installing the new firmware, make a backup copy of the original firmware.

This development works only with the meters that work with the WISEN app. If your meter is TUYA, this solution is not
for you.

![dxs238xw_uart](https://github.com/user-attachments/assets/d71fc2be-8287-41cb-8a9e-cf4c6997e70c)

## Basic Configuration

```yaml
---
#------------------------------------------------------------------------
# Common setting for the 1 and 3 Phase Meter (DDS238-4 W and DTS238-7 W).
# All possible entities are shown, but the idea is to only place the ones
# that are going to be used.
#
# The following code only shows the properties needed to configure the
# meter to access the measurements. Everything related to Wifi, MQTT, API,
# Time, etc., see directly in the ESPHome options, because it is not the
# scope of this Readme.
#------------------------------------------------------------------------

logger:
  level: DEBUG
  baud_rate: 0

uart:
  tx_pin: 1
  rx_pin: 3
  baud_rate: 9600

dxs238xw:
  update_interval: 3s

sensor:
  - platform: dxs238xw
    frequency:
      name: "Frequency"

    import_active_energy:
      name: "Import Active Energy"
    export_active_energy:
      name: "Export Active Energy"
    total_energy:
      name: "Total Energy"

    energy_purchase_balance:
      name: "Energy Purchase - Balance"

    phase_count:
      name: "Phases N°"

    energy_purchase_price:
      name: "Energy Purchase Price"

    total_energy_price:
      name: "Total Energy Price"
    contract_total_energy:
      name: "Total Energy Contract"

    price_kWh:
      name: "kWh Price"

text_sensor:
  - platform: dxs238xw
    meter_state_detail:
      name: "State - Detail"
      filters:
        - substitute:
            - "Off by Over Voltage -> INACTIVE - Over Voltage"
            - "Off by Under Voltage -> INACTIVE - Under Voltage"
            - "Off by Over Current -> INACTIVE - Over Current"
            - "Off by End Purchase -> INACTIVE - End Purchase"
            - "Off by End Delay -> INACTIVE - End Delay"
            - "Off by User -> INACTIVE - By User"
            - "Off by Unknown -> INACTIVE - Unknown"
            - "Power Ok -> ACTIVE"
    delay_value_remaining:
      name: "Remaining Delay Time"
    meter_id:
      name: "Serial N°"

number:
  - platform: dxs238xw
    max_current_limit:
      name: "Maximum Current"
    max_voltage_limit:
      name: "Maximum Voltage"
    min_voltage_limit:
      name: "Minimum Voltage"
    energy_purchase_value:
      name: "Energy Purchase"
    energy_purchase_alarm:
      name: "Energy Purchase Alarm"
    delay_value_set:
      name: "Delay Time"
    starting_kWh:
      name: "kWh Start"
    price_kWh:
      name: "kWh Price"

switch:
  - platform: dxs238xw
    energy_purchase_state:
      name: "Activate Energy Purchase"
    meter_state:
      name: "State SmartMeter"
    delay_state:
      name: "Activate Delay"

button:
  - platform: dxs238xw
    reset_data:
      name: "Restart Consumption"

binary_sensor:
  - platform: gpio
    internal: true
    id: button_0
    pin:
      number: GPIO13
      mode:
        input: true
        pullup: true
      inverted: true
    on_multi_click:
      - timing:
          - ON for at least 1s
        then:
          - dxs238xw.meter_state_toggle
        invalid_cooldown: 0ms

  - platform: dxs238xw
    warning_off_by_over_voltage:
      name: "Over Voltage Alert"
    warning_off_by_under_voltage:
      name: "Under Voltage Alert"
    warning_off_by_over_current:
      name: "Over Current Alert"
    warning_off_by_end_purchase:
      name: "End Purchase Alert"
    warning_off_by_end_delay:
      name: "End Delay Alert"
    warning_off_by_user:
      name: "Off by User Alert"
    warning_purchase_alarm:
      name: "Balance Purchase Alert"
    meter_state:
      name: "Relay State"

status_led:
  pin:
    number: GPIO14
    inverted: no
```

```yaml
---
#------------------------------------------------------------------------
# This setting is only for the 1 Phase Meter (DDS238-4 W).
# All possible entities are shown, but the idea is to only place the ones
# that are going to be used.
#
# The following code only shows the properties needed to configure the
# meter to access the measurements. Everything related to Wifi, MQTT, API,
# Time, etc., see directly in the ESPHome options, because it is not the
# scope of this Readme.
#------------------------------------------------------------------------

sensor:
  - platform: dxs238xw
    current_phase_1:
      name: "Current"

    voltage_phase_1:
      name: "Voltage"

    reactive_power_phase_1:
      name: "Reactive Power"

    active_power_phase_1:
      name: "Active Power"

    power_factor_phase_1:
      name: "Power Factor"
```

```yaml
---
#------------------------------------------------------------------------
# This setting is only for the 3 Phase Meter (DTS238-7 W).
# All possible entities are shown, but the idea is to only place the ones
# that are going to be used.
#
# The following code only shows the properties needed to configure the
# meter to access the measurements. Everything related to Wifi, MQTT, API,
# Time, etc., see directly in the ESPHome options, because it is not the
# scope of this Readme.
#------------------------------------------------------------------------

sensor:
  - platform: dxs238xw
    current_phase_1:
      name: "Current Phase 1"
    current_phase_2:
      name: "Current Phase 2"
    current_phase_3:
      name: "Current Phase 3"

    voltage_phase_1:
      name: "Voltage Phase 1"
    voltage_phase_2:
      name: "Voltage Phase 2"
    voltage_phase_3:
      name: "Voltage Phase 3"

    reactive_power_phase_1:
      name: "Reactive Power Phase 1"
    reactive_power_phase_2:
      name: "Reactive Power Phase 2"
    reactive_power_phase_3:
      name: "Reactive Power Phase 3"
    reactive_power_total:
      name: "Reactive Power Total"

    active_power_phase_1:
      name: "Active Power Phase 1"
    active_power_phase_2:
      name: "Active Power Phase 2"
    active_power_phase_3:
      name: "Active Power Phase 3"
    active_power_total:
      name: "Active Power Total"

    power_factor_phase_1:
      name: "Power Factor Phase 1"
    power_factor_phase_2:
      name: "Power Factor Phase 2"
    power_factor_phase_3:
      name: "Power Factor Phase 3"
    power_factor_total:
      name: "Power Factor Total"
```

## Global Component Settings

### Configuration variables

- **update_interval** (_Optional_, [Time](https://esphome.io/components/time/)): Delay between data requests,
  minimum 3s.

## Sensor

Sensors entities to show data, includes the measurements generated by the energy meter.

### Sensor Configuration variables

- **voltage_phase_1** (_Optional_): Voltage measurement, phase 1.
- **voltage_phase_2** (_Optional_): Voltage measurement, phase 2.
- **voltage_phase_3** (_Optional_): Voltage measurement, phase 3.
- **current_phase_1** (_Optional_): Current measurement, phase 1.
- **current_phase_2** (_Optional_): Current measurement, phase 2.
- **current_phase_3** (_Optional_): Current measurement, phase 3.
- **frequency** (_Optional_): Frequency measurement.
- **reactive_power_phase_1** (_Optional_): Reactive Power measurement, phase 1.
- **reactive_power_phase_2** (_Optional_): Reactive Power measurement, phase 2.
- **reactive_power_phase_3** (_Optional_): Reactive Power measurement, phase 3.
- **reactive_power_total** (_Optional_): Total Reactive Power measurement, for all phases.
- **active_power_phase_1** (_Optional_): Active Power measurement, phase 1.
- **active_power_phase_2** (_Optional_): Active Power measurement, phase 2.
- **active_power_phase_3** (_Optional_): Active Power measurement, phase 3.
- **active_power_total** (_Optional_): Total Active Power measurement, for all phases.
- **power_factor_phase_1** (_Optional_): Power Factor measurement, phase 1.
- **power_factor_phase_2** (_Optional_): Power Factor measurement, phase 2.
- **power_factor_phase_3** (_Optional_): Power Factor measurement, phase 3.
- **power_factor_total** (_Optional_): Total Power Factor measurement, for all phases.
- **import_active_energy** (_Optional_): Import Energy measurement.
- **export_active_energy** (_Optional_): Export Energy measurement.
- **total_energy** (_Optional_): Total Energy (Import - Export) measurement.
- **energy_purchase_balance** (_Optional_): Balance of the remaining energy after configuring the purchase of energy.
  Some meters do not have this option.
- **phase_count** (_Optional_): Number of phases of the energy meter.
- **energy_purchase_price** (_Optional_): energy_purchase_balance \* price_kWh.
- **total_energy_price** (_Optional_): total_energy \* price_kWh.
- **contract_total_energy** (_Optional_): starting_kWh + total_energy.
- **price_kWh** (_Optional_): Send to Home Assistant kWh price, useful for energy meter panel.

### Common for all Sensor

- **name** (**Required**, string): The name for the Sensor.

All other options from [Sensor](https://esphome.io/components/sensor/). The Sensors are already configured with all
default values, but you can override them if necessary.

## Text Sensor

Text Sensors entities to show data.

### Text Sensor Configuration variables

- **meter_state_detail** (_Optional_): Indicates the current status of the meter (internal relay), whether it is active
  or inactive, and a brief description of the cause that keeps the energy meter inactive.
- **delay_value_remaining** (_Optional_): Indicates the time remaining before the meter goes to inactive state.
- **meter_id** (_Optional_): Indicates the internal serial number of the energy meter.

### Common for all Text Sensor

- **name** (**Required**, string): The name for the Text Sensor.

All other options from [Text Sensor](https://esphome.io/components/text_sensor/). The Text Sensors are already
configured with all default values, but you can override them if necessary.

## Number

These numbers are input fields for setting on the energy meter, delay value, energy purchase, current and voltage limit
values.

### Number Configuration variables

- **max_current_limit** (_Optional_): Set the maximum current limit.
- **max_voltage_limit** (_Optional_): Set the maximum voltage limit.
- **min_voltage_limit** (_Optional_): Set the minimum voltage limit.
- **energy_purchase_value** (_Optional_): Set the initial value for energy purchase. Some meters do not have this
  option.
- **energy_purchase_alarm** (_Optional_): Set the alert value for energy purchase. Some meters do not have this option.
- **delay_value_set** (_Optional_): Set the delay value to set the meter internal relay to the inactive state.
- **starting_kWh** (_Optional_): Set kWh value currently indicated on the meter of your contract.
- **price_kWh** (_Optional_): Set the kWh price in your area.

### Common for all Number

- **name** (**Required**, string): The name for the Number.

All other options from [Number](https://esphome.io/components/number/). The Number are already configured with all
default values, but you can override them if necessary.

## Switch

These switch are used to activate or deactivate the purchase of energy, the delay time and the status of the energy
meter.

### Switch configuration variables

- **energy_purchase_state** (_Optional_): Activate or deactivate the purchase of energy. Some meters do not have this
  option.
- **meter_state** (_Optional_): Activate or deactivate the meter energy state (internal relay).
- **delay_state** (_Optional_): Activate or deactivate the delay time.

### Common for all Switch

- **name** (**Required**, string): The name for the Switch.

All other options from [Switch](https://esphome.io/components/switch/). The Switch are already configured with all
default values, but you can override them if necessary.

## Button

Buttons to control some features of the energy meter.

### Button Configuration variables

- **reset_data** (_Optional_): Reset to 0 all energy configuration data.

### Common for all Button

- **name** (**Required**, string): The name for the Button.

All other options from [Button](https://esphome.io/components/button/). The Button are already configured with all
default values, but you can override them if necessary.

## Binary Sensor

Binary sensors are used to indicate some separate states, specifically the state of the power meter. They are only
useful if you want to automate some action depending on the state of the energy meter.

### Binary Sensor Configuration variables

- **warning_off_by_over_voltage** (_Optional_): Warning over voltage.
- **warning_off_by_under_voltage** (_Optional_): Warning under voltage.
- **warning_off_by_over_current** (_Optional_): Warning over current.
- **warning_off_by_end_purchase** (_Optional_): Warning end energy purchase.
- **warning_off_by_end_delay** (_Optional_): Warning end delay time.
- **warning_off_by_user** (_Optional_): Warning off by user action.
- **warning_purchase_alarm** (_Optional_): Warning indicating that the end of the energy purchase is approaching.
- **meter_state** (_Optional_): Meter State (Active - inactive).

### Common for all Binary Sensor

- **name** (**Required**, string): The name for the Binary Sensor.

All other options from [Binary Sensor](https://esphome.io/components/binary_sensor/). The Binary Sensor are already
configured with all default values, but you can override them if necessary.

## Actions

Three actions related to the change of state of the energy meter have been configured.

### `dxs238xw.meter_state_on` Action

This action change the state of the energy meter to On.

```yaml
on_...:
  then:
    - dxs238xw.meter_state_on
```

This action can also be expressed in [lambdas](https://esphome.io/automations/templates/):

```yaml
id(smart_meter).meter_state_on();
```

### `dxs238xw.meter_state_off` Action

This action change the state of the energy meter to Off.

```yaml
on_...:
  then:
    - dxs238xw.meter_state_off
```

This action can also be expressed in [lambdas](https://esphome.io/automations/templates/):

```yaml
id(smart_meter).meter_state_off();
```

### `dxs238xw.meter_state_toggle` Action

This action toggle the state of the energy meter between on off.

```yaml
on_...:
  then:
    - dxs238xw.meter_state_toggle
```

This action can also be expressed in [lambdas](https://esphome.io/automations/templates/):

```yaml
id(smart_meter).meter_state_toggle();
```

### Actions For the Buttons in the Meter

The meter has 2 physical buttons, but only the physical button that configures the Wifi can be modified. For the button
that switches between the measured values, it is not possible to change its behavior.

The following code is just a proposal that modifies the original behavior of the button that configures the Wifi, for a
new behavior that activates or deactivates the internal relay of the meter. Feel free to configure the behavior of the
buttons however you like. [Binary Sensor](https://esphome.io/components/binary_sensor/)

```yaml
binary_sensor:
  - platform: gpio
    internal: true
    id: button_0
    pin:
      number: GPIO13
      mode:
        input: true
        pullup: true
      inverted: true
    on_multi_click:
      - timing:
          - ON for at least 1s
        then:
          - dxs238xw.meter_state_toggle
        invalid_cooldown: 0ms
```

### Actions For the Status Led in the Meter

For the status led present on the meter, it must be configured with the following code. This configuration connects the
led on the meter with the EspHome status control. [Status Led](https://esphome.io/components/status_led/)

```yaml
status_led:
  pin:
    number: GPIO14
    inverted: no
```

## UART Connection for update firmware

Communication with the energy meters is through [UART](https://esphome.io/components/uart/). The following image
shows the internal ESP8266 module in the energy meter, and its connections.

![dxs238xw_uart](https://github.com/user-attachments/assets/d71fc2be-8287-41cb-8a9e-cf4c6997e70c)

## Add External Component in ESPHome

Until the pull request is accepted, and since this component (`dxs238xw`) is not native to ESPHome, you must integrate
it in the following way in the code editor. [External Component](https://esphome.io/components/external_components/)
Afterwards it should be merged into the main branch.

```yaml
external_components:
  - source:
      type: git
      url: https://github.com/rodgon81/esphome
      ref: dev
    refresh: 300s
    components: [dxs238xw]
```
