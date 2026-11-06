---
title: Loetad EU3S Power Monitoring Plug
date-published: 2020-08-03
type: plug
standard: eu
board: esp8266
---
  ![alt text](./Loetad-EU3S-Power-Monitoring-Plug.jpg "Product Image")
  ![alt text](./Loetad-EU3S-Power-Monitoring-Plug-Reference.jpg "Product Reference Image")

Model reference: EU3S

- [AWOW EU3S 16A Power Monitoring Plug](https://devices.esphome.io/devices/awow-eu3s-power-monitoring-plug/)
- [CloudFree EU Plug (P1EU)](https://devices.esphome.io/devices/cloudfree-eu-plug-%28p1eu%29/)
- Maxus Brio Head 16A Power Monitoring Plug (BRIO-W-HEAD16)
- iQtech SmartLife Power Monitoring Plug (WS020)

Manufacturer: Loetad

## GPIO Pinout

| Pin    | Function                   |
|--------|----------------------------|
| GPIO02 | Blue LED (Inverted: true)  |
| GPIO05 | HLW8012 CF Pin             |
| GPIO12 | HLWBL SELi Pin             |
| GPIO13 | Push Button                |
| GPIO14 | HLWBL CF1 Pin              |
| GPIO15 | Relay                      |

## Basic Config

```yaml
substitutions:
  devicename: loetad_eu3s_plug_1
  friendly_name: Loetad EU3S Plug 1
  device_description: Loetad EU3S Power Monitoring Plug with button and Blue led.
  current_res: "0.00221" # Random value. Requires power monitoring calibration
  voltage_div: "955" # Random value. Requires power monitoring calibration

esphome:
  name: ${devicename}
  comment: ${device_description}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: ${friendly_name}
    password: !secret AP_Password

  manual_ip:
      static_ip: 192.168.x.xx
      gateway: 192.168.x.x
      subnet: 255.255.255.0

captive_portal:

# Enable logging
logger:

# Web server can be removed after enabling HA API
#web_server:
#  port: 80

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

ota:
  password: !secret OTA_Password

# Enable time component for use by daily power sensor
time:
  - platform: homeassistant
    id: homeassistant_time

sensor:
# Reports how long the device has been powered (in minutes)
  - platform: uptime
    name: ${friendly_name} Uptime
    filters:
      - lambda: return x / 60.0;
    unit_of_measurement: minutes

# Reports the WiFi signal strength
  - platform: wifi_signal
    name: ${friendly_name} Wifi Signal
    update_interval: 60s

# Reports the Current, Voltage, and Power used by the plugged-in device
  - platform: hlw8012
    sel_pin:
      number: GPIO12
      inverted: true
    cf_pin: GPIO05
    cf1_pin: GPIO14
    change_mode_every: 8
    update_interval: 10s
    current:
      name: ${friendly_name} Amperage
      icon: mdi:current-ac
      unit_of_measurement: A
    voltage:
      name: ${friendly_name} Voltage
      icon: mdi:flash-circle
      unit_of_measurement: V
    power:
      id: wattage
      name: ${friendly_name} Wattage
      icon: mdi:flash-outline
      unit_of_measurement: W
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}

  # Reports the total Power so-far each day, resets at midnight, see https://esphome.io/components/sensor/total_daily_energy/
  - platform: total_daily_energy
    name: ${friendly_name} Total Daily Energy
    icon: mdi:circle-slice-3
    power_id: wattage
    filters:
      # Multiplication factor from W to kW is 0.001
      - multiply: 0.001
    unit_of_measurement: kWh

binary_sensor:
# Button on the front is pressed and then toggle relay
  - platform: gpio
    device_class: power
    pin:
      number: GPIO13
      mode: INPUT_PULLUP
      inverted: True
    name: ${friendly_name} Button # Name to make button visible in HA
    on_press:
      - switch.toggle: relay

text_sensor:
# Reports the ESPHome Version with compile date
  - platform: version
    name: ${friendly_name} ESPHome Version

# Reports detailed wifi info, can be commented out
  - platform: wifi_info
    ip_address:
      name: ${friendly_name} IP Address
    # ssid: # Some additional wifi info that is not normally needed
    #   name: ${friendly_name} Connected SSID
    # bssid:
    #   name: ${friendly_name} Connected BSSID

switch:
# Relay itself
  - platform: gpio
    name: ${friendly_name}
    pin: GPIO15
    id: relay
    restore_mode: RESTORE_DEFAULT_OFF #Try to restore relay state after reboot/power-loss event.
    #RESTORE_DEFAULT_OFF (Default) - Attempt to restore state and default to OFF if not possible to restore. Uses flash write cycles.
    #RESTORE_DEFAULT_ON - Attempt to restore state and default to ON. Uses flash write cycles.
    #ALWAYS_OFF - Always initialize the pin as OFF on bootup. Does not use flash write cycles.
    #ALWAYS_ON - Always initialize the pin as ON on bootup. Does not use flash write cycles.
    on_turn_on: # Action when relay is turned on
      - script.execute: led_power_on
    on_turn_off: # Action when relay is turned off
      - script.execute: led_relay_off

output:
# Output GPIOs for blue led
- platform: esp8266_pwm # Blue
  id: ${devicename}_blue_output
  pin:
    number: GPIO02
    inverted: True

light:
# RGB light
- platform: monochromatic
  name: ${friendly_name} Light
  output: ${devicename}_blue_output
  id: ${devicename}_blue_led

# Blink the blue light if we aren't connected to WiFi. Could use https://esphome.io/components/status_led/ instead but then we couldn't use the blue light for other things as well.
# Only if not connected after 30s
interval:
  - interval: 2000ms
    then:
      - if:
          condition:
            for:
              time: 30s
              condition:
                not:
                  wifi.connected:
          then:
            - light.turn_on:
                id: ${devicename}_blue_led
                brightness: 100%

script:
  - id: led_relay_off # Normal operation when relay is off
    then:
      - light.turn_off:
          id: ${devicename}_blue_led
  - id: led_power_on # Normal operation when relay is on
    then:
      - light.turn_on:
          id: ${devicename}_blue_led
          brightness: 80%

```
