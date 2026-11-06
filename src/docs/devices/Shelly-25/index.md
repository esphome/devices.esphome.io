---
title: Shelly 2.5
date-published: 2020-05-08
type: relay
standard: uk, us, eu
board: esp8266
---

## GPIO Pinout

| Pin    | Function                        |
| ------ | ------------------------------- |
| GPIO0  | LED 1i                          |
| GPIO2  | Button 1                        |
| GPIO4  | Relay 1                         |
| GPIO5  | Switch 2 Input                  |
| GPIO12 | i2c SDA                         |
| GPIO13 | Switch 1 Input                  |
| GPIO14 | i2c SCL                         |
| GPIO15 | Relay 2                         |
| GPIO16 | ADE7953 IRQ (power measurement) |
| GPIOA0 | Internal Temperature            |

## Basic Configuration As Relay

When integration with Home Assistant exists, it will appear as 2 Relays with icons and 2 switches (including power,
current and sensors)
Use cases for this configuration: Roller / Shutter automation and device swichting and monitoring

Thanks to ["Anaro"](https://community.home-assistant.io/u/anarro/summary) from Home Assistant forum
[topic](https://community.home-assistant.io/t/119235/8)
config tested by ["Datux"](https://github.com/dtx3k)

```yaml
# Basic Config
substitutions:
  devicename: shelly_25

esphome:
  name: ${devicename}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  power_save_mode: HIGH # for ESP8266 LOW/HIGH are mixed up, esphome/issues/issues/1532

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:

i2c:
  sda: GPIO12
  scl: GPIO14

sensor:
  - platform: ade7953_i2c
    irq_pin: GPIO16 # Prevent overheating by setting this
    voltage:
      name: ${devicename} Voltage
    # On the Shelly 2.5 channels are mixed ch1=B ch2=A
    current_a:
      name: ${devicename} Current B
    current_b:
      name: ${devicename} Current A
    active_power_a:
      name: ${devicename} Active Power B
      # active_power_a is normal, so don't multiply by -1
    active_power_b:
      name: ${devicename} Active Power A
      # active_power_b is inverted, so take the absolute value
      filters:
        - lambda: return abs(x);
    update_interval: 60s

  # NTC Temperature
  - platform: ntc
    sensor: temp_resistance_reading
    name: ${devicename} Temperature
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    icon: "mdi:thermometer"
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 298.15K
  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 32kOhm
  - platform: adc
    id: temp_analog_reading
    pin: A0

status_led:
  pin:
    number: GPIO0
    inverted: yes

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
    name: ${devicename} Switch1
    on_press:
      then:
        - switch.toggle: shelly_relay_1
  - platform: gpio
    pin:
      number: GPIO5
    name: ${devicename} Switch2
    on_press:
      then:
        - switch.toggle: shelly_relay_2

switch:
  - platform: gpio
    id: shelly_relay_1
    name: ${devicename} Relay1
    pin: GPIO4
    icon: "mdi:electric-switch"
    restore_mode: RESTORE_DEFAULT_OFF
    # Ensure only one switch at a time is on (https://esphome.io/components/switch/gpio/#interlocking)
    interlock: &interlock_group [shelly_relay_1, shelly_relay_2]

  - platform: gpio
    id: shelly_relay_2
    name: ${devicename} Relay2
    pin: GPIO15
    icon: "mdi:electric-switch"
    restore_mode: RESTORE_DEFAULT_OFF
    interlock: *interlock_group
```

## Configuration as relay with overpower and overtemperature protection

When integration with home assistant exists, it will appear as 2 relays with icons and 2 binary sensors (including
power, current and sensors)
When the `max_power` is exceeded on 1 channel, that channel will be switched off and a persistent notification will be
created in home-assistant
When the `max_temp` is exceeded, the 2 channels are switched off and a persistent notification will be created in
home-assistant
Thanks to [Datux](https://github.com/dtx3k) modified and tested by [gieljnssns](https://github.com/gieljnssns)

```yaml
substitutions:
  devicename: shelly_25
  ip: 192.168.xx.xx
  channel_1: Relay 1
  channel_2: Relay 2

  ssid: !secret ssid
  password: !secret password

  max_power: "2000.0"
  max_temp: "70.0"

esphome:
  name: ${devicename}

esp8266:
  board: esp01_1m

wifi:
  ssid: ${ssid}
  password: ${password}
  power_save_mode: HIGH # for ESP8266 LOW/HIGH are mixed up, esphome/issues/issues/1532
  manual_ip:
    static_ip: ${ip}
    gateway: 192.168.xx.xx
    subnet: 255.255.255.0
    dns1: 8.8.8.8
    dns2: 8.8.4.4

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: ${devicename}
    password: ${password}
    manual_ip:
      static_ip: 192.168.100.2
      gateway: 192.168.100.1
      subnet: 255.255.255.0
      dns1: 8.8.8.8
      dns2: 8.8.4.4

captive_portal:

# Enable logging
logger:
  level: DEBUG

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

ota:
  password: ${password}

web_server:
  port: 80

time:
  - platform: sntp
    id: my_time

i2c:
  sda: GPIO12
  scl: GPIO14

sensor:
  - platform: ade7953_i2c
    irq_pin: GPIO16 # Prevent overheating by setting this
    voltage:
      name: ${devicename} voltage
    # On the Shelly 2.5 channels are mixed ch1=B ch2=A
    current_a:
      name: ${channel_2} current
      internal: true
    current_b:
      name: ${channel_1} current
      internal: true
    active_power_a:
      name: ${channel_2} power
      id: power_channel_2
      # active_power_a is normal, so don't multiply by -1
      on_value_range:
        - above: ${max_power}
          then:
            - switch.turn_off: shelly_relay_2
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: Message from ${devicename}
                data_template:
                  message: Switch turned off because power exceeded ${max_power}W
    active_power_b:
      name: ${channel_1} power
      id: power_channel_1
      # active_power_b is inverted, so take the absolute value
      filters:
        - lambda: return abs(x);
      on_value_range:
        - above: ${max_power}
          then:
            - switch.turn_off: shelly_relay_1
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: Message from ${devicename}
                data_template:
                  message: Switch turned off because power exceeded ${max_power}W
    update_interval: 30s

  - platform: total_daily_energy
    name: ${channel_1} energy
    power_id: power_channel_1
    filters:
      # Multiplication factor from W to kWh is 0.001
      - multiply: 0.001
    unit_of_measurement: kWh

  - platform: total_daily_energy
    name: ${channel_2} energy
    power_id: power_channel_2
    filters:
      # Multiplication factor from W to kWh is 0.001
      - multiply: 0.001
    unit_of_measurement: kWh

  # NTC Temperature
  - platform: ntc
    sensor: temp_resistance_reading
    name: ${devicename} temperature
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    icon: "mdi:thermometer"
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 298.15K
    on_value_range:
      - above: ${max_temp}
        then:
          - switch.turn_off: shelly_relay_1
          - switch.turn_off: shelly_relay_2
          - homeassistant.service:
              service: persistent_notification.create
              data:
                title: Message from ${devicename}
              data_template:
                message: Switch turned off because temperature exceeded ${max_temp}°C
  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 32kOhm
  - platform: adc
    id: temp_analog_reading
    pin: A0

status_led:
  pin:
    number: GPIO0
    inverted: yes

switch:
  - platform: gpio
    id: shelly_relay_1
    name: ${channel_1} relay
    pin: GPIO4
    icon: "mdi:electric-switch"
    restore_mode: RESTORE_DEFAULT_OFF
    # Ensure only one switch at a time is on (https://esphome.io/components/switch/gpio/#interlocking)
    interlock: &interlock_group [shelly_relay_1, shelly_relay_2]

  - platform: gpio
    id: shelly_relay_2
    name: ${channel_2} relay
    pin: GPIO15
    icon: "mdi:electric-switch"
    restore_mode: RESTORE_DEFAULT_OFF
    interlock: *interlock_group

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
    name: "${channel_1} input"
    on_state:
      then:
        - switch.toggle: shelly_relay_1
  - platform: gpio
    pin:
      number: GPIO5
    name: "${channel_2} input"
    on_state:
      then:
        - switch.toggle: shelly_relay_2
```

## Basic Configuration As Lights

Using this config wil make the Shelly show up as lights within Home Assistant
Use Case for this configuration: Automate light sources
Based uppon the Shelly 1 configuration (modified and tested by ["Datux"](https://github.com/dtx3k) )

```yaml
# basic configuration

# Basic Config
substitutions:
  devicename: shelly_25

esphome:
  name: ${devicename}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret ssid1
  password: !secret ssid1_pass
  power_save_mode: HIGH # for ESP8266 LOW/HIGH are mixed up, esphome/issues/issues/1532

captive_portal:

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:

i2c:
  sda: GPIO12
  scl: GPIO14

sensor:
  - platform: ade7953_i2c
    irq_pin: GPIO16 # Prevent overheating by setting this
    voltage:
      name: ${devicename} Voltage
    # On the Shelly 2.5 channels are mixed ch1=B ch2=A
    current_a:
      name: ${devicename} Current B
    current_b:
      name: ${devicename} Current A
    active_power_a:
      name: ${devicename} Active Power B
      # active_power_a is normal, so don't multiply by -1
    active_power_b:
      name: ${devicename} Active Power A
      # active_power_b is inverted, so take the absolute value
      filters:
        - lambda: return abs(x);
    update_interval: 60s

  # NTC Temperature
  - platform: ntc
    sensor: temp_resistance_reading
    name: ${devicename} Temperature
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    icon: "mdi:thermometer"
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 298.15K
  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 32kOhm
  - platform: adc
    id: temp_analog_reading
    pin: A0

status_led:
  pin:
    number: GPIO0
    inverted: yes

output:
  - platform: gpio
    pin: GPIO4
    id: shelly_25_relay_1
  - platform: gpio
    pin: GPIO15
    id: shelly_25_relay_2

light:
  - platform: binary
    name: "${devicename} Light 1"
    output: shelly_25_relay_1
    id: lightid1
  - platform: binary
    name: "${devicename} Light 2"
    output: shelly_25_relay_2
    id: lightid2

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
      #mode: INPUT_PULLUP
      #inverted: True
    name: "${devicename} Switch 1"
    on_state:
      then:
        - light.toggle: lightid1
    internal: true
    id: switchid1
  - platform: gpio
    pin:
      number: GPIO5
      #mode: INPUT_PULLUP
      #inverted: True
    name: "${devicename} Switch 2"
    on_state:
      then:
        - light.toggle: lightid2
    internal: true
    id: switchid2
```

## Configuration as light with overpower and overtemperature protection

When integration with home assistant exists, it will appear as 2 relays with icons and 2 binary sensors (including
power, current and sensors)
When the `max_power` is exceeded on 1 channel, that channel will be switched off and a persistent notification will be
created in home-assistant
When the `max_temp` is exceeded, the 2 channels are switched off and a persistent notification will be created in
home-assistant
Thanks to [Datux](https://github.com/dtx3k) modified and tested by [gieljnssns](https://github.com/gieljnssns)

```yaml
substitutions:
  devicename: shelly_25
  ip: 192.168.xx.xx
  channel_1: Light 1
  channel_2: Light 2

  ssid: !secret ssid
  password: !secret password

  max_power: "2000.0"
  max_temp: "70.0"

esphome:
  name: ${devicename}

esp8266:
  board: esp01_1m

wifi:
  ssid: ${ssid}
  password: ${password}
  power_save_mode: HIGH # for ESP8266 LOW/HIGH are mixed up, esphome/issues/issues/1532
  manual_ip:
    static_ip: ${ip}
    gateway: 192.168.xx.xx
    subnet: 255.255.255.0
    dns1: 8.8.8.8
    dns2: 8.8.4.4

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: ${devicename}
    password: ${password}
    manual_ip:
      static_ip: 192.168.100.2
      gateway: 192.168.100.1
      subnet: 255.255.255.0
      dns1: 8.8.8.8
      dns2: 8.8.4.4

captive_portal:

# Enable logging
logger:
  level: DEBUG

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

ota:
  password: ${password}

web_server:
  port: 80

time:
  - platform: sntp
    id: my_time

i2c:
  sda: GPIO12
  scl: GPIO14

sensor:
  - platform: ade7953_i2c
    irq_pin: GPIO16 # Prevent overheating by setting this
    voltage:
      name: ${devicename} voltage
    # On the Shelly 2.5 channels are mixed ch1=B ch2=A
    current_a:
      name: ${channel_2} current
      internal: true
    current_b:
      name: ${channel_1} current
      internal: true
    active_power_a:
      name: ${channel_2} power
      id: power_channel_2
      # active_power_a is normal, so don't multiply by -1
      on_value_range:
        - above: ${max_power}
          then:
            - light.turn_off: lightid2
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: Message from ${devicename}
                data_template:
                  message: Switch turned off because power exceeded ${max_power}W
    active_power_b:
      name: ${channel_1} power
      id: power_channel_1
      # active_power_b is inverted, so take the absolute value
      filters:
        - lambda: return abs(x);
      on_value_range:
        - above: ${max_power}
          then:
            - light.turn_off: lightid1
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: Message from ${devicename}
                data_template:
                  message: Switch turned off because power exceeded ${max_power}W
    update_interval: 30s

  - platform: total_daily_energy
    name: ${channel_1} energy
    power_id: power_channel_1
    filters:
      # Multiplication factor from W to kWh is 0.001
      - multiply: 0.001
    unit_of_measurement: kWh

  - platform: total_daily_energy
    name: ${channel_2} energy
    power_id: power_channel_2
    filters:
      # Multiplication factor from W to kWh is 0.001
      - multiply: 0.001
    unit_of_measurement: kWh

  # NTC Temperature
  - platform: ntc
    sensor: temp_resistance_reading
    name: ${devicename} temperature
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    icon: "mdi:thermometer"
    calibration:
      b_constant: 3350
      reference_resistance: 10kOhm
      reference_temperature: 298.15K
    on_value_range:
      - above: ${max_temp}
        then:
          - light.turn_off: lightid1
          - light.turn_off: lightid2
          - homeassistant.service:
              service: persistent_notification.create
              data:
                title: Message from ${devicename}
              data_template:
                message: Switch turned off because temperature exceeded ${max_temp}°C
  - platform: resistance
    id: temp_resistance_reading
    sensor: temp_analog_reading
    configuration: DOWNSTREAM
    resistor: 32kOhm
  - platform: adc
    id: temp_analog_reading
    pin: A0

status_led:
  pin:
    number: GPIO0
    inverted: yes

output:
  - platform: gpio
    pin: GPIO4
    id: shelly_25_relay_1
  - platform: gpio
    pin: GPIO15
    id: shelly_25_relay_2

light:
  - platform: binary
    name: "${channel_1}"
    output: shelly_25_relay_1
    id: lightid1
  - platform: binary
    name: "${channel_2}"
    output: shelly_25_relay_2
    id: lightid2

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
    name: "${channel_1} input"
    on_state:
      then:
        - light.toggle: lightid1
  - platform: gpio
    pin:
      number: GPIO5
    name: "${channel_2} input"
    on_state:
      then:
        - light.toggle: lightid2
```
