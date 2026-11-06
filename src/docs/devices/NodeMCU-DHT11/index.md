---
title: NodeMCU ESP8266 with Temperature & Humidity Sensor (DHT11)
date-published: 2019-10-13
type: sensor
standard: global
board: esp8266
---

## GPIO Pinout

| Pin   | Function                     |
| ----- | ---------------------------- |
| GPIO5 | Temperature & Humidity Input |

This Configuration uses "substitutions" to enable you to have multiple devices of the same type
while allowing you to only need to change a minimal device specific yaml configfuration file
by adding specified substutions.

Then at compile time the two files are merged.

## Device Specific Configuration (Substitution) Yaml File

```yaml
substitutions:
  name: nodemcu_lr
  ip: 192.168.1.21
  friendly_name: Livingroom Sensor
  friendly_name_temp: Livingroom Temperature
  friendly_name_humidity: Livingroom Humidity
<<: !include common_nodemcu_dht11.yaml
```

## Common Configuration File (common_nodemcu_dht11.yaml)

```yaml
esphome:
  name: ${name}

esp8266:
  board: nodemcuv2

wifi:
  #hostname: ${name}
  ssid: !secret wifi_ssid
  password: !secret wifi_pwd
  fast_connect: true
  manual_ip:
    static_ip: ${ip}
    gateway: 192.168.1.1
    subnet: 255.255.255.0

logger:

api:
  # encryption:
  #  key: !secret encryption_key

ota:
  #password: !secret esphome_ota_pwd

switch:
  - platform: restart
    name: ${friendly_name} Restart

sensor:
  - platform: dht
    pin: D3 #GPIO5
    temperature:
      name: ${friendly_name_temp}
      filters:
        - filter_out: nan
        - heartbeat: 15s
        - sliding_window_moving_average:
            window_size: 2
            send_every: 2
            send_first_at: 1
        - lambda: return x * (9.0/5.0) + 32.0; # report temperature in Fahrenheit
      unit_of_measurement: "°F"
    humidity:
      name: ${friendly_name_humidity}
      filters:
        - filter_out: nan
        - heartbeat: 15s
        - sliding_window_moving_average:
            window_size: 2
            send_every: 2
            send_first_at: 1
      accuracy_decimals: 1 # humidity gets 0 decimals by default
    model: DHT11
    update_interval: 60s

  - platform: wifi_signal
    name: ${friendly_name} WiFi Signal Strength
    update_interval: 60s

text_sensor:
  - platform: version
    name: ${friendly_name} ESPHome Version
```
