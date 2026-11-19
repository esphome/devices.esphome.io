---
title: Moes QS-WIFI-DS02
date-published: 2023-12-13
type: dimmer
standard: eu
board: esp8266
---

Dual gang wifi dimmer

```yaml
substitutions:
  node_name: qs-wifi-ds02
  friendly_node_name: "Dual Channel Dimmer"

esphome:
  name: ${node_name}
  comment: ${friendly_node_name}

esp8266:
  board: esp01_1m
  
# OTA flashing
ota:
  - platform: esphome

wifi: # Your Wifi network details
  
# Enable fallback hotspot in case wifi connection fails  
  ap:

# Enabling the logging component
logger:
  baud_rate: 0
  logs:
    sensor: ERROR
    duty_cycle: ERROR
    binary_sensor: ERROR
    light: ERROR

# Enable Home Assistant API
api:

# Enable the captive portal
captive_portal:

# Enable the Web Server component 
webserver:

# Sync time with Home Assistant.
time:
  - platform: homeassistant
    id: ${node_id}_homeassistant_time

# Binary Sensors.
binary_sensor:

    #Binary sensor (on/off) which reads duty_cyle sensor readings. CH1
  - platform: template
    id: switch1
    internal: true
    name: "${node_id} Switch Binary Sensor 1"
    # read duty_cycle, convert to on/off
    lambda: |-
      if (id(sensor_push_switch_1).state < 95.0) {
        return true;
      } else {
        return false;
      }
    # Short Click - toggle light only
    on_click:
      max_length: 300ms
      then:
        light.toggle: light_main_1
    # Generic On_Press - log press, toggle DIM Direction and reset press interval counter
    on_press:
      then:
        - logger.log: "Switch 1 Press"
        - lambda: |-
            if (id(g_direction_1) == 0) {
              id(g_direction_1) = 1;
            } else {
              id(g_direction_1) = 0;
            }
            id(g_counter_1) = 0;
  #Binary sensor (on/off) which reads duty_cyle sensor readings. CH2
  - platform: template
    id: switch2
    internal: true
    name: "${node_id} Switch Binary Sensor 2"
    # read duty_cycle, convert to on/off
    lambda: |-
      if (id(sensor_push_switch_2).state < 95.0) {
        return true;
      } else {
        return false;
      }
    # Short Click - toggle light only
    on_click:
      max_length: 300ms
      then:
        light.toggle: light_main_2
    # Generic On_Press - log press, toggle DIM Direction and reset press interval counter
    on_press:
      then:
        - logger.log: "Switch 2 Press"
        - lambda: |-
            if (id(g_direction_2) == 0) {
              id(g_direction_2) = 1;
            } else {
              id(g_direction_2) = 0;
            }
            id(g_counter_2) = 0;
# Sensors.
sensor:
  - platform: uptime
    name: Uptime Sensor
    id: uptime_sensor
    update_interval: 600s
    on_raw_value:
      then:
        - text_sensor.template.publish:
            id: uptime_human
            state: !lambda |-
              int seconds = round(id(uptime_sensor).raw_state);
              int days = seconds / (24 * 3600);
              seconds = seconds % (24 * 3600);
              int hours = seconds / 3600;
              seconds = seconds % 3600;
              int minutes = seconds /  60;
              seconds = seconds % 60;
              return (
                (days ? to_string(days) + "d " : "") +
                (hours ? to_string(hours) + "h " : "") +
                (minutes ? to_string(minutes) + "m " : "") +
                (to_string(seconds) + "s")
              ).c_str();

  # Primary template sensor to track Brightness of light object for "on_value" sending to MCU dimmer
  # CH1
  - platform: template
    name: "${node_id} Brightness Sensor CH1"
    id: sensor_g_bright_1
    internal: true
    update_interval: 20ms
    # Ensure on_value only triggered when brightness (0-255) changes
    filters:
      delta: 0.8
    # Read brightness (0 - 1) from light , convert to (0-255) for MCU
    lambda: |-
      if (id(light_main_1).remote_values.is_on()) {
        return (int(id(light_main_1).remote_values.get_brightness() * 255));
      }
      else {
        return 0;
      }
    # On Change send to MCU via UART
    on_value:
      then:
        - uart.write: !lambda |-
            return {0xFF, 0x55, 0x01, (char) id(sensor_g_bright_1).state, 0x00, 0x00, 0x00, 0x0A};
        - logger.log:
            level: INFO
            format: "CH1 Sensor Value Change sent to UART %3.1f"
            args: ["id(sensor_g_bright_1).state"]
  # Sensor to detect button push (via duty_cycle of 50hz mains signal)
  - platform: template
    name: "${node_id} Brightness Sensor CH2"
    id: sensor_g_bright_2
    internal: true
    update_interval: 20ms
    # Ensure on_value only triggered when brightness (0-255) changes
    filters:
      delta: 0.8
    # Read brightness (0 - 1) from light , convert to (0-255) for MCU
    lambda: |-
      if (id(light_main_2).remote_values.is_on()) {
        return (int(id(light_main_2).remote_values.get_brightness() * 255));
      }
      else {
        return 0;
      }
    # On Change send to MCU via UART
    on_value:
      then:
        - uart.write: !lambda |-
            return {0xFF, 0x55, 0x02, 0x00, (char) id(sensor_g_bright_2).state, 0x00, 0x00, 0x0A};
        - logger.log:
            level: INFO
            format: "CH2 Sensor Value Change sent to UART %3.1f"
            args: ["id(sensor_g_bright_2).state"]
  # Sensor to detect button push (via duty_cycle of 50hz mains signal)
  - platform: duty_cycle
    pin: GPIO13
    internal: true
    id: sensor_push_switch_1
    name: "${node_id} Sensor Push Switch 1"
    update_interval: 20ms
  - platform: duty_cycle
    pin: GPIO5
    internal: true
    id: sensor_push_switch_2
    name: "${node_id} Sensor Push Switch 2"
    update_interval: 20ms

globals:
  # Dim direction for Switch 1: 0=Up (brighten) 1=down (dim)
  - id: g_direction_1
    type: int
    restore_value: no
    initial_value: "1"
  # Counter for time pressed for switch 1
  - id: g_counter_1
    type: int
    restore_value: no
    initial_value: "0"
  # initial brightness
  # Dim direction for Switch 2: 0=Up (brighten) 1=down (dim)
  - id: g_direction_2
    type: int
    restore_value: no
    initial_value: "1"
  # Counter for time pressed for switch 2
  - id: g_counter_2
    type: int
    restore_value: no
    initial_value: "0"
  # initial brightness

# Uart definition to talk to MCU dimmer
uart:
  tx_pin: GPIO1
  rx_pin: GPIO3
  stop_bits: 1
  baud_rate: 9600

# Dummy light output to allow creation of light object
output:
  - platform: esp8266_pwm
    pin: GPIO14
    frequency: 800 Hz
    id: dummy_pwm1
  - platform: esp8266_pwm
    pin: GPIO16
    frequency: 800 Hz
    id: dummy_pwm2

# Primary Light object exposed to HA
light:
  - platform: monochromatic
    default_transition_length: 20ms
    restore_mode: RESTORE_DEFAULT_OFF
    name: "${node_id} Light 1"
    output: dummy_pwm1
    id: light_main_1
  - platform: monochromatic
    default_transition_length: 20ms
    restore_mode: RESTORE_DEFAULT_OFF
    name: "${node_id} Light 2"
    output: dummy_pwm2
    id: light_main_2

# Polling object for long press handling of switch for dim/brighten cycle
interval:
  - interval: 20ms
    then:
      - if:
          condition:
            binary_sensor.is_on: switch1
          then:
            # Ramp rate for dim is product of interval (20ms) * number of intervals
            # Every 20ms Dimmer is increased/decreased by 2/255
            # Lower limit = 10%
            # Upper limit = 100%
            # 100% - 10% = 90% = 230/255. Therefore 230/2 * 20ms = 2.3 seconds for full range
            # At full/min brightness - further 16x20ms = 0.32 Seconds "dwell" by resetting counter to 0
            # Initial pause for 16x20ms = 0.32s to allow "on_click" to be discounted 1st
            # g_direction_1 = 0 (Increasing brightness)
            # g_direction_1 = 1 (decreasing brightness)
            # g_counter_1 = Interval pulse counter

            lambda: |-
              float curr_bright = id(light_main_1).remote_values.get_brightness();
              id(g_counter_1) += 1;
              // If max bright, change direction
              if (curr_bright >= 0.999 && id(g_direction_1) == 0) {
                id(g_direction_1) = 1;
                id(g_counter_1) = 0;
              }
              // If below min_bright, change direction
              if (curr_bright < 0.1 && id(g_direction_1) == 1) {
                id(g_direction_1) = 0;
                id(g_counter_1) = 0;
              }
              if (id(g_direction_1) == 0 && id(g_counter_1) > 15) {
                // Increase Bright
                auto call = id(light_main_1).turn_on();
                call.set_brightness(curr_bright + (2.0/255.0));
                call.perform();
              }
              else if(id(g_direction_1) == 1 && id(g_counter_1) > 15) {
                // Decrease Bright
                auto call = id(light_main_1).turn_on();
                call.set_brightness(curr_bright - (2.0/255.0));
                call.perform();
              }
      - if:
          condition:
            binary_sensor.is_on: switch2
          then:
            # Ramp rate for dim is product of interval (20ms) * number of intervals
            # Every 20ms Dimmer is increased/decreased by 2/255
            # Lower limit = 10%
            # Upper limit = 100%
            # 100% - 10% = 90% = 230/255. Therefore 230/2 * 20ms = 2.3 seconds for full range
            # At full/min brightness - further 16x20ms = 0.32 Seconds "dwell" by resetting counter to 0
            # Initial pause for 16x20ms = 0.32s to allow "on_click" to be discounted 1st
            # g_direction_1 = 0 (Increasing brightness)
            # g_direction_1 = 1 (decreasing brightness)
            # g_counter_1 = Interval pulse counter

            lambda: |-
              float curr_bright = id(light_main_2).remote_values.get_brightness();
              id(g_counter_2) += 1;
              // If max bright, change direction
              if (curr_bright >= 0.999 && id(g_direction_2) == 0) {
                id(g_direction_2) = 1;
                id(g_counter_2) = 0;
              }
              // If below min_bright, change direction
              if (curr_bright < 0.1 && id(g_direction_2) == 1) {
                id(g_direction_2) = 0;
                id(g_counter_2) = 0;
              }
              if (id(g_direction_2) == 0 && id(g_counter_2) > 15) {
                // Increase Bright
                auto call = id(light_main_2).turn_on();
                call.set_brightness(curr_bright + (2.0/255.0));
                call.perform();
              }
              else if(id(g_direction_2) == 1 && id(g_counter_2) > 15) {
                // Decrease Bright
                auto call = id(light_main_2).turn_on();
                call.set_brightness(curr_bright - (2.0/255.0));
                call.perform();
              }
```
