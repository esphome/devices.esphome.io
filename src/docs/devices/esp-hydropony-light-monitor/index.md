---
title: ESP-Hydropony Light Monitor
date-published: 2026-01-05
type: sensor
standard: global
board: esp32
project-url: https://sulfuroid.gumroad.com/l/hydroponics
made-for-esphome: false
difficulty: 2
---

## ESP-Hydropony Light Monitor

The ESP-Hydropony Light Monitor is a Wi-Fi enabled lux sensor designed for hydroponic and indoor growing environments.

The device measures ambient light using a BH1750 sensor and exposes the value locally over HTTP.
It is designed for users who prefer local-only monitoring without cloud dependency.

## Images

### Assembled device

![ESP-Hydropony Light Monitor assembled](device-assembled.jpg "ESP-Hydropony Light Monitor – assembled device")

### PCB

![ESP-Hydropony Light Monitor PCB](pcb.jpg "ESP-Hydropony Light Monitor – PCB")

### Lux display

![ESP-Hydropony Light Monitor lux display](display-lux.jpg "ESP-Hydropony Light Monitor – lux display")

## ESPHome Integration

The device exposes a JSON endpoint at `/json` returning a numeric lux value.

### Example response

```json
{
  "lux": 1234.5
}

```

```yaml
sensor:
  - platform: rest
    name: "Hydropony Lux"
    resource: http://DEVICE_IP/json
    value_template: "{{ value_json.lux }}"
    unit_of_measurement: "lx"
    device_class: illuminance

    scan_interval: 10s

