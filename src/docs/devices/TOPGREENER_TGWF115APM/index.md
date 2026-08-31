---
title: TOPGREENER TGWF115APM Smart Outlet with Energy Monitoring  
date-published: 2025-4-23  
type: plug  
standard: us  
board: esp8285  
difficulty: 4
---

![image](TGWF115APM_0001-4.png "TOPGREENER TGWF115APM Smart Outlet with Energy Monitoring")

## TOPGREENER TGWF115APM Smart Outlet with Energy Monitoring

This is for flashing a TOPGREENER TGWF115APM to ESPHome. This requires disassembling the device and soldering to pads on the board. Full instructions can be found on Reddit here: [www.reddit.com/r/Esphome/comments/1k6hyh3/topgreener_tgwf115apm_wifi_plug_esphome_install/](www.reddit.com/r/Esphome/comments/1k6hyh3/topgreener_tgwf115apm_wifi_plug_esphome_install/)

> [!NOTE]
> The YAML below was orignally made by [@cbpowell](https://github.com/cbpowell) from here: https://github.com/cbpowell/ESPSense/wiki/TOPGREENER-TGWF115APM
> I simply fixed the syntaxing and removed the ESPSense additions.

## ESPHome YAML

```yaml
# Configuration for TGWF115APM (Big 15A plug)
# Updated by Jwidess 4-23-2025

substitutions:
  plug_name: topgreener-apm
  # Plug state to set upon powerup (or after power loss)
  # See options here: https://esphome.io/components/switch/gpio.html
  restore_mode: ALWAYS_ON
  
  # Base calibration to 90W lightbulb, Kill-a-Watt between plug and wall
  # Detail calibration can be done with calibrate_linear sensor filters below
  current_res: "0.00228"
  voltage_div: "2120"
  # Increasing current_res reduces reported wattage
  # Increasing voltage_div increases reported voltage

esphome:
  name: ${plug_name}
  # Uses the ESPAsyncUDP library
  libraries:
    - "ESPAsyncUDP"
    - "ArduinoJson-esphomelib@5.13.3"

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_pass
  fast_connect: on

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${plug_name} Fallback"
    password: !secret ap_pass

ota:
  platform: esphome
  password: !secret ota_pass

safe_mode:

captive_portal:
  
# web_server:

# Logging
logger:
  # level: DEBUG
  baud_rate: 0 # Disable UART logging, we have no physical connections!

# Home Assistant API
# Comment out if not using API, but you'll also need to remove the total_daily_energy and
# time sensors below
api:

time:
  - platform: homeassistant
    id: homeassistant_time
    
binary_sensor:
  - platform: gpio
    pin:
      number: GPIO3
      inverted: True
    name: "${plug_name} Button"
    on_press:
      then:
        - switch.toggle: "relay"
        # Note that blue LED appears to be tied to relay state internally (i.e. electrically)
    
switch:
  # Main plug control relay
  - platform: gpio
    name: "${plug_name} Relay"
    id: "relay"
    pin: GPIO14
    restore_mode: ${restore_mode}
    
  # Used for Status LED below, but could be repurposed!
  # - platform: gpio
  #   name: "${plug_name} Green LED"
  #   id: "led_green"
  #   pin: GPIO13
  #   restore_mode: ALWAYS_ON
  
status_led:
  # Use Green LED as ESPHome's built-in status indicator
  pin:
    number: GPIO13
    inverted: False

sensor:
  - platform: hlw8012
    sel_pin:
      number: GPIO12
      inverted: True
    cf_pin: GPIO04
    cf1_pin: GPIO5
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}
    current:
      name: "${plug_name} Amperage"
      unit_of_measurement: A
      filters:
        # - calibrate_linear:
        #   # Map X (from sensor) to Y (true value)
        #   # At least 2 data points required
        #   - 0.0 -> 0.0
        #   - 1.0 -> 1.0 #load was on
    voltage:
      name: "${plug_name} Voltage"
      unit_of_measurement: V
      filters:
        # - calibrate_linear:
        #   # Map X (from sensor) to Y (true value)
        #   # At least 2 data points required
        #   - 0.0 -> 0.0
        #   - 1.0 -> 1.0 #load was on
    power:
      id: "wattage"
      name: "${plug_name} Wattage"
      unit_of_measurement: W
      filters:
        # Moving average filter to try and reduce a periodic drop of ~1-2W
        # Unsure of cause, may be a better solution!
        - sliding_window_moving_average:
            window_size: 2
            send_every: 1
        # - calibrate_linear:
        #   # Map X (from sensor) to Y (true value)
        #   # At least 2 data points required
        #   - 0.0 -> 0.0
        #   - 1.0 -> 1.0 #load was on
    change_mode_every: 8
    update_interval: 3s # Longer interval gives better accuracy
    
  - platform: total_daily_energy
    name: "${plug_name} Total Daily Energy"
    power_id: "wattage"
    filters:
        # Multiplication factor from W to kW is 0.001
        - multiply: 0.001
    unit_of_measurement: kWh

# Extra sensor to keep track of plug uptime
  - platform: uptime
    name: ${plug_name} Uptime Sensor
```
