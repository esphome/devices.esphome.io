---
title: WAVESHARE-6CH-RELAY
date-published: 2024-12-21
type: relay
standard: global
board: esp32
---

![Product](./image1.jpg "Product Image")

## Product description

This is a 6-relay board with an ESP32-S3 (N8).
It also has:-
Onboard isolated RS485,
Onboard 40PIN header compatible with some Raspberry Pi Pico HATs,
Built in buzzer,
RGB colorful LED,
Rail-mounted ABS case, easy to install, safe to use

Each relay has COM+NO+NC exposed. Rating ≤10A 250VAC/30VDC.
The board can be powered either via 7-36DC or via 5VDC (USB-C).
It can bought from: [https://www.waveshare.com/esp32-s3-relay-6ch.htm](https://www.waveshare.com/esp32-s3-relay-6ch.htm)

## GPIO Pinout

![GPIO](./image2.jpg "GPIO Image")

## Basic Config

```yaml
# Home Assistant ESPHome yaml config file for Waveshare ESP32 S3 6ch relay box
# 04/29/2026
# Your secrets file needs to have these entries:
# wifi_ssid: "SSID"
# wifi_password: "PASS"

esphome:
  name: waveshare-6ch-relay

esp32:
  variant: esp32s3
  flash_size: 8MB
  framework:
    type: arduino

# Enable logging
logger:
  level: DEBUG
api:
  actions:
  - action: rtttl_play
    variables:
      song_str: string
    then:
      - rtttl.play:
          rtttl: !lambda 'return song_str;'

ota:
  - platform: esphome
    id: zone_controller_ota

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

captive_portal:

web_server:
  port: 80

bluetooth_proxy:
  active: true

time:
  - platform: homeassistant
    id: homeassistant_time

binary_sensor:
  - platform: status
    name: "Status"

  - platform: gpio
    name: "Boot Button"
    pin:
      number: 0
      ignore_strapping_warning: true
      mode:
        input: true
      inverted: true
    disabled_by_default: true
    on_press:
      then:
        - button.press: restart_button

sensor:
  - platform: wifi_signal
    name: "WiFi Signal dB"
    update_interval: 60s
    
text_sensor:
  - platform: version
    name: "Firmware Version"
  - platform: wifi_info
    ip_address:
      name: "IP Address"
      entity_category: diagnostic
    ssid:
      name: "Connected SSID"
      entity_category: diagnostic
    mac_address:
      name: "Mac Address"
      entity_category: diagnostic        


switch:
  - platform: gpio
    pin: GPIO1
    id: relay1
    name: Relay 1
  - platform: gpio
    pin: GPIO2
    id: relay2
    name: Relay 2
  - platform: gpio
    pin: GPIO41
    id: relay3
    name: Relay 3
  - platform: gpio
    pin: GPIO42
    id: relay4
    name: Relay 4
  - platform: gpio
    pin:
      number: GPIO45
      ignore_strapping_warning: true
    id: relay5
    name: Relay 5
  - platform: gpio
    pin:
      number: GPIO46
      ignore_strapping_warning: true
    id: relay6
    name: Relay 6
  - platform: template
    name: Buzzer
    icon: mdi:volume-high
    turn_on_action:
      - rtttl.play:
          id: rtttl_buzzer
          rtttl: 'beep:d=4,o=5,b=100:16e6'
    turn_off_action:
      - rtttl.stop:
          id: rtttl_buzzer

uart:
  tx_pin: GPIO17
  rx_pin: GPIO18
  baud_rate: 9600
  id: modbus_uart

output:
  - platform: ledc
    pin: GPIO21
    id: buzzer_output

rtttl:
  output: buzzer_output
  id: rtttl_buzzer
  gain: 40%

light:
  - platform: esp32_rmt_led_strip
    chipset: ws2812
    pin: GPIO38
    num_leds: 1
    rgb_order: RGB
    name: "RGB LED"
    id: rgb_led

button:
  - platform: restart
    name: "Restart"
    id: restart_button
    entity_category: config

  - platform: factory_reset
    name: "Factory Reset"
    id: reset
    entity_category: config

  - platform: safe_mode
    name: "Safe Mode"
    internal: false
    entity_category: config
```
