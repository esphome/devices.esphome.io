---
title: Shelly 1 Gen4
date-published: 2026-03-30
type: relay
standard: global
board: esp32
---

![Shelly 1 Gen4](shelly-1-gen4.webp)

The **Shelly 1 Gen4** is a smart relay equipped with **Dry Contacts** (potential-free)
and powered by the new ESP32-C6 chip.

⚠️ **Important Note:** This is the standard Shelly 1 Gen4 model. It **DOES NOT** feature Power
Metering (PM). Because it uses dry contacts, the relay is galvanically isolated from the power
supply, making it ideal for automating garage doors, gates, boilers, or switching different
voltages (AC or DC). If you need to measure energy consumption, you should look for the
[Shelly 1PM Gen4](/devices/shelly-1pm-gen-4).

## ESPHome Configuration

Below is a complete ESPHome configuration for the Shelly 1 Gen4. It sets up the relay,
the external switch input, the internal device button, the status LED, and the internal
temperature sensor.

```yaml
substitutions:
  device_name: "shelly-1-gen4"
  friendly_name: "Shelly 1 Gen4"

esphome:
  name: ${device_name}
  friendly_name: ${friendly_name}

esp32:
  board: esp32-c6-devkitm-1
  framework:
    type: esp-idf
    version: recommended
  flash_size: 8MB

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: on

  ap:
    ssid: "${friendly_name} Hotspot"
    password: !secret hotspot_password
    ap_timeout: 5min

web_server:
  port: 80
  version: 2
  auth:
    username: !secret web_server_username
    password: !secret web_server_password

api:
  encryption:
    key: !secret api_key

ota:
  platform: esphome
  password: !secret ota_password

logger:
  level: DEBUG
  hardware_uart: USB_SERIAL_JTAG

switch:
  - platform: gpio
    name: "Relay"
    id: relay_1
    pin: GPIO5
    restore_mode: RESTORE_DEFAULT_OFF

sensor:
  - platform: internal_temperature
    name: "Internal Temperature"

binary_sensor:
  - platform: gpio
    name: "Switch Input"
    pin: 
      number: 10
    filters:
      - delayed_on_off: 50ms
    on_press:
      then:
        - switch.toggle: relay_1

  - platform: gpio
    name: "Device Button"
    pin:
      number: 4
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - switch.toggle: relay_1

status_led:
  pin:
    number: 0
    inverted: true

button:
  - platform: restart
    name: "Restart ${friendly_name}"
```
