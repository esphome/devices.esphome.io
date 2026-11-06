---
title: Brilliant Lighting BL20925 Power Monitoring Plug
date-published: 2020-04-17
type: plug
standard: au
board: esp8266
---
  ![alt text](./Brilliant-Lighting-BL20925-Power-Monitoring-Plug.jpeg "Product Image")
  
[https://www.officeworks.com.au/shop/officeworks/p/brilliant-lighting-smart-wifi-plug-with-energy-monitoring-bl20925](https://www.officeworks.com.au/shop/officeworks/p/brilliant-lighting-smart-wifi-plug-with-energy-monitoring-bl20925)

## GPIO Pinout

| Pin    | Function                   |
|--------|----------------------------|
| GPIO03 | Push Button                |
| GPIO13 | Blue LED (Inverted: true)  |
| GPIO14 | Relay                      |
| GPIO12 | HLWBL SEL Pin              |
| GPIO04 | HLW8012 CF Pin             |
| GPIO05 | HLWBL CF1 Pin              |

## Basic Config

```yaml
substitutions:
  devicename: brilliant_smartplug_1
  friendly_name: Brilliant Smartplug 1
  device_description: Brilliant Lighting BL20925 Power Monitoring Plug with button and Blue led.


esphome:
  name: $devicename
  comment: ${device_description}

esp8266:
  board: esp01_1m
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Enable logging
logger:

# Web server can be removed after enabling HA API
#web_server:
#  port: 80

# Enable Home Assistant API
api:
  encryption:
    key: !secret api_encryption_key

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
    cf_pin: GPIO04
    cf1_pin: GPIO05
    change_mode_every: 3
    update_interval: 3s
    power:
      name: ${friendly_name} Power
      unit_of_measurement: W
      id: wattage
    current:
      name: ${friendly_name} Current
      unit_of_measurement: A
    voltage:
      name: ${friendly_name} Voltage
      unit_of_measurement: V

  # Reports the total Power so-far each day, resets at midnight, see https://esphome.io/components/sensor/total_daily_energy/
  - platform: total_daily_energy
    name: ${friendly_name} Total Daily Energy
    power_id: wattage
    filters:
      - multiply: 0.001
    unit_of_measurement: kWh

binary_sensor:
# Button on the front is pressed and then toggle relay
  - platform: gpio
    device_class: power
    pin:
      number: GPIO03
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
    pin: GPIO14
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
  id: brilliant_smartplug_1_blue_output
  pin:
    number: GPIO013
    inverted: True

light:
# RGB light
- platform: monochromatic
  name: ${friendly_name} Light
  output: brilliant_smartplug_1_blue_output
  id: brilliant_smartplug_1_blue_led

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
                id: brilliant_smartplug_1_blue_led
                brightness: 100%

script:
  - id: led_relay_off # Normal operation when relay is off
    then:
      - light.turn_off:
          id: brilliant_smartplug_1_blue_led
  - id: led_power_on # Normal operation when relay is on
    then:
      - light.turn_on:
          id: brilliant_smartplug_1_blue_led
          brightness: 80%

```
