---
title: Shelly 1PM Gen3
date-published: 2025-03-01
type: relay
standard: uk, us, eu, au, nz
board: esp32
difficulty: 2
---

This is the third generation of the Shelly 1PM.  It sports a single 16A
relay, power monitoring, and uses the ESP-Shelly-C38F, a derivative of
the ESP32-C3 with 8MB flash.

This device includes the Belling BL0942 Energy Monitor that is supported
by ESPHome.

## Serial Pinout

The Shelly 1PM Gen3 includes the six-pin "proprietary serial interface"
1.27mm header broken out on the back that can be used for flashing.  An
inexpensive 1.27mm to 2.54mm pitch changer board can make flashing these
devices easier than they already are.

The serial pinout is:

| Pin | Label        | Description | GPIO   |
|-----|--------------|-------------|--------|
| 1   | ESP_DBG_UART |             | GPIO19 |
| 2   | U0TXD        | UART0 RX    | GPIO20 |
| 3   | U0RXD        | UART0 TX    | GPIO21 |
| 4   | +3.3_ESP     | 3.3v        |        |
| 5   | _n/c_          | _unused_      |        |
| 6   | GPIO0        | BootSEL     | GPIO0  |
| 7   | GND          | Ground      |        |

![image](https://github.com/user-attachments/assets/04db7e3a-67f6-45ed-a30a-b6e2e9965c0b)

## GPIO Pinout

| Pin    | Function     |
|--------|--------------|
| GPIO0  | LED          |
| GPIO1  | Button       |
| GPIO3  | NTC sensor   |
| GPIO4  | Relay        |
| GPIO6  | BL0942 TX    |
| GPIO7  | BL0942 RX    |
| GPIO10 | Switch       |
| GPIO19 | ESP_DBG_UART |

## Basic Configuration

```yaml
esphome:
  platformio_options:
    board_build.mcu: esp32c3
    board_build.variant: esp32c3
    board_build.f_cpu: 160000000L
    board_build.f_flash: 80000000L
    board_build.flash_mode: dio
    board_build.flash_size: 8MB

esp32:
  variant: esp32c3

api:

ota:

wifi:

uart:
  id: bl0942_uart
  tx_pin: GPIO6
  rx_pin:
    number: GPIO7
    mode:
      pullup: true
      input: true
  baud_rate: 9600
  stop_bits: 1

output:
  - id: shelly_1pm_gen3_relay
    platform: gpio
    pin: GPIO4

binary_sensor:
  - id: shelly_1pm_gen3_switch
    name: Switch
    platform: gpio
    pin: GPIO10
    filters:
      - delayed_off: 50ms
  - id: shelly_1pm_gen3_button
    name: Button
    platform: gpio
    pin: GPIO1
    filters:
      - delayed_off: 50ms

sensor:
  - id: temperature
    name: Temperature
    platform: ntc
    sensor: temperature_sensor_resistance
    icon: mdi:thermometer
    entity_category: diagnostic
    unit_of_measurement: °C
    accuracy_decimals: 1
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 25°C
  - id: temperature_sensor_resistance
    platform: resistance
    sensor: temperature_sensor_voltage
    configuration: DOWNSTREAM
    resistor: 10kOhm
  - id: temperature_sensor_voltage
    platform: adc
    pin: GPIO3
    attenuation: 11db
  - platform: bl0942
    uart_id: bl0942_uart
    line_frequency: 60Hz
    voltage:
      name: Voltage
    current:
      name: Current
    power:
      name: Power
    frequency:
      name: Frequency
      accuracy_decimals: 2
```

## Additional Considerations

### BL0942 Energy Monitor

The default update interval for the BL0942 energy monitor is 60 seconds,
which may be too slow for some applications (especially safety shutdown,
if implemented; see below). Add `update_interval: 1s` to the bl0942 sensor
if desired.

The calibration of values reported by the BL0942 is left to software. The
component has default calibration values but they may not be accurate for
every device. Add in new calibration values based on measurements with a
quality digital multimeter and a simple resistive load.

_See [ESPHome Documentation](https://esphome.io/components/sensor/bl0942/) for more details._

### Safety Shutdown Option

On manufacturer firmware, Shelly products provide automatic shutdown of
the relay output(s) on overcurrent and overtemperature conditions.

Following is a configuration snippet to restore this functionality
with manual reset required for both faults. _(Note: bl0942 update_interval
must be fast-acting for this function.)_

```yaml
output:

  - platform: gpio
    pin: GPIO4
    id: relay_output

switch:

  # Use a template switch to allow for checking fault conditions before switching on the relay output.
  - platform: template
    id: relay
    name: Relay
    device_class: outlet
    restore_mode: ALWAYS_ON
    turn_on_action:
      if:
        any:
          - sensor.in_range:
              id: temperature
              below: 75.0
          # Temperature sensor is unknown for several seconds on boot. Allow the relay to switch on anyway.
          - and:
              - lambda: "return isnan(id(temperature).state);"
              - binary_sensor.is_off: error_overtemp
        then:
          - output.turn_on: relay_output
          - binary_sensor.template.publish:
              id: error_overtemp
              state: OFF
          - binary_sensor.template.publish:
              id: error_overpower
              state: OFF
          - switch.template.publish:
              id: relay
              state: ON
        else:
          - switch.template.publish:
              id: relay
              state: OFF
    turn_off_action:
      then:
        - output.turn_off: relay_output
        - switch.template.publish:
            id: relay
            state: OFF

binary_sensor:
  
  - id: error_overtemp
    name: Overheating
    device_class: problem
    entity_category: diagnostic
    platform: template
    condition:
      any:
        - binary_sensor.is_on: error_overtemp # Latch ON
        - sensor.in_range:
            id: temperature
            above: 75.0
    on_press:
      then:
        - switch.turn_off: relay
  
  - id: error_overpower
    name: Overpowering
    device_class: problem
    entity_category: diagnostic
    platform: template
    condition:
      any:
        - binary_sensor.is_on: error_overpower # Latch ON
        - for:
            time: 1s
            condition:
              sensor.in_range:
                id: sensor_current
                above: 16  # This is model specific!
    on_press:
      then:
        - switch.turn_off: relay

sensor:
  
  - id: temperature
    name: Device Temperature
    platform: ntc
    sensor: temperature_sensor_resistance
    icon: mdi:thermometer
    entity_category: diagnostic
    unit_of_measurement: °C
    accuracy_decimals: 1
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 25°C

  - id: temperature_sensor_resistance
    platform: resistance
    sensor: temperature_sensor_voltage
    configuration: DOWNSTREAM
    resistor: 10kOhm

  - id: temperature_sensor_voltage
    platform: adc
    pin: GPIO3
    attenuation: 11db

  - platform: bl0942
    uart_id: bl0942_uart
    line_frequency: 60Hz
    update_interval: 1s
  # voltage_reference: # Recommend calibrating the voltage sensor for accurate power/energy readings.
    current_reference: # Current sensor must be calibrated for the safety shutdown to respond correctly!
    voltage:
      name: Voltage
      id: sensor_voltage
      entity_category: diagnostic
    current:
      id: sensor_current
    power:
      name: Power
      id: sensor_power
    frequency:
      name: Frequency
      id: sensor_frequency
      accuracy_decimals: 2
      entity_category: diagnostic
    energy:
      name: Energy
      id: sensor_energy
      entity_category: diagnostic
      device_class: energy
      state_class: total_increasing
      accuracy_decimals: 3
```

## Application-specific Configuration

Following is an application-specific configuration of the Shelly 1PM
Gen3 for shutting off power to an attached clothes washer in the event
of a frozen drain line.

```yaml
substitutions:
  device_id: lauwshpow
  device_name: LAUWSHPOW
  channel_1_id: washer_outlet
  channel_1_name: Washer Outlet

esphome:
  name: $device_id
  area: Laundry Room
  platformio_options:
    board_build.mcu: esp32c3
    board_build.variant: esp32c3
    board_build.f_cpu: 160000000L
    board_build.f_flash: 80000000L
    board_build.flash_mode: dio
    board_build.flash_size: 8MB

esp32:
  variant: esp32c3

api:

ota:

wifi:

# Newer ESP32 variants (including the C3) enable USB on the UART pins by
# default unless we explicitly specify that we want to use UART0 for the
# logger.
#
# You can check this by looking at the generated PlatformIO config file.
# For example, in .esphome/build/lauwshpow/platformio.ini, the following
# build_flags would be set if U0RXD/U0TXD are configured to speak USB:
#
#     -DARDUINO_USB_CDC_ON_BOOT=1
#     -DARDUINO_USB_MODE=1
#
# I don't care about USB; I'd prefer to be able to view the console, so
# configure the logger to use UART0.

logger:
  hardware_uart: uart0

# Configure a separate UART peripheral on GPIO6/GPIO7 for the BL0942.

uart:
  id: bl0942_uart
  tx_pin: GPIO6
  rx_pin: 
    number: GPIO7
    mode:
      pullup: true
      input: true
  baud_rate: 9600
  stop_bits: 1

# Setup an output and associated switch for the relay on GPIO4.

output:
  - id: relay_output_1
    platform: gpio
    pin: GPIO4

switch:
  - id: ${channel_1_id}
    name: ${channel_1_name}
    platform: output
    output: relay_output_1
    device_class: outlet
    restore_mode: RESTORE_DEFAULT_ON

binary_sensor:
  # Binary sensors for the line-level switch input and the button on
  # the rear of the device.  These are commented out because I'm not
  # using them.
  #
  #- id: line_switch_input
  #  name: ${device_name} Switch
  #  platform: gpio
  #  pin: GPIO10
  #- id: shelly_1pm_button
  #  name: ${device_name} Button
  #  platform: gpio
  #  pin: GPIO1

  # Template binary sensors to use for my application-specific automations.
  - id: washer_running
    name: Washer Running
    platform: template
    icon: mdi:washing-machine
    device_class: running
  - id: drain_below_freezing
    name: Washer Drain Below Freezing
    platform: template
    icon: mdi:pipe-disconnected

# Configure an external DS18B20 sensor on GPIO19 to use for monitoring
# the temperature of the washer drain line.  We use the on_value_range
# events to setup automations to kill the washer at -2°C (28°F), which
# is far enough below freezing to begin worrying.  If that happens, we
# don't want to turn it back on until the temperature rises far enough
# above freezing to stop worrying -- 5°C (40°F) seems good.  We'll can
# also publish sensor states at the zero-cross (with a 0.1°C buffer to
# avoid thrashing) for surfacing in the Home Assistant UI.

one_wire:
  - platform: gpio
    pin: GPIO19

sensor:
  # 1-wire DS18B20 temperature probe
  - id: drain_temperature
    platform: dallas_temp
    address: 0xf4000007875cd674
    name: Washer Drain Temperature
    update_interval: 5s
    on_value_range:
      - above: 5
        then:
          - switch.turn_on: ${channel_1_id}
      - above: 0.1
        then:
          - binary_sensor.template.publish:
              id: drain_below_freezing
              state: OFF
      - below: -0.1
        then:
          - binary_sensor.template.publish:
              id: drain_below_freezing
              state: ON
      - below: -2
        then:
          - switch.turn_off: ${channel_1_id}

  # Internal NTC temperature sensor
  - id: ${device_id}_temperature
    name: ${device_name} Temperature
    platform: ntc
    sensor: ${device_id}_temperature_sensor_resistance
    icon: mdi:thermometer
    entity_category: diagnostic
    unit_of_measurement: °C
    accuracy_decimals: 1
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 25°C

  # Required for NTC sensor
  - id: ${device_id}_temperature_sensor_resistance
    platform: resistance
    sensor: ${device_id}_temperature_sensor_voltage
    configuration: DOWNSTREAM
    resistor: 10kOhm

  # Required for NTC sensor
  - id: ${device_id}_temperature_sensor_voltage
    platform: adc
    pin: GPIO3
    attenuation: 11db

  # Belling BL0942 Energy Monitor
  - platform: bl0942
    uart_id: bl0942_uart
    line_frequency: 60Hz
    voltage:
      name: Washer AC Voltage
    current:
      name: Washer AC Current
    power:
      name: Washer AC Power
      on_value_range:
        - above: 50
          then:
            - binary_sensor.template.publish:
                id: washer_running
                state: ON
        - below: 5
          then:
            - binary_sensor.template.publish:
                id: washer_running
                state: OFF
    frequency:
      name: Washer AC Frequency
      accuracy_decimals: 2
    update_interval: 5s
```
