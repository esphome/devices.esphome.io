---
title: Sonoff iFan03 (with Kickstart & Safety Stop)
date-published: 2026-01-11
type: misc
standard: global
board: esp8266
made-for-esphome: false
difficulty: 3
---

This configuration provides a complete firmware configuration for the **Sonoff iFan03** Ceiling Fan Controller (ESP8285).
It addresses common issues with motor inertia on low speeds and adds programmable functionality to the RF remote.

## Features & Improvements

1. **Motor Kickstart (Boost):** The iFan03 often struggles to start spinning on "Low" speed due to capacitor limitations
   and motor inertia. This config forces a "High" speed burst (4s) when transitioning from OFF to LOW/MED to overcome
   stiction, ensuring a smooth startup.

2. **Safety Stop Logic:** Includes a "break-before-make" delay (500ms) that turns off all relays before switching
   speeds. This protects the relays and capacitors from arcing and electrical stress.

3. **Smart Buzzer & Silent Mode:**
    * **Unified Feedback:** Audible feedback is triggered by state changes. You get confirmation beeps whether
      controlling the fan via the RF Remote or via Home Assistant.
    * **Silent Mode:** A `buzzer_enabled` substitution allows you to set this to `false` to completely mute the device.

4. **Spare RF Button:** The original RF remote "Buzzer" button (row 1, button 2) has been remapped as a
   `remote_spare_button` entity. This allows you to trigger Home Assistant automations without affecting the fan.

## GPIO Pinout

| GPIO | Component | Note |
| :--- | :--- | :--- |
| GPIO14 | Relay 1 | Speed control |
| GPIO12 | Relay 2 | Speed control |
| GPIO15 | Relay 3 | Speed control |
| GPIO09 | Relay Light | Light control |
| GPIO10 | Buzzer | Active High (Inverted logic in config) |
| GPIO03 | RF Receiver | RX Pin |

## Configuration

