---
title: Shelly Plus 2PM
date-published: 2022-05-07
type: switch
standard: uk, us, eu
board: esp32
---

## Hardware Versions

There are currently 3 known hardware versions of the Shelly Plus 2PM. The pinout is incompatible between PCB version
0.1.5 and 0.1.9.

- PCB v0.1.5 with ESP32-U4WDH (Single core, 160MHz, 4MB embedded flash) Sold pre 2022
- PCB v0.1.9 with ESP32-U4WDH (Single core, 160MHz, 4MB embedded flash) Sold first half of 2022
- PCB v0.1.9 with ESP32-U4WDH (Dual core,   240MHz, 4MB embedded flash) Sold since 2022-09-20 (or earlier)

4 units bought directly from Shelly 2022-09-20 were confirmed to be PCB v0.1.9 with 3 units being dual core ESP32-U4WDH,
the last a single core.
The advantage of the dual core version is that it supports the arduino framework.

3 units bought from a reseller in Austria in 2024 were (without opening and checking the PCB) assumed to be PCB v0.1.9
and dual core ESP32-U4WDH. No problems were faced with this assumption.

The single core version of the ESP32-U4WDH will probably be discontinued according to
[Espressif PCN](https://documentation.espressif.com/PCN-2021-021%20ESP32-U4WDH%20%e5%8d%87%e7%ba%a7%e4%b8%ba%e5%8f%8c%e6%a0%b8%e5%a4%84%e7%90%86%e5%99%a8%e4%ba%a7%e5%93%81.pdf)

The PCB version number is printed on the back of the PCB.
![Shelly Plus 2PM PCB Versions](shellyplus2pm_pcb_versions.png "Shelly Plus 2PM PCB Versions")

The version of the ESP32-U4WDH can be determined by looking at the second to last line printed on the chip. If the line
contains 8 characters starting with "H", the chip is single core 160MHz. If the line contains 9 characters starting with
"DH", the chip is a dual core 240MHz.
![Shelly Plus 2PM ESP32-U4WDH Versions](ESP32-U4WDH_versions.png "Shelly Plus 2PM ESP32-U4WDH Versions")

## GPIO Pinout

| Function                                          | v0.1.5 | v0.1.9 |
| ------------------------------------------------- | ------ | ------ |
| LED (Inverted), Shelly Plus Add-On: DATA (Output) | GPIO0  | GPIO0  |
| Shelly Plus Add-On: DATA (Input)                  | GPIO1  | GPIO1  |
| Shelly Plus Add-On: ANALOG IN                     | GPIO3  | GPIO3  |
| Button (Inverted, Pull-up)                        | GPIO27 | GPIO4  |
| Switch 1 Input                                    | GPIO2  | GPIO5  |
| Switch 2 Input                                    | GPIO18 | GPIO18 |
| Relay 1                                           | GPIO13 | GPIO13 |
| Relay 2                                           | GPIO12 | GPIO12 |
| Shelly Plus Add-On: DIGITAL IN                    | ?      | GPIO22 |
| I2C SCL                                           | GPIO25 | GPIO25 |
| I2C SDA                                           | GPIO33 | GPIO26 |
| ADE7953_IRQ (power meter)                         | GPIO36 | GPIO27 |
| Internal Temperature                              | GPIO37 | GPIO35 |

## Internal Temperature Sensor

An internal NTC temperature sensor in a "DOWNSTREAM" configuration is fitted
([ESPHome reference](https://esphome.io/components/sensor/resistance/)). Both R1 and R2 has been desoldered and
found to be 10k fixed resistor and 10k@25C NTC. The Beta constant of the NTC cannot easily be measured, and is guessed
to be ~3350.

v0.1.5 pinout credit to: [blakadder](https://templates.blakadder.com/shelly_plus_2PM.html)

## Minimal configuration for PCB v0.1.9 and Dual Core

Minimal configuration with all inputs/outputs and sensors configured

Note that in this example, the relay numbering is swapped compared to the above pinout and the inverter filter is only
applied to one of the two power channels. This example would be wrong with the Shellys bought from Austria in 2024.

```yaml
substitutions:
  devicename: "shelly-plus-2pm"
  output_name_1: "Output 1"
  output_name_2: "Output 2"
  input_name_1: "Input 1"
  input_name_2: "Input 2"

# For PCB v0.1.9 with dual core ESP32
esphome:
  name: ${devicename}

esp32:
  variant: esp32
  framework:
    type: arduino

logger:

api:
  encryption:
    key: "" # Add your API encryption key here

ota:
  - platform: esphome
    password: "" # Add your OTA password here

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

i2c:
  sda: GPIO26
  scl: GPIO25

output:
  - platform: gpio
    id: "relay_output_1"
    pin: GPIO13
  - platform: gpio
    id: "relay_output_2"
    pin:
      number: GPIO12
      ignore_strapping_warning: true

switch:
  - platform: output
    id: "relay_1"
    name: "${output_name_1}"
    output: "relay_output_1"
  - platform: output
    id: "relay_2"
    name: "${output_name_2}"
    output: "relay_output_2"

binary_sensor:
  # Button on device
  - platform: gpio
    name: "${devicename} Button"
    pin:
      number: GPIO4
      inverted: yes
      mode:
        input: true
        pullup: true
    internal: true
  # Input 1
  - platform: gpio
    name: "${input_name_1}"
    pin:
      number: GPIO5
      ignore_strapping_warning: true
    filters:
      - delayed_on_off: 50ms
    on_press:
      then:
        - switch.toggle: relay_1
    internal: true
  # Input 2
  - platform: gpio
    name: "${input_name_2}"
    pin: GPIO18
    filters:
      - delayed_on_off: 50ms
    on_press:
      then:
        - switch.toggle: relay_2
    internal: true

sensor:
  # Power Sensor
  - platform: ade7953_i2c
    irq_pin: GPIO27
    voltage:
      name: "${devicename} Voltage"
      entity_category: 'diagnostic'
    current_a:
      name: "${output_name_2} Current"
      entity_category: 'diagnostic'
    active_power_a:
      name: "${output_name_2} Power"
      id: power_channel_2
      entity_category: 'diagnostic'
      filters:
        - multiply: -1
    current_b:
      name: "${output_name_1} Current"
      entity_category: 'diagnostic'
    active_power_b:
      name: "${output_name_1} Power"
      id: power_channel_1
      entity_category: 'diagnostic'
    update_interval: 10s

  # Internal NTC Temperature sensor
  - platform: ntc
    sensor: temp_resistance_reading
    name: "${devicename} Temperature"
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    icon: "mdi:thermometer"
    entity_category: 'diagnostic'
    calibration:
      b_constant: 3350
      reference_resistance: 4.7kOhm
      reference_temperature: 298.15K

  # Required for NTC sensor
  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 5.6kOhm

  # Required for NTC sensor
  - platform: adc
    id: temp_analog_reading
    pin: GPIO35
    attenuation: 12db
    update_interval: 10s
```

## Example snippet for Single Core

Shows which settings under esphome and esp32 need to be changed to support the single core 160MHz version of the chip

Note that single core chips are only supported by the esp-idf framework, not arduino. This means that, for instance,
captive portal (required for fallback AP to work) cannot be used.

```yaml
# For Single Core ESP32
esphome:
  name: shelly-plus-2pm
  platformio_options:
    board_build.f_cpu: 160000000L

esp32:
  variant: esp32
  framework:
    type: esp-idf
    sdkconfig_options:
      CONFIG_FREERTOS_UNICORE: y
      CONFIG_ESP32_DEFAULT_CPU_FREQ_160: y
      CONFIG_ESP32_DEFAULT_CPU_FREQ_MHZ: "160"
```

## Advanced Configuration Example for PCB v0.1.9 and Dual Core

- Detached switch mode and toggle light switch
- Includes overpower and overtemperature protection.
- Will toggle a smart bulb in home assistant and has fallback to local power switching when connection to home assitant
  is down.

Note that in this example, the two power channels are swapped and the inverter filter is only applied to one of the two
power channels. This example would be wrong with the Shellys bought from Austria in 2024.

```yaml
substitutions:
  devicename: "shelly-plus-2pm"
  upper_devicename: "Shelly Plus 2PM"
  device_name_1: "Shelly Plus 2PM Switch 1"
  device_name_2: "Shelly Plus 2PM Switch 2"
  # Home Assistant light bulb to toggle
  bulb_name_1: "light.smart_bulb_1"
  bulb_name_2: "light.smart_bulb_2"
  # Relay trip limits
  max_power: "3600.0"
  max_temp: "80.0"

# For PCB v0.1.9 with dual core ESP32
esphome:
  name: "${devicename}"

esp32:
  variant: esp32
  framework:
    type: arduino

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: "" # Add your API encryption key here

ota:
  - platform: esphome
    password: "" # Add your OTA password here

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: true

  ap:
    ssid: "${upper_devicename} fallback AP"
    password: "" # Add your fallback AP password here

captive_portal:

time:
  - platform: homeassistant

i2c:
  sda: GPIO26
  scl: GPIO25

output:
  - platform: gpio
    id: "relay_output_1"
    pin: GPIO13

  - platform: gpio
    id: "relay_output_2"
    pin:
      number: GPIO12
      ignore_strapping_warning: true

#Shelly Switch Output
switch:
  - platform: output
    id: "relay_1"
    name: "${device_name_1} Output"
    output: "relay_output_1"
    restore_mode: RESTORE_DEFAULT_OFF

  - platform: output
    id: "relay_2"
    name: "${device_name_2} Output"
    output: "relay_output_2"
    restore_mode: RESTORE_DEFAULT_OFF

# Restart Button
button:
  - platform: restart
    id: "restart_device"
    name: "${device_name_1} Restart"
    entity_category: 'diagnostic'

#home assistant bulb to switch
text_sensor:
  - platform: homeassistant
    id: 'ha_bulb_1'
    entity_id: "${bulb_name_1}"
    internal: true
  - platform: homeassistant
    id: 'ha_bulb_2'
    entity_id: "${bulb_name_2}"
    internal: true

binary_sensor:
  #Shelly Switch Input 1
  - platform: gpio
    name: "${device_name_1} Input"
    pin:
      number: GPIO5
      ignore_strapping_warning: true
    #small delay to prevent debouncing
    filters:
      - delayed_on_off: 50ms
    # config for state change of input button
    on_state:
      then:
        - if:
            condition:
              and:
                - wifi.connected:
                - api.connected:
                - switch.is_on: "relay_1"
                - lambda: 'return (id(ha_bulb_1).state == "on" || id(ha_bulb_1).state == "off");'
            # toggle smart light if wifi and api are connected and relay is on
            then:
              - homeassistant.service:
                  service: light.toggle
                  data:
                    entity_id: "${bulb_name_1}"
            else:
              - switch.toggle: "relay_1"

  #Shelly Switch Input 2
  - platform: gpio
    name: "${device_name_2} Input"
    pin: GPIO18
    #small delay to prevent debouncing
    filters:
      - delayed_on_off: 50ms
    # config for state change of input button
    on_state:
      then:
        - if:
            condition:
              and:
                - wifi.connected:
                - api.connected:
                - switch.is_on: "relay_2"
                - lambda: 'return (id(ha_bulb_2).state == "on" || id(ha_bulb_2).state == "off");'
            # toggle smart light if wifi and api are connected and relay is on
            then:
              - homeassistant.service:
                  service: light.toggle
                  data:
                    entity_id: "${bulb_name_2}"
            else:
              - switch.toggle: "relay_2"

  #reset button on device
  - platform: gpio
    name: "${upper_devicename} Button"
    pin:
      number: GPIO4
      inverted: yes
      mode:
        input: true
        pullup: true
    on_press:
      then:
        - button.press: "restart_device"
    filters:
      - delayed_on_off: 5ms
    internal: true

sensor:
  # Uptime sensor.
  - platform: uptime
    name: "${upper_devicename} Uptime"
    entity_category: 'diagnostic'
    update_interval: 300s

  # WiFi Signal sensor.
  - platform: wifi_signal
    name: "${upper_devicename} WiFi Signal"
    update_interval: 60s
    entity_category: 'diagnostic'

  #temperature sensor
  - platform: ntc
    sensor: temp_resistance_reading
    name: "${upper_devicename} Temperature"
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    icon: "mdi:thermometer"
    entity_category: 'diagnostic'
    calibration:
      #These default values don't seem accurate
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 298.15K
    on_value_range:
      - above: ${max_temp}
        then:
          - switch.turn_off: "relay_1"
          - switch.turn_off: "relay_2"
          - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: "Message from ${upper_devicename}"
                data_template:
                  message: "${device_name_1} and ${device_name_2} turned off because temperature exceeded ${max_temp}°C"

  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 10kOhm

  - platform: adc
    id: temp_analog_reading
    pin: GPIO35
    attenuation: 12db
    update_interval: 60s

  #power monitoring
  - platform: ade7953_i2c
    irq_pin: GPIO27 # Prevent overheating by setting this
    voltage:
      name: "${upper_devicename} Voltage"
      entity_category: 'diagnostic'
    # On the Shelly 2.5 channels are mixed ch1=B ch2=A
    current_a:
      name: "${device_name_2} Current"
      entity_category: 'diagnostic'
    current_b:
      name: "${device_name_1} Current"
      entity_category: 'diagnostic'
    active_power_a:
      name: "${device_name_2} Power"
      id: power_channel_2
      entity_category: 'diagnostic'
      # active_power_a is normal, so don't multiply by -1
      on_value_range:
        - above: ${max_power}
          then:
            - switch.turn_off: "relay_2"
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: "Message from ${upper_devicename}"
                data_template:
                  message: "${device_name_2} turned off because power exceeded ${max_power}W"
    active_power_b:
      name: "${device_name_1} Power"
      id: power_channel_1
      entity_category: 'diagnostic'
      # active_power_b is inverted, so multiply by -1
      filters:
        - multiply: -1
      on_value_range:
        - above: ${max_power}
          then:
            - switch.turn_off: "relay_1"
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: "Message from ${upper_devicename}"
                data_template:
                  message: "${device_name_1} turned off because power exceeded ${max_power}W"
    update_interval: 30s

  - platform: total_daily_energy
    name: "${device_name_1} Daily Energy"
    power_id: power_channel_1
  - platform: total_daily_energy
    name: "${device_name_2} Daily Energy"
    power_id: power_channel_2

status_led:
  pin:
    number: GPIO0
    inverted: true
    ignore_strapping_warning: true
 ```

## Current Based Cover Configuration Example for PCB v0.1.9 and Dual Core

To use the Shelly Plus 2PM to control a window cover with an "opening" and a "closing" motor, the
[Current Based Cover](https://esphome.io/components/cover/current_based/) is used.

This configuration was implemented and tested on three pieces bought in Austria in 2024. As opposed to the examples
above, power channel A is for relay 1 (for the "opening" motor), power channel B is for relay 2 (for the "closing"
motor), and both power channels need to be inverted in order for the measurement to represent the motors' power
consumptions positively.

- outputs are configured to be mutually exclusive (never put power on both the opening and the closing motor)
- the input channels (one for "opening", one for "closing") are used for manual overriding. They always have presidence
  if used.
- whether or not the manual override is active is exposed as a binary sensor.

```yaml
substitutions:
  devicename: "shelly-plus-2pm"
  # Relay trip limits
  max_power: "3600.0"
  max_temp: "80.0"
  # current-based cover parameters
  open_duration: 54s
  close_duration: 53s
  max_duration: 70s
  start_sensing_delay: 1.5s
  moving_current_threshold: "0.2"
  obstacle_current_threshold: "0.8"

# For PCB v0.1.9 with dual core ESP32
esphome:
  name: "${devicename}"
  comment: "Shelly Plus 2PM configured for a current-based blind, with on-connection-loss-opening failsafe with durations open:${open_duration}, close:${close_duration}, max:${max_duration} and current thresholds moving:${moving_current_threshold}, obstacle:${obstacle_current_threshold}"

esp32:
  variant: esp32
  framework:
    type: arduino

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: "" # Add your API encryption key here
  on_client_disconnected: # failsafe
    then:
      - script.execute: blinds_open_if_no_manual_override

ota:
  - platform: esphome
    password: "" # Add your OTA password here

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: on
  on_disconnect: # failsafe
    then:
      - script.execute: blinds_open_if_no_manual_override

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${devicename}-AP"
    password: "" # Add your fallback AP password here

captive_portal:

time:
  - platform: homeassistant
    id: homeassistant_time

# Enable Web server
web_server:
  port: 80
  auth:
    username: "" # Add your web server username here
    password: "" # Add your web server password here


i2c:
  sda: GPIO26
  scl: GPIO25

# scripts for controlling the blinds
script:
  - id: blinds_open
    then:
      - switch.turn_off: switch_close
#        - delay: 0.1s
      - switch.turn_on: switch_open
  - id: blinds_close
    then:
      - switch.turn_off: switch_open
#        - delay: 0.1s
      - switch.turn_on: switch_close
  - id: blinds_stop
    then:
      - switch.turn_off: switch_open
      - switch.turn_off: switch_close
  - id: blinds_open_if_no_manual_override
    then:
      - if:
          condition:
            binary_sensor.is_off: manual_override
          then:
            - script.execute: blinds_open

#internal Shelly Switch Outputs
switch:
  - platform: gpio
    id: "switch_open"
    pin: GPIO13
    internal: true
    restore_mode: ALWAYS_OFF
    interlock: [switch_close]
    interlock_wait_time: 200ms
  - platform: gpio
    id: "switch_close"
    pin:
      number: GPIO12
      ignore_strapping_warning: true
    internal: true
    restore_mode: ALWAYS_OFF
    interlock: [switch_open]
    interlock_wait_time: 200ms

#Blind Output - current-based cover
cover:
  - platform: current_based
    device_class: blind
    name: "Blind Output"
    # for all actions (open, close, stop), respect a possible manual override. On manual override, do nothing.
    open_action:
      - if:
          condition:
            binary_sensor.is_off: manual_override
          then:
            - script.execute: blinds_open
          else:
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: "Message from ${devicename}"
                data_template:
                  message: "Cannot open blinds because manual override is active."
    close_action:
      - if:
          condition:
            binary_sensor.is_off: manual_override
          then:
            - script.execute: blinds_close
          else:
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: "Message from ${devicename}"
                data_template:
                  message: "Cannot close blinds because manual override is active."
    stop_action:
      - if:
          condition:
            binary_sensor.is_off: manual_override
          then:
            - script.execute: blinds_stop
          else:
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: "Message from ${devicename}"
                data_template:
                  message: "Cannot stop blinds because manual override is active."
    open_sensor: current_open
    open_moving_current_threshold: ${moving_current_threshold}
    open_obstacle_current_threshold: ${obstacle_current_threshold}
    open_duration: ${open_duration}
    close_sensor: current_close
    close_moving_current_threshold: ${moving_current_threshold}
    close_obstacle_current_threshold: ${obstacle_current_threshold}
    close_duration: ${close_duration}
    max_duration: ${max_duration}
    # obstacle_rollback: 10% # default
    start_sensing_delay: ${start_sensing_delay}
    malfunction_detection: true
    malfunction_action:
      then:
        - homeassistant.service:
            service: persistent_notification.create
            data:
              title: "Message from ${devicename}"
            data_template:
              message: "Malfunction detected. Relays welded."

binary_sensor:
  #Shelly Switch Input 1 - "open blind" input
  - platform: gpio
    id: "input_open"
    name: "Open Input"
    pin:
      number: GPIO5
      ignore_strapping_warning: true
    #small delay for debouncing
    filters:
      - delayed_on_off: 50ms
    # when pressed, open blinds:
    on_press:
      then:
        - script.execute: blinds_open
    # when released, stop blinds:
    on_release:
      then:
        - script.execute: blinds_stop
  #Shelly Switch Input 2 - "close blind" input
  - platform: gpio
    id: "input_close"
    name: "Close Input"
    pin: GPIO18
    #small delay for debouncing
    filters:
      - delayed_on_off: 50ms
    # when pressed, close blinds:
    on_press:
      then:
        - script.execute: blinds_close
    # when released, stop blinds:
    on_release:
      then:
        - script.execute: blinds_stop
  #Manual Override Sensor - exposes if any of the input switches are on and therefore manual blind control override is avtive
  - platform: template
    id: "manual_override"
    name: "Manual Input Override"
    lambda: |-
      return ( id(input_open).state || id(input_close).state );
  #button - exposed in casing.
  - platform: gpio
    name: "$devicename Button"
    pin:
      number: GPIO4
      inverted: yes
      mode:
        input: true
        pullup: true
    filters:
      - delayed_on_off: 5ms

sensor:
  # WiFi Signal sensor.
  - platform: wifi_signal
    name: "${devicename} - Wifi Signal"
    update_interval: 60s
    icon: mdi:wifi

  # Uptime sensor.
  - platform: uptime
    name: "${devicename} - Uptime"
    update_interval: 60s
    icon: mdi:clock-outline

  #temperature sensor
  - platform: ntc
    sensor: temp_resistance_reading
    name: "${devicename} Temperature"
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    icon: "mdi:thermometer"
    entity_category: 'diagnostic'
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      # ATTENTION in other template configurations for the Shelly Plus 2PM, the resistance is 4.7k
      reference_temperature: 298.15K
    on_value_range:
      - above: ${max_temp}
        then:
          - script.execute: blinds_stop
          - homeassistant.service:
              service: persistent_notification.create
              data:
                title: "Message from ${devicename}"
              data_template:
                message: "Relays turned off because temperature exceeded ${max_temp}°C"

  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 10kOhm
    # ATTENTION in other template configurations for the Shelly Plus 2PM, the resistance is 5.6k

  - platform: adc
    id: temp_analog_reading
    pin: GPIO35
    attenuation: 12db
    update_interval: 10s

  #power monitoring
  - platform: ade7953_i2c
    irq_pin: GPIO27 # Prevent overheating by setting this
    voltage:
      name: "${devicename} - Voltage"
      unit_of_measurement: V
      accuracy_decimals: 1
      icon: mdi:flash-outline
    # On the Shelly Plus 2PM bought in Austria in 2024, the channels are in order: ch1=A ch2=B
    current_a:
      id: current_open
      name: "${devicename} - Opening Relay Current"
      unit_of_measurement: A
      accuracy_decimals: 3
      icon: mdi:current-ac
    current_b:
      id: current_close
      name: "${devicename} - Closing Relay Current"
      unit_of_measurement: A
      accuracy_decimals: 3
      icon: mdi:current-ac
    active_power_a:
      name: "${devicename} - Opening Relay Power"
      id: power_relay_open
      unit_of_measurement: W
      icon: mdi:gauge
      # active_power_a is inverted, so multiply by -1
      filters:
        - multiply: -1
      on_value_range:
        - above: ${max_power}
          then:
            - switch.turn_off: switch_open
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: "Message from ${devicename}"
                data_template:
                  message: "Opening Relay turned off because power exceeded ${max_power}W"
    active_power_b:
      name: "${devicename} - Closing Relay Power"
      id: power_relay_close
      unit_of_measurement: W
      icon: mdi:gauge
      # active_power_b is inverted, so multiply by -1
      filters:
        - multiply: -1
      on_value_range:
        - above: ${max_power}
          then:
            - switch.turn_off: switch_close
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: "Message from ${devicename}"
                data_template:
                  message: "Closing Relay turned off because power exceeded ${max_power}W"
    update_interval: 0.5s

  - platform: total_daily_energy
    name: "${devicename} - Opening Relay Daily Electric Consumption"
    power_id: power_relay_open
  - platform: total_daily_energy
    name: "${devicename} - Closing Relay Daily Electric Consumption"
    power_id: power_relay_close

status_led:
  pin:
    number: GPIO0
    inverted: true
    ignore_strapping_warning: true

text_sensor:
  - platform: wifi_info
    ip_address:
      name: "${devicename} - IP Address"
    ssid:
      name: "${devicename} - Wi-Fi SSID"
    bssid:
      name: "${devicename} - Wi-Fi BSSID"
  - platform: version
    name: "${devicename} - ESPHome Version"
    hide_timestamp: true
 ```
