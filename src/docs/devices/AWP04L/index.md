---
title: AWP04L Power Monitoring Plug
date-published: 2019-10-15
type: plug
standard: us
board: esp8266
---

These devices come with different brands, but all have AWP04L serial number on the back sticker. FCC-ID is
[2ANOO-SM800](https://fccid.io/2ANOO-SM800).

This template has been updated with "comment:" and "captive_portal:" feautures added in ESPHome v. 1.14

## GPIO Pinout

| Pin    | Function                     |
| ------ | ---------------------------- |
| GPIO0  | Status LED - Red (inverted)  |
| GPIO3  | sel_pin hlw8012 (inverted)   |
| GPIO5  | cf_pin hlw8012               |
| GPIO12 | Relay                        |
| GPIO13 | Button (inverted)            |
| GPIO14 | cf1_pin hlw8012              |
| GPIO15 | Status LED - Blue (inverted) |

## Basic Configuration

```yaml
# Basic Config

substitutions:
  device_name: awp_plug
  device_description: Energy Monitoring Smart Plug with button, blue LED, and red LED.
  friendly_name: AWP04L Plug

esphome:
  name: ${device_name}
  comment: ${device_description}

esp8266:
  board: esp01_1m
  restore_from_flash: true #writes each state change to flash for switch or light with restore_mode: RESTORE_DEFAULT_OFF/ON, see https://esphome.io/components/esphome/#configuration-variables-3

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Enable logging
logger:
  baud_rate: 0 #disable UART logging since we aren't connected to GPIO1 TX

# Enable Home Assistant API
api:

# Enable OTA updates
ota:

# Enable web server
web_server:
  port: 80

# Enable time component for use by daily power sensor
time:
  - platform: homeassistant
    id: homeassistant_time

binary_sensor:
  # Reports when the button is pressed
  - platform: gpio
    device_class: power
    pin:
      number: GPIO13
      inverted: True
    name: ${friendly_name} Button
    on_press:
      - switch.toggle: relay

  # Reports if this device is Connected or not
  - platform: status
    name: ${friendly_name} Status

sensor:
  # Reports the WiFi signal strength
  - platform: wifi_signal
    name: ${friendly_name} Signal
    update_interval: 60s

  # Reports how long the device has been powered (in minutes)
  - platform: uptime
    name: ${friendly_name} Uptime
    filters:
      - lambda: return x / 60.0;
    unit_of_measurement: minutes

  # Reports the Current, Voltage, and Power used by the plugged-in device (not counting this plug's own usage of about 0.8W/0.019A, so subtract those when calibrating with this plugged into a Kill-A-Watt type meter)
  - platform: hlw8012
    sel_pin:
      number: GPIO3
      inverted: True
    cf_pin: GPIO5
    cf1_pin: GPIO14
    current_resistor: 0.001 #The value of the shunt resistor for current measurement. Defaults to the Sonoff POW’s value 0.001 ohm. Verified on https://fccid.io/2ANOO-SM800/Internal-Photos/Internal-Photos-3601477 that we use "R001" = 0.001 ohm
    voltage_divider: 2401 #The value of the voltage divider on the board as (R_upstream + R_downstream) / R_downstream. Defaults to the Sonoff POW’s value 2351. From the pic we use 2x "125" = 2x 1.2Mohm for R_upstream and "102" = 1kohm for R_downstream, so (1,200,000+1,200,000+1,000)/1,000 = 2401
    # but those don't fix the measurement values, probably because we actually have a BL0937 chip instead of a HLW8012, (and part variance aswell) so we have to manually calibrate with a known load or a load and a Kill-A-Watt type meter. My values used below will only be +/-10% of yours I think.
    power:
      name: ${friendly_name} Power
      unit_of_measurement: W
      id: wattage
      filters:
        - calibrate_linear:
            # Map 0.0 (from sensor) to 0.0 (true value)
            - 0.0 -> 0.0 #Need to keep 0 mapped to 0 for when connected device is not drawing any power
            - 4054.3 -> 721.2 #Tested using a meter and 722.0W toaster -0.8W from just this plug with toaster off
    current:
      name: ${friendly_name} Current
      unit_of_measurement: A
      filters:
        - calibrate_linear:
            # Map 0.0 (from sensor) to 0.0 (true value)
            - 0.0 -> 0.0 #Need to keep 0 mapped to 0 for when connected device is not drawing any power
            - 7.4 -> 6.103 #Tested using a meter and 6.122A toaster -0.019A from just this plug with toaster off
    voltage:
      name: ${friendly_name} Voltage
      unit_of_measurement: V
      filters:
        - calibrate_linear:
            # Map 0.0 (from sensor) to 0.0 (true value)
            #- 0.0 -> 0.0 #Don't care if 0 reading aligns with 0 real Volts since we won't ever measure that
            - 294.7 -> 117.8 #Tested using a meter, value while connected toaster was on
            - 321.7 -> 121.6 #value while connected toaster was off
    change_mode_every: 1 #Skips first reading after each change, so this will double the update interval. Default 8
    update_interval: 10s #20 second effective update rate for Power, 40 second for Current and Voltage. Default 60s

  # Reports the total Power so-far each day, resets at midnight, see https://esphome.io/components/sensor/total_daily_energy/
  - platform: total_daily_energy
    name: ${friendly_name} Total Daily Energy
    power_id: wattage
    filters:
      - multiply: 0.001 ## convert Wh to kWh
    unit_of_measurement: kWh

text_sensor:
  # Reports the ESPHome Version with compile date
  - platform: version
    name: ${friendly_name} ESPHome Version

switch:
  - platform: gpio
    name: ${friendly_name}
    pin: GPIO12
    id: relay
    restore_mode: RESTORE_DEFAULT_OFF #Try to restore relay state after reboot/power-loss event.
    #RESTORE_DEFAULT_OFF (Default) - Attempt to restore state and default to OFF if not possible to restore. Uses flash write cycles.
    #RESTORE_DEFAULT_ON - Attempt to restore state and default to ON. Uses flash write cycles.
    #ALWAYS_OFF - Always initialize the pin as OFF on bootup. Does not use flash write cycles.
    #ALWAYS_ON - Always initialize the pin as ON on bootup. Does not use flash write cycles.
    on_turn_on:
      - light.turn_on:
          id: blue_led
          brightness: 100%
    on_turn_off:
      - light.turn_off: blue_led

output:
  - platform: esp8266_pwm
    id: red_output
    pin: GPIO0
    inverted: True
  - platform: esp8266_pwm
    id: blue_output
    pin: GPIO15
    inverted: True

light:
  - platform: monochromatic
    name: ${friendly_name} Red LED
    output: red_output
    id: red_led
    restore_mode: ALWAYS_OFF #Start with light off after reboot/power-loss event.
    #RESTORE_DEFAULT_OFF (Default) - Attempt to restore state and default to OFF if not possible to restore. Uses flash write cycles.
    #RESTORE_DEFAULT_ON - Attempt to restore state and default to ON. Uses flash write cycles.
    #ALWAYS_OFF - Always initialize the pin as OFF on bootup. Does not use flash write cycles.
    #ALWAYS_ON - Always initialize the pin as ON on bootup. Does not use flash write cycles.
    effects:
      - strobe:
      - flicker:
          alpha: 50% #The percentage that the last color value should affect the light. More or less the “forget-factor” of an exponential moving average. Defaults to 95%.
          intensity: 50% #The intensity of the flickering, basically the maximum amplitude of the random offsets. Defaults to 1.5%.
      - lambda:
          name: Throb
          update_interval: 1s
          lambda: |-
            static int state = 0;
            auto call = id(red_led).turn_on();
            // Transtion of 1000ms = 1s
            call.set_transition_length(1000);
            if (state == 0) {
              call.set_brightness(1.0);
            } else {
              call.set_brightness(0.01);
            }
            call.perform();
            state += 1;
            if (state == 2)
              state = 0;
  - platform: monochromatic
    name: ${friendly_name} Blue LED
    output: blue_output
    id: blue_led
    restore_mode: ALWAYS_OFF #Start with light off after reboot/power-loss event.
    #RESTORE_DEFAULT_OFF (Default) - Attempt to restore state and default to OFF if not possible to restore. Uses flash write cycles.
    #RESTORE_DEFAULT_ON - Attempt to restore state and default to ON. Uses flash write cycles.
    #ALWAYS_OFF - Always initialize the pin as OFF on bootup. Does not use flash write cycles.
    #ALWAYS_ON - Always initialize the pin as ON on bootup. Does not use flash write cycles.
    effects:
      - strobe:
      - flicker:
          alpha: 50% #The percentage that the last color value should affect the light. More or less the “forget-factor” of an exponential moving average. Defaults to 95%.
          intensity: 50% #The intensity of the flickering, basically the maximum amplitude of the random offsets. Defaults to 1.5%.
      - lambda:
          name: Throb
          update_interval: 1s
          lambda: |-
            static int state = 0;
            auto call = id(blue_led).turn_on();
            // Transtion of 1000ms = 1s
            call.set_transition_length(1000);
            if (state == 0) {
              call.set_brightness(1.0);
            } else {
              call.set_brightness(0.01);
            }
            call.perform();
            state += 1;
            if (state == 2)
              state = 0;

# Blink the red light if we aren't connected to WiFi. Could use https://esphome.io/components/status_led/ instead but then we couldn't use the red light for other things as well.
interval:
  - interval: 500ms
    then:
      - if:
          condition:
            not:
              wifi.connected:
          then:
            - light.turn_on:
                id: red_led
                brightness: 100%
                transition_length: 0s
            - delay: 250ms
            - light.turn_off:
                id: red_led
                transition_length: 250ms
```

Note: You will want to exclude the red_led and blue_led lights from your recorder componant, especially if you use the
included Throb custom animation, since that would fill your database with the on/off blinking status updates.

## Split Configuration

If you have several of these plugs, you may prefer to keep the shared code in one file and only put the device-specific
code in the files for each plug.

In plug_common.yaml:

```yaml
# Common code for AWP04L plugs

esphome:
  name: ${device_name}
  comment: ${device_description}

esp8266:
  board: esp01_1m
  restore_from_flash: true #writes each state change to flash for switch or light with restore_mode: RESTORE_DEFAULT_OFF/ON, see https://esphome.io/components/esphome/#configuration-variables-3

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Enable logging
logger:
  baud_rate: 0 #disable UART logging since we aren't connected to GPIO1 TX

# Enable Home Assistant API
api:

# Enable OTA updates
ota:

# Enable web server
web_server:
  port: 80

# Enable time component for use by daily power sensor
time:
  - platform: homeassistant
    id: homeassistant_time

binary_sensor:
  # Reports when the button is pressed
  - platform: gpio
    device_class: power
    pin:
      number: GPIO13
      inverted: True
    name: ${friendly_name} Button
    on_press:
      - switch.toggle: relay

  # Reports if this device is Connected or not
  - platform: status
    name: ${friendly_name} Status

sensor:
  # Reports the WiFi signal strength
  - platform: wifi_signal
    name: ${friendly_name} Signal
    update_interval: 60s

  # Reports how long the device has been powered (in minutes)
  - platform: uptime
    name: ${friendly_name} Uptime
    filters:
      - lambda: return x / 60.0;
    unit_of_measurement: minutes

  # Reports the Current, Voltage, and Power used by the plugged-in device (not counting this plug's own usage of about 0.8W/0.019A, so subtract those when calibrating with this plugged into a Kill-A-Watt type meter)
  - platform: hlw8012
    sel_pin:
      number: GPIO3
      inverted: True
    cf_pin: GPIO5
    cf1_pin: GPIO14
    current_resistor: 0.001 #The value of the shunt resistor for current measurement. Defaults to the Sonoff POW’s value 0.001 ohm. Verified on https://fccid.io/2ANOO-SM800/Internal-Photos/Internal-Photos-3601477 that we use "R001" = 0.001 ohm
    voltage_divider: 2401 #The value of the voltage divider on the board as (R_upstream + R_downstream) / R_downstream. Defaults to the Sonoff POW’s value 2351. From the pic we use 2x "125" = 2x 1.2Mohm for R_upstream and "102" = 1kohm for R_downstream, so (1,200,000+1,200,000+1,000)/1,000 = 2401
    # but those don't fix the measurement values, probably because we actually have a BL0937 chip instead of a HLW8012, (and part variance aswell) so we have to manually calibrate with a known load or a load and a Kill-A-Watt type meter. My values used below will only be +/-10% of yours I think.
    power:
      name: ${friendly_name} Power
      unit_of_measurement: W
      id: wattage
      filters:
        - calibrate_linear:
            # Map 0.0 (from sensor) to 0.0 (true value)
            - 0.0 -> 0.0 #Need to keep 0 mapped to 0 for when connected device is not drawing any power
            - ${wattage_calibration}
    current:
      name: ${friendly_name} Current
      unit_of_measurement: A
      filters:
        - calibrate_linear:
            # Map 0.0 (from sensor) to 0.0 (true value)
            - 0.0 -> 0.0 #Need to keep 0 mapped to 0 for when connected device is not drawing any power
            - ${amperage_calibration}
    voltage:
      name: ${friendly_name} Voltage
      unit_of_measurement: V
      filters:
        - calibrate_linear:
            # Map 0.0 (from sensor) to 0.0 (true value)
            #- 0.0 -> 0.0 #Don't care if 0 reading aligns with 0 real Volts since we won't ever measure that
            - ${voltage_calibration1}
            - ${voltage_calibration2}
    change_mode_every: 1 #Skips first reading after each change, so this will double the update interval. Default 8
    update_interval: 10s #20 second effective update rate for Power, 40 second for Current and Voltage. Default 60s

  # Reports the total Power so-far each day, resets at midnight, see https://esphome.io/components/sensor/total_daily_energy/
  - platform: total_daily_energy
    name: ${friendly_name} Total Daily Energy
    power_id: wattage
    filters:
      - multiply: 0.001 ## convert Wh to kWh
    unit_of_measurement: kWh

text_sensor:
  # Reports the ESPHome Version with compile date
  - platform: version
    name: ${friendly_name} ESPHome Version

switch:
  - platform: gpio
    name: ${friendly_name}
    pin: GPIO12
    id: relay
    restore_mode: RESTORE_DEFAULT_OFF #Try to restore relay state after reboot/power-loss event.
    #RESTORE_DEFAULT_OFF (Default) - Attempt to restore state and default to OFF if not possible to restore. Uses flash write cycles.
    #RESTORE_DEFAULT_ON - Attempt to restore state and default to ON. Uses flash write cycles.
    #ALWAYS_OFF - Always initialize the pin as OFF on bootup. Does not use flash write cycles.
    #ALWAYS_ON - Always initialize the pin as ON on bootup. Does not use flash write cycles.
    on_turn_on:
      - light.turn_on:
          id: blue_led
          brightness: 100%
    on_turn_off:
      - light.turn_off: blue_led

output:
  - platform: esp8266_pwm
    id: red_output
    pin: GPIO0
    inverted: True
  - platform: esp8266_pwm
    id: blue_output
    pin: GPIO15
    inverted: True

light:
  - platform: monochromatic
    name: ${friendly_name} Red LED
    output: red_output
    id: red_led
    restore_mode: ALWAYS_OFF #Start with light off after reboot/power-loss event.
    #RESTORE_DEFAULT_OFF (Default) - Attempt to restore state and default to OFF if not possible to restore. Uses flash write cycles.
    #RESTORE_DEFAULT_ON - Attempt to restore state and default to ON. Uses flash write cycles.
    #ALWAYS_OFF - Always initialize the pin as OFF on bootup. Does not use flash write cycles.
    #ALWAYS_ON - Always initialize the pin as ON on bootup. Does not use flash write cycles.
    effects:
      - strobe:
      - flicker:
          alpha: 50% #The percentage that the last color value should affect the light. More or less the “forget-factor” of an exponential moving average. Defaults to 95%.
          intensity: 50% #The intensity of the flickering, basically the maximum amplitude of the random offsets. Defaults to 1.5%.
      - lambda:
          name: Throb
          update_interval: 1s
          lambda: |-
            static int state = 0;
            auto call = id(red_led).turn_on();
            // Transtion of 1000ms = 1s
            call.set_transition_length(1000);
            if (state == 0) {
              call.set_brightness(1.0);
            } else {
              call.set_brightness(0.01);
            }
            call.perform();
            state += 1;
            if (state == 2)
              state = 0;
  - platform: monochromatic
    name: ${friendly_name} Blue LED
    output: blue_output
    id: blue_led
    restore_mode: ALWAYS_OFF #Start with light off after reboot/power-loss event.
    #RESTORE_DEFAULT_OFF (Default) - Attempt to restore state and default to OFF if not possible to restore. Uses flash write cycles.
    #RESTORE_DEFAULT_ON - Attempt to restore state and default to ON. Uses flash write cycles.
    #ALWAYS_OFF - Always initialize the pin as OFF on bootup. Does not use flash write cycles.
    #ALWAYS_ON - Always initialize the pin as ON on bootup. Does not use flash write cycles.
    effects:
      - strobe:
      - flicker:
          alpha: 50% #The percentage that the last color value should affect the light. More or less the “forget-factor” of an exponential moving average. Defaults to 95%.
          intensity: 50% #The intensity of the flickering, basically the maximum amplitude of the random offsets. Defaults to 1.5%.
      - lambda:
          name: Throb
          update_interval: 1s
          lambda: |-
            static int state = 0;
            auto call = id(blue_led).turn_on();
            // Transtion of 1000ms = 1s
            call.set_transition_length(1000);
            if (state == 0) {
              call.set_brightness(1.0);
            } else {
              call.set_brightness(0.01);
            }
            call.perform();
            state += 1;
            if (state == 2)
              state = 0;

# Blink the red light if we aren't connected to WiFi. Could use https://esphome.io/components/status_led/ instead but then we couldn't use the red light for other things as well.
interval:
  - interval: 500ms
    then:
      - if:
          condition:
            not:
              wifi.connected:
          then:
            - light.turn_on:
                id: red_led
                brightness: 100%
                transition_length: 0s
            - delay: 250ms
            - light.turn_off:
                id: red_led
                transition_length: 250ms
```

Then in each plug's yaml:

```yaml
substitutions:
  device_name: plug6
  device_description: Energy Monitoring Smart Plug connected to clothes washing machine in laundry room.
  friendly_name: Plug 6
  wattage_calibration: "4054.3 -> 721.2" #Tested using a meter and 722.0W toaster -0.8W from just this plug with toaster off
  amperage_calibration: "7.4 -> 6.103" #Tested using a meter and 6.122A toaster -0.019A from just this plug with toaster off
  voltage_calibration1: "294.7 -> 117.8" #Tested using a meter, value while connected toaster was on
  voltage_calibration2: "321.7 -> 121.6" #value while connected toaster was off

<<: !include plug_common.yaml
```
