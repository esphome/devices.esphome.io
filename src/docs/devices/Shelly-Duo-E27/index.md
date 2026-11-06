---
title: Shelly DUO E27
date-published: 2023-04-23
type: light
standard: us
board: esp8266
---

## GPIO Pinout

| Pin   | Function   |
| ----- | ---------- |
| GPIO4 | Temprature |
| GPIO5 | Brightness |

This template was made using [the Tasmota template](https://github.com/arendst/mgos-to-tasmota) with the
[GPIO conversion in the Tasmota docs](https://tasmota.github.io/docs/GPIO-Conversion/#gpio-conversion).

```yaml
esphome:
  name: your-name

esp8266:
  board: esp01_1m
  restore_from_flash: true

# Enable logging
logger:
# Enable Web Server to allow for direct access via IP Address
web_server:
  port: 80

# Enable Home Assistant API
api:

ota:
  password: !secret ota_password
  safe_mode: true

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "YourSSID"
    password: !fallback_password

captive_portal:

output:
  - platform: esp8266_pwm
    id: warm_white
    pin: GPIO4
  - platform: esp8266_pwm
    id: brightness
    pin: GPIO5

light:
  - platform: cwww
    name: Your device name
    warm_white: warm_white
    cold_white: brightness
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
```
