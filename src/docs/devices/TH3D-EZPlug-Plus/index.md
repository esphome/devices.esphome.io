---
title: TH3D EZPlug+
date-published: 2023-02-20
type: plug
standard: us
board: esp8266
---

[TH3D Shop Link](https://www.th3dstudio.com/product/ezplug-open-source-wifi-smart-plug/)

## GPIO Pinout

| Pin    | Function                            |
| -----  | ------------                        |
| GPIO3  | Button Input                        |
| GPIO4  | BL0937 Ennergy Meter CF             |
| GPIO5  | HLW8012 Power Sensor CF1            |
| GPIO12 | HLW8012 Power Sensor SEL (Inverted) |
| GPIO13 | Status LED (Inverted)               |
| GPIO14 | Relay                               |

## Configuration Notes

* This includes basic overcurrent protection in the form of an automation
* Voltage divider is configured as I found mine, but you will need to verify your own voltage/current/power calibration

## Basic Configuration

```yaml
esphome:
  name: TH3D_EZPlug_Plus
  restore_from_flash: true
  early_pin_init: true

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:
api:
ota:

time:
  - platform: homeassistant

switch:
  - platform: restart
    name: Restart
text_sensor:
  - platform: version
    name: Version
  - platform: wifi_info
    ip_address:
      name: IP Address
    ssid:
      name: SSID
    bssid:
      name: BSSID
    mac_address:
      name: MAC Address
    scan_results:
      name: Scan Results
switch:
  - platform: gpio
    pin: GPIO14
    id: relay
    restore_mode: RESTORE_DEFAULT_OFF
    name: Relay
    on_turn_on:
      - light.turn_on: led
    on_turn_off:
      - light.turn_off: led

sensor:
  - platform: uptime
    name: Uptime
    device_class: "duration"
    unit_of_measurement: s
    accuracy_decimals: 0
  - platform: wifi_signal
    name: Wifi Signal Strength
    update_interval: 5min
  - platform: hlw8012
    sel_pin:
      number: GPIO12
      inverted: true
    cf_pin: GPIO4
    cf1_pin: GPIO5
    model: BL0937
    voltage_divider: 512
    current:
      name: Current
      unit_of_measurement: A
      accuracy_decimals: 3
    # Overcurrent protection.  Device is rated for 15A
    on_value_range:
        - above: 15
          then:
            - switch.turn_off: relay
            - homeassistant.service:
                service: persistent_notification.create
                data:
                  title: Message from TH3D_EZPlug_Plus
                data_template:
                  message: Switch turned off because power exceeded 15A
    voltage:
      name: Voltage
      unit_of_measurement: V
      accuracy_decimals: 1
    power:
      name: Power
      id: power
      unit_of_measurement: "W"
      accuracy_decimals: 0
      icon: mdi:flash-outline
    change_mode_every: 1
    update_interval: 2s
  - platform: total_daily_energy
    name: Daily Energy
    power_id: power
    filters:
      # 1 W = .001 kW
      - multiply: 0.001
    unit_of_measurement: kWh

binary_sensor:
  - platform: status
    name: Status
  - platform: gpio
    pin:
      number: GPIO3
      mode: INPUT_PULLUP
      inverted: True
    name: Button
    on_press:
      - switch.toggle: relay

light:
  - platform: status_led
    id: led
    pin:
      number: GPIO13
      inverted: True
```
