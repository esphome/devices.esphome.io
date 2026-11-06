---
title: UltraPro WFD3001 3-Way Dimmer Switch
date-published: 2026-03-18
type: dimmer
standard: us
board: bk72xx
---

## Notes

The WFD3001 uses a BK7231N Wi-Fi chip (BK72xx family) with a secondary MCU that controls
the actual dimming hardware. Dimming commands are sent over UART to the secondary MCU; the
BK7231N does not directly drive the dimmer output.

**Flashing:** The BK7231N can be flashed via its UART pins using `ltchiptool` or `OpenBK`
tools. No disassembly beyond removing the wall plate is required to access the programming
header (1.27 mm pitch).

**3-way operation:** The switch communicates with a companion 3-way switch unit via an ADC
pin that reads the voltage on the traveler wire. When the companion switch changes state,
the ADC value crosses a threshold and toggles the primary light.

**Upper paddle behavior:**

| Action       | Result                                 |
| ------------ | -------------------------------------- |
| Single click | Toggle light on/off                    |
| Double click | Set brightness to Preset High          |
| Hold         | Dim up (5% per 100 ms)                 |

**Lower paddle behavior:**

| Action       | Result                                 |
| ------------ | -------------------------------------- |
| Single click | Toggle light on/off                    |
| Double click | Set brightness to Preset Low           |
| Hold         | Dim down (5% per 100 ms, floor at 1%) |

The blue status LED strobes while connecting to Wi-Fi and returns to steady state once
connected. It turns off when the light is on (so the switch is visible in the dark when
the light is off).

## GPIO Pinout

| Pin  | Function                                                              |
| ---- | --------------------------------------------------------------------- |
| P6   | Reset button (behind wall plate, active LOW; hold 5 s = factory reset) |
| P7   | Upper paddle button (active LOW)                                      |
| P8   | Lower paddle button (active LOW)                                      |
| P10  | UART RX (from secondary dimmer MCU)                                   |
| P11  | UART TX (to secondary dimmer MCU)                                     |
| P24  | Blue status LED (active HIGH)                                         |
| ADC3 | 3-way companion switch sense (analog voltage divider)                 |

## Basic Configuration

