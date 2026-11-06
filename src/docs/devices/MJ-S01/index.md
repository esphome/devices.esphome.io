---
title: Martin Jerry Wall Switch MJ-S01
date-published: 2022-01-25
type: switch
standard: us
board: esp8266
---

[Amazon Link](https://www.amazon.com/dp/B07D8RKCYC)

## General Notes

This switch uses tuya so you can [use tuya-convert to flash ESPHome](/devices/tuya-convert).

**Note**: Newer versions (2025+) of this switch seem to use a locked CB3S module and might not be flashable; replacement
with an ESP8266 module may be required.

## GPIO Pinout

| Pin    | Function                   |
| ------ | -------------------------- |
| GPIO4  | led1 (inverted)            |
| GPIO5  | led2 (inverted)            |
| GPIO13 | main button (input_pullup) |
| GPIO12 | relay (inverted)           |

## Basic Configuration

```yaml
# Basic Config
---
substitutions:
  #   # https://esphome.io/guides/configuration-types/
  device_name: martin_jerry_mj_s01 # hostname & entity_id
  friendly_name: Martin Jerry MJ-S01 # Displayed in HA frontend
  ip_address: !secret martin_jerry_mj_s01_ip # use /config/esphome/secrets.yaml

esphome:
  # https://esphome.io/components/esphome
  name: ${device_name}

esp8266:
  board: esp01_1m
  restore_from_flash: true

wifi:
  # https://esphome.io/components/wifi/
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: ${ip_address}
    gateway: !secret wifigateway
    subnet: !secret wifisubnet
    dns1: !secret wifidns
  ap:
    ssid: ${friendly_name}_AP
    password: !secret wifi_password
    channel: 1
    manual_ip:
      static_ip: 192.168.1.1
      gateway: 192.168.1.1
      subnet: 255.255.255.0

web_server:
  port: 80
  # https://esphome.io/components/web_server/

logger:
  # https://esphome.io/components/logger/

api:
  encryption:
    key: !secret encryption_key
  # https://esphome.io/components/api/

ota:
  password: !secret esphome_ota_password
  # https://esphome.io/components/ota/

switch:
  # relay output
  - platform: gpio
    id: relay
    name: $friendly_name
    pin: GPIO12

    on_turn_on: #blue when on
      - switch.turn_on: blue_led
      - switch.turn_off: red_led

    on_turn_off: #purple when off
      - switch.turn_on: blue_led
      - switch.turn_on: red_led

  - platform: gpio
    # https://esphome.io/components/switch/gpio/
    pin: GPIO04
    id: red_led
    name: $friendly_name Red LED
    inverted: true

  - platform: gpio
    # https://esphome.io/components/switch/gpio/
    pin: GPIO05
    id: blue_led
    name: $friendly_name Blue LED
    inverted: true

binary_sensor:
  - platform: gpio
    # https://esphome.io/components/binary_sensor/gpio/
    pin:
      number: GPIO13
      mode: INPUT_PULLUP
    name: ${friendly_name} Main Button
    internal: True
    on_press:
      - switch.toggle: relay

button:
  - platform: restart
    id: restart_button
    name: $friendly_name Restart
    entity_category: diagnostic

text_sensor:
  - platform: version
    name: $friendly_name ESPHome Version
    id: esphome_version
    hide_timestamp: True
  - platform: wifi_info
    ip_address:
      id: ip_address
      name: $friendly_name IP Address
    mac_address:
      name: $friendly_name Mac
      id: mac_address

sensor:
  - platform: uptime
    name: $friendly_name Uptime Sensor
  - platform: wifi_signal
    name: $friendly_name wifi signal
```

## Fully-featured package ("SS01")

[@joshuaboniface](https://github.com/joshuaboniface) has created a fully-featured, packaged configuration for this
device,
which permits quick flashing with a pre-compiled binary as well as automatic adoption, deployment, and updates. This
requires
either an ESP8266-based version of the switch, or swapping out the CB3S module for an ESP8266 module (2025 purchase
version).

**Note**: The relay seems to have changed in the recent revisions of this switch (2025 purchase) and these do not seem
to
invert the relay pin any longer in my tests. If you use an older revision, you may need to tweak the configuration below
to account for this, though the author only has recent versions to test with.

[Github Project Link](https://github.com/joshuaboniface/martinjerry-esphome)
