---
title: Moes QS-WIFI-DS01
date-published: 2023-12-14
type: dimmer
standard: eu
board: esp8266
---

Single gang wifi dimmer

```yaml
substitutions:
  node_name: qs-wifi-ds01
  node_id: IP_name
  friendly_node_name: "Single Channel Dimmer"

esphome:
  name: ${node_name}
  comment: ${friendly_node_name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_pw
  power_save_mode: none

# Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: ${node_name} FB
    password: "fallback"

captive_portal:

# Enable Home Assistant API
api:
  encryption:
    key: !secret api_encryption

# Enable Over The Air updates
ota:

# Disable logging
logger:
  baud_rate: 0
  logs:
    sensor: ERROR
    duty_cycle: ERROR
    binary_sensor: ERROR
    light: ERROR

# Enable Web server.
web_server:
  port: 80

# Sync time with Home Assistant.
time:
  - platform: homeassistant
    id: ${node_id}_homeassistant_time

# Binary Sensors.
binary_sensor:
  - platform: status
    name: 8 Connection Status
    id: ${node_id}_connection_status
   #Binary sensor (on/off) which reads duty_cyle sensor readings.
  - platform: template
    id: switch1
    internal: true
    name: "${node_id} Switch Binary Sensor"
    # read duty_cycle, convert to on/off
    lambda: |-
      if (id(sensor_push_switch).state < 95.0) {
        return true;
      } else {
        return false;
      }
    # Short Click - toggle light only
    on_click:
      max_length: 300ms
      then:
        light.toggle: light_main
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
  - platform: wifi_signal
    name: ${friendly_node_name} WiFi Signal
    id: ${node_id}_wifi_signal
    update_interval: 60s
    # Primary template sensor to track Brightness of light object for "on_value" sending to MCU dimmer
  - platform: template
    name: "${node_id} Brightness Sensor"
    id: sensor_g_bright
    internal: true
    update_interval: 20ms
    # Ensure on_value only triggered when brightness (0-255) changes
    filters:
      delta: 0.8
    # Read brightness (0 - 1) from light , convert to (0-255) for MCU
    lambda: |-
      if (id(light_main).remote_values.is_on()) {
        return (int(id(light_main).remote_values.get_brightness() * 255));
      }
      else {
        return 0;
      }
    # On Change send to MCU via UART
    on_value:
      then:
        - uart.write: !lambda |-
            return {0xFF, 0x55, (char) id(sensor_g_bright).state, 0x05, 0xDC, 0x0A};
        - logger.log:
            level: INFO
            format: "Sensor Value Change sent to UART %3.1f"
            args: ["id(sensor_g_bright).state"]
  # Sensor to detect button push (via duty_cycle of 50hz mains signal)
  - platform: duty_cycle
    pin: GPIO13
    internal: true
    id: sensor_push_switch
    name: "${node_id} Sensor Push Switch"
    update_interval: 20ms

# Text Sensors.
text_sensor:
  - platform: template
    name: Uptime Human Readable
    id: uptime_human
    icon: mdi:clock-start
  - platform: version
    name: ${friendly_node_name} ESPHome Version
    id: ${node_id}_esphome_version
  - platform: wifi_info
    ip_address:
      name: ${friendly_node_name} IP Address
      id: ${node_id}_ip_address
      icon: mdi:ip-network

# Switches.
switch:
  - platform: restart
    name: ${friendly_node_name} Restart
    id: ${node_id}_restart
    icon: "mdi:restart"
  - platform: shutdown
    name: ${friendly_node_name} Shutdown
    id: ${node_id}_shutdown
  - platform: safe_mode
    name: ${friendly_node_name} Restart (Safe Mode)"
    id: ${node_id}_safe_mode


# Dummy light brightness tracker Global
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
    id: dummy_pwm

# Primary Light object exposed to HA
light:
  - platform: monochromatic
    default_transition_length: 20ms
    restore_mode: RESTORE_DEFAULT_OFF
    name: "${node_id} Light"
    output: dummy_pwm
    id: light_main

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
              float curr_bright = id(light_main).remote_values.get_brightness();
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
                auto call = id(light_main).turn_on();
                call.set_brightness(curr_bright + (2.0/255.0));
                call.perform();
              }
              else if(id(g_direction_1) == 1 && id(g_counter_1) > 15) {
                // Decrease Bright
                auto call = id(light_main).turn_on();
                call.set_brightness(curr_bright - (2.0/255.0));
                call.perform();
              }
```