```yaml
substitutions:
  name: "living-fan"
  friendly_name: "Living Room Fan"
  comment: "Sonoff Ifan03 Fan Controller (ESP8285)"
  api_key: ""
  ota_password: ""
  wifi_ssid: !secret wifi_ssid
  wifi_password: !secret wifi_password
  on_boot_light: ALWAYS_OFF # or ALWAYS_ON
  buzzer_enabled: "true"  

globals:
  - id: last_speed
    type: int
    restore_value: no
    initial_value: '0'   # 0=OFF, 1=LOW, 2=MED, 3=HIGH

  - id: target_speed
    type: int
    restore_value: no
    initial_value: '0'

  - id: last_rf_ms
    type: uint32_t
    restore_value: no
    initial_value: '0'

esphome:
  name: $name
  comment: $comment
  friendly_name: $friendly_name
  on_boot:
    priority: -100
    then:
      - switch.turn_off: fan_relay1
      - switch.turn_off: fan_relay2
      - switch.turn_off: fan_relay3
      - lambda: |-
          id(last_speed) = 0;
          id(target_speed) = 0;

esp8266:
  board: esp8285

api:
  encryption:
    key: $api_key

ota:
  - platform: esphome
    password: $ota_password

wifi:
  ssid: $wifi_ssid
  password: $wifi_password
  min_auth_mode: WPA2  
  ap:
    ssid: "$name AP"
    password: $wifi_password

captive_portal:

logger:
  level: INFO
  baud_rate: 0
  logs:
    remote_receiver: WARN

sensor:
  - platform: wifi_signal
    name: "WiFi Signal"
    update_interval: 60s
    entity_category: diagnostic

button:
  - platform: restart
    name: "restart"
    entity_category: diagnostic
  
  - platform: template
    name: "Buzzer"
    id: buzzer
    on_press:
      - switch.turn_on: buzzer_switch
      - delay: 50ms
      - switch.turn_off: buzzer_switch

text_sensor:
  - platform: uptime
    name: "Uptime"
    entity_category: diagnostic

  - platform: version
    name: "ESPHome Version"
    hide_timestamp: true

  - platform: wifi_info
    ip_address:
      id: wifi_ip
      name: "IP Address"
      entity_category: diagnostic

output:
  - platform: gpio
    id: light_relay
    pin: GPIO9
    inverted: true

switch:
  - platform: gpio
    internal: True
    id: buzzer_switch
    name: "Buzzer"
    pin:
      number: GPIO10
      inverted: true

  - platform: gpio
    internal: true
    pin: GPIO14
    id: fan_relay1
    restore_mode: ALWAYS_OFF

  - platform: gpio
    internal: true
    pin: GPIO12
    id: fan_relay2
    restore_mode: ALWAYS_OFF

  - platform: gpio
    internal: true
    pin: GPIO15
    id: fan_relay3
    restore_mode: ALWAYS_OFF

light:
  - platform: binary
    name: "$friendly_name"
    output: light_relay
    id: ifan03_light
    restore_mode: $on_boot_light
    on_state:
      then:
        - script.execute: beep_feedback    

script:
  - id: fan_set_speed
    mode: restart
    then:
      # 1. Turn off if it was on
      - if:
          condition:
            lambda: 'return id(last_speed) != 0;'
          then:
            - switch.turn_off: fan_relay1
            - switch.turn_off: fan_relay2
            - switch.turn_off: fan_relay3
            - delay: 500ms

      # 2. BOOST only from OFF to LOW or MED
      - if:
          condition:
            lambda: |-
              return id(last_speed) == 0 &&
                     (id(target_speed) == 1 || id(target_speed) == 2);
          then:
            - switch.turn_on: fan_relay3
            - delay: 4s
            - switch.turn_off: fan_relay3
            - delay: 500ms

      # 3. Final velocity set
      - if:
          condition:
            lambda: 'return id(target_speed) == 1;'
          then:
            - switch.turn_on: fan_relay1

      - if:
          condition:
            lambda: 'return id(target_speed) == 2;'
          then:
            - switch.turn_on: fan_relay1
            - switch.turn_on: fan_relay2

      - if:
          condition:
            lambda: 'return id(target_speed) == 3;'
          then:
            - switch.turn_on: fan_relay3
      # 4. Store real state
      - lambda: |-
          id(last_speed) = id(target_speed);

  - id: beep_feedback
    mode: restart
    then:
      - if:
          condition:
            lambda: 'return ${buzzer_enabled};'
          then:
            - button.press: buzzer

  - id: rf_gate
    mode: single
    parameters:
      action: int
    then:
      - lambda: |-
          uint32_t now = millis();
          if (now - id(last_rf_ms) < 300) {
            return;
          }
          id(last_rf_ms) = now;

          switch (action) {
            case 0: { 
              auto call = id(ifan03_fan).turn_off();
              call.perform();
              break;
            }

            case 1: {
              auto call = id(ifan03_fan).turn_on();
              call.set_speed(1);
              call.perform();
              break;
            }

            case 2: {
              auto call = id(ifan03_fan).turn_on();
              call.set_speed(2);
              call.perform();
              break;
            }

            case 3: {
              auto call = id(ifan03_fan).turn_on();
              call.set_speed(3);
              call.perform();
              break;
            }

            case 4: {
              auto call = id(ifan03_light).toggle();
              call.perform();
              break;
            }

            case 5: {
              id(buzzer).press();
              break;
            }
            
          }

fan:
  - platform: template
    id: ifan03_fan
    name: "$friendly_name"
    speed_count: 3
    restore_mode: NO_RESTORE # important
    on_turn_on:
      - lambda: |-
          // If for any reason the speed is 0, we force 1 (Low).
          if (id(ifan03_fan).speed == 0) {
            id(target_speed) = 1;
          } else {
            // If it already have speed, we use it.
            id(target_speed) = id(ifan03_fan).speed;
          }
      - script.execute: fan_set_speed
      - script.execute: beep_feedback
    on_turn_off:
      - lambda: |-
          id(target_speed) = 0;
      - script.execute: fan_set_speed
      - script.execute: beep_feedback
    on_speed_set:
      - lambda: |-
          id(target_speed) = id(ifan03_fan).speed;
      - script.execute: fan_set_speed  
      - script.execute: beep_feedback

remote_receiver:
  pin: GPIO3

binary_sensor:
  # remote button row 3 button 1
  - platform: remote_receiver
    name: "Fan Off"
    id: remote_0
    raw:
      code: [-207, 104, -103, 104, -104, 103, -104, 207, -104, 103, -104, 104,
             -103, 104, -104, 103, -104, 105, -102, 104, -725, 104, -311, 103,
             -518, 104, -933, 103, -104, 104, -725, 104, -932, 104, -207, 207, -519]
    on_release:
      - script.execute:
          id: rf_gate
          action: 0
    internal: true
  # remote button row 3 button 2
  - platform: remote_receiver
    name: "Fan Low"
    id: remote_1
    raw:
      code: [-207, 104, -104, 103, -104, 104, -103, 207, -104, 104, -103, 104,
             -104, 103, -104, 104, -103, 104, -104, 103, -726, 103, -312, 103,
             -518, 104, -933, 103, -104, 104, -725, 104, -103, 104, -726, 103,
             -104, 311, -518]
    on_release:
      - script.execute:
          id: rf_gate
          action: 1
    internal: true
  # remote button row 2 button 2
  - platform: remote_receiver
    name: "Fan Medium"
    id: remote_2
    raw:
      code: [-208, 103, -104, 104, -103, 104, -103, 208, -103, 104, -104, 103,
             -104, 104, -103, 104, -104, 103, -104, 103, -726, 104, -310, 104,
             -518, 104, -933, 103, -104, 104, -725, 104, -207, 104, -622, 103,
             -416, 102, -415]
    on_release:
      - script.execute:
          id: rf_gate
          action: 2
    internal: true
  # remote button row 2 button 1
  - platform: remote_receiver
    name: "Fan High"
    id: remote_3
    raw:
      code: [-207, 104, -104, 103, -104, 104, -103, 208, -103, 104, -104, 103,
             -104, 104, -103, 104, -104, 103, -104, 103, -726, 104, -311, 104,
             -518, 103, -934, 103, -103, 104, -726, 103, -104, 207, -622, 104,
             -103, 104, -207, 104, -415]
    on_release:
      - script.execute:
          id: rf_gate
          action: 3
    internal: true
  # remote button row 1 button 1
  - platform: remote_receiver
    name: "Fan Light"
    id: remote_light
    raw:
      code: [-207, 104, -103, 104, -104, 103, -104, 207, -104, 103, -104, 104,
             -103, 104, -103, 104, -104, 103, -104, 104, -725, 104, -311, 103,
             -518, 104, -933, 103, -104, 103, -726, 103, -311, 104, -518, 104,
             -207, 104, -103, 104, -414]
    on_release:
      - script.execute:
          id: rf_gate
          action: 4
    internal: true
  # remote button row 1 button 2
  - platform: remote_receiver
    name: "Spare Button"
    id: remote_spare_button
    filters:
          - delayed_off: 200ms
    raw:
      code: [-207, 104, -103, 104, -104, 103, -104, 207, -104, 103, -104, 103,
             -104, 104, -103, 104, -103, 104, -104, 107, -721, 105, -206, 207,
             -518, 105, -931, 104, -104, 103, -725, 104, -104, 103, -725, 104,
             -104, 103, -207, 104, -414]
    on_release:
      - script.execute:
          id: rf_gate
          action: 5
```
