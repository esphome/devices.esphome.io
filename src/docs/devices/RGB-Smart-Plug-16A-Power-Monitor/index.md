---
title: RGB Smart Plug 16A with power monitoring
date-published: 2020-03-02
type: plug
standard: eu
board: esp8266
---

This plug can be found under many brand names (Lonsonho, Avatto, Vansware, … ) Identified by the packaging and the
sticker inside the plug. At this time seems to be only EU plug with 16A, RGB color led and power metering.

More info:
[https://templates.blakadder.com/XS-A12.html](https://templates.blakadder.com/XS-A12.html)

## GPIO Pinout

| Pin    | Function   |
| ------ | ---------- |
| GPIO00 | PWM1 red   |
| GPIO02 | PWM3 blue  |
| GPIO04 | PWM2 green |
| GPIO05 | BL0937 CF  |
| GPIO12 | HLWBL SELi |
| GPIO14 | HLWBL CF1  |
| GPIO15 | Relay1     |

## Basic Configuration

Most of this code is from from [https://devices.esphome.io/devices/awp04l/](https://devices.esphome.io/devices/awp04l/)

```yaml
# Check or edit all secrets to match yours.
# Power metering isn't calibrated.

substitutions:
  devicename: rgb_smart_plug_16a
  friendly_name: RGB Smart Plug 16A
  device_description: Energy Monitoring 16A Smart Plug with button and RGB led.

esphome:
  name: $devicename
  comment: ${device_description}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: on #we only have one WiFi AP so just use the first one that matches
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: $devicename
    password: !secret esphome_backup_ap_password

captive_portal:

# Enable logging
logger:
  baud_rate: 0 #disable UART logging since we aren't connected to GPIO1 TX

# Web server can be removed after enabling HA API
web_server:
  port: 80

ota:
  password: !secret ota_password

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

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

  # Reports the Current, Voltage, and Power used by the plugged-in device (not counting this plug's own usage of about 0.8W/0.019A, so subtract those when calibrating with this plugged into a Kill-A-Watt type meter)
  - platform: hlw8012
    sel_pin:
      number: GPIO12
      inverted: True
    cf_pin: GPIO5
    cf1_pin: GPIO14
    current_resistor: 0.001 #The value of the shunt resistor for current measurement. Defaults to the Sonoff POW’s value 0.001 ohm.
    # voltage_divider: 2401 # Commented out, using default
    power:
      name: ${friendly_name} Power
      unit_of_measurement: W
      id: wattage
      filters:
        - delta: 10 # Don't report if change is less than 10W from previous reported, make it smaller if you got smaller load
        - calibrate_linear:
            # Map 0.0 (from sensor) to 0.0 (true value)
            - 0.0 -> 0.0 #Need to keep 0 mapped to 0 for when connected device is not drawing any power
            - 16.9 -> 5.7 # -0.8W from just this plug
    current:
      name: ${friendly_name} Current
      unit_of_measurement: A
      filters:
        - delta: 1
        - calibrate_linear:
            # Map 0.0 (from sensor) to 0.0 (true value)
            - 0.0 -> 0.0 #Need to keep 0 mapped to 0 for when connected device is not drawing any power
            - 0.0376 -> 0.025 # -0.019A from just this plug, very raw calibration
    voltage:
      name: ${friendly_name} Voltage
      unit_of_measurement: V
      filters:
        - delta: 2
        - calibrate_linear:
            # Map 0.0 (from sensor) to 0.0 (true value)
            - 0.0 -> 0.0 #Don't care if 0 reading aligns with 0 real Volts since we won't ever measure that
            - 574.78 -> 228.0 #load was on
    change_mode_every: 1 #Skips first reading after each change, so this will double the update interval. Default 8
    update_interval: 10s #10s setting => 20 second effective update rate for Power, 40 second for Current and Voltage. Default 60s

  # Reports the total Power so-far each day, resets at midnight, see https://esphome.io/components/sensor/total_daily_energy/
  - platform: total_daily_energy
    name: ${friendly_name} Total Daily Energy
    power_id: wattage
    filters:
      - multiply: 0.001 ## convert Wh to kWh
    unit_of_measurement: kWh

binary_sensor:
  # Reports if this device is Connected or not
  # - platform: status
  #   name: ${friendly_name} Status

  # Button on the side is pressed and then toggle relay
  - platform: gpio
    device_class: power
    pin:
      number: GPIO13
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
  # Output GPIOs for RGB led
  - platform: esp8266_pwm # Red
    id: red_output
    pin: GPIO0
  - platform: esp8266_pwm # Green
    id: green_output
    pin: GPIO4
  - platform: esp8266_pwm # Blue
    id: blue_output
    pin: GPIO2

light:
  # RGB light
  - platform: rgb
    name: ${friendly_name} Light
    id: rgb_light
    red: red_output
    green: green_output
    blue: blue_output
    default_transition_length: 0.5s
    restore_mode: ALWAYS_OFF
    effects: # List some effects
      - strobe
      - flicker
      - random

# Blink the red light if we aren't connected to WiFi. Could use https://esphome.io/components/status_led/ instead but then we couldn't use the red light for other things as well.
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
                id: rgb_light
                brightness: 100%
                red: 100%
                green: 0%
                blue: 0%
                flash_length: 250ms

script:
  - id: led_relay_off # Normal operation when relay is off
    then:
      - light.turn_off:
          id: rgb_light
  - id: led_power_on # Normal operation when relay is on
    then:
      - light.turn_on:
          id: rgb_light
          brightness: 80%
          red: 0%
          green: 100%
          blue: 50%
```