```yaml
substitutions:
  device_name: "ultrapro-wfd3001"

esphome:
  name: ${device_name}
  friendly_name: "UltraPro WFD3001 Dimmer"
  comment: "UltraPro WFD3001 3-Way Dimmer Switch"
  name_add_mac_suffix: true
  project:
    name: UltraPro.WFD3001
    version: 1.0.0
  on_boot: # Strobe blue LED while connecting to WiFi. wifi on_connect will stop it.
    priority: 600
    then:
      - light.turn_on:
          id: blue_led
          effect: strobe

bk72xx:
  board: generic-bk7231n-qfn32-tuya

logger:

api:

time:
  - platform: homeassistant
    id: homeassistant_time

ota:
  - platform: esphome

wifi:
  ap: {}
  on_connect: # Stop strobe when WiFi connects; matches current light state
    - light.turn_on:
        id: blue_led
        effect: none
  on_disconnect:
    - light.turn_on:
        id: blue_led
        effect: strobe

captive_portal:

# GPIO / Pin Mapping (BK7231N):
# P7  - Toggle button (upper paddle)      — active LOW
# P8  - Toggle button (lower paddle)      — active LOW
# P6  - Reset button (behind wall plate)  — active LOW, hold 5s = factory reset
# P24 - Blue status LED                   — active HIGH (on when light is OFF)
# P10 - UART RX (to dimmer MCU)
# P11 - UART TX (to dimmer MCU)
# Dimming is controlled via UART serial commands to the secondary MCU.

uart:
  baud_rate: 115200
  tx_pin: P11
  rx_pin: P10

output:
  - id: blue_ledout
    platform: gpio
    pin: P24

  - platform: template
    id: output_template
    type: float
    min_power: 0.1
    zero_means_zero: true
    write_action:
      - uart.write: !lambda return {0x65, 0xAA, 0x00, 0x01, 0x05, 0x00, 0x00, 0x00, (uint8_t)(state * 255), 0x00, (uint8_t)((277 + (uint8_t)(state * 255)) % 256)};

light:
  - platform: binary
    id: blue_led
    output: blue_ledout
    restore_mode: ALWAYS_ON
    effects:
      - strobe:

  - platform: monochromatic
    name: "Light"
    id: light_primary
    output: output_template
    restore_mode: RESTORE_DEFAULT_OFF
    on_turn_on:
      then:
        - light.turn_off: blue_led
    on_turn_off:
      then:
        - light.turn_on: blue_led

binary_sensor:
  - platform: gpio
    id: button_up
    pin:
      number: P7
      inverted: true
    on_multi_click:
      - timing: # double click → brightness_preset_high
          - ON for at most 350ms
          - OFF for at most 350ms
          - ON for at most 350ms
          - OFF for at least 350ms
        then:
          - light.turn_on:
              id: light_primary
              brightness: !lambda 'return id(brightness_preset_high).state / 100.0;'
      - timing: # single click → toggle
          - ON for at most 350ms
          - OFF for at least 350ms
        then:
          - light.toggle: light_primary
    on_press: # hold to dim up
      - delay: 0.35s
      - while:
          condition:
            binary_sensor.is_on: button_up
          then:
            - light.dim_relative:
                id: light_primary
                relative_brightness: 5%
                transition_length: 0.1s
            - delay: 0.1s

  - platform: gpio
    id: button_down
    pin:
      number: P8
      inverted: true
    on_multi_click:
      - timing: # double click → brightness_preset_low
          - ON for at most 350ms
          - OFF for at most 350ms
          - ON for at most 350ms
          - OFF for at least 350ms
        then:
          - light.turn_on:
              id: light_primary
              brightness: !lambda 'return id(brightness_preset_low).state / 100.0;'
      - timing: # single click → toggle
          - ON for at most 350ms
          - OFF for at least 350ms
        then:
          - light.toggle: light_primary
    on_press: # hold to dim down (floor at 1% so it never turns off)
      - delay: 0.35s
      - while:
          condition:
            binary_sensor.is_on: button_down
          then:
            if:
              condition:
                lambda: 'return(id(light_primary).remote_values.get_brightness() < 0.06);'
              then:
                - light.turn_on:
                    id: light_primary
                    brightness: 1%
                - delay: 0.1s
              else:
                - light.dim_relative:
                    id: light_primary
                    relative_brightness: -5%
                    transition_length: 0.1s
                - delay: 0.1s

  - platform: gpio
    id: button_reset
    pin:
      number: P6
      inverted: true
    on_press:
      - delay: 5s
      - if:
          condition:
            binary_sensor.is_on: button_reset
          then:
            - button.press: factory_reset_button

button:
  - platform: restart
    id: restart_button
    name: "Restart"
  - platform: safe_mode
    id: restart_button_safe_mode
    name: "Restart (Safe Mode)"
  - platform: factory_reset
    id: factory_reset_button
    name: "Factory Reset"
    disabled_by_default: true
    entity_category: config
    icon: mdi:restart-alert

number:
  - platform: template
    name: "Brightness Preset High"
    id: brightness_preset_high
    min_value: 1
    max_value: 100
    step: 1
    initial_value: 100
    restore_value: true
    optimistic: true
    unit_of_measurement: "%"
    entity_category: config
    icon: mdi:brightness-7
  - platform: template
    name: "Brightness Preset Low"
    id: brightness_preset_low
    min_value: 1
    max_value: 100
    step: 1
    initial_value: 30
    restore_value: true
    optimistic: true
    unit_of_measurement: "%"
    entity_category: config
    icon: mdi:brightness-4

sensor:
  - platform: wifi_signal
    name: "WiFi Signal"
    update_interval: 60s
  - platform: uptime
    name: "Uptime"
  - platform: adc
    pin: ADC3
    name: "3 Way Sense"
    update_interval: 60ms
    filters:
      - skip_initial: 4
      - exponential_moving_average:
          alpha: 0.1
          send_every: 8
          send_first_at: 8
      - delta: 0.005
    on_value_range:
      - below: 0.1350
        then:
          - light.toggle: light_primary
      - above: 0.1600
        then:
          - light.toggle: light_primary

text_sensor:
  - platform: version
    name: "ESPHome Version"
  - platform: wifi_info
    ip_address:
      name: "IP Address"
    mac_address:
      name: "MAC Address"
    ssid:
      name: "SSID Connected"
```
