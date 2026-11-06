---
title: Rowi 2 ESP32-based Smart Plug AU, NZ, EU
date-published: 2026-01-19
type: plug
standard: au, uk, eu
board: esp32
---

## Vaiotech KW 600 Rowi2

This project is the home of the [ESPHome][esphome] firmware for the [Vaiotech KW600][vaiotech].

![Vaiotech KW600](./rowi2.png)

> **Note:**
> If you intend to integrate your device with Home Assistant, please ensure you order the **ESPHome firmware** version
> of Rowi2. The default firmware does **not** support Home Assistant integration.

Rowi2 is available in two different versions:

- **Default Rowi firmware:** Local REST API & MQTT integration
- **ESPHome firmware:** For Home Assistant and custom automation

There are two external sensors available:

- Temperature and Humidity
- Temperature, Humidity, and Air Quality

Details and technical specs: [Rowi2 Specifications][vaiotech-tech].
Where to buy in [AU/NZ][vaiotech-shop], [Global version request here][vaiotech-contact]

---

## ESPHome Firmware Features

- Onboard device to Home Assistant using [Improv-BLE][onboarding]
- **Bluetooth proxy:** Acts as a BLE proxy to relay Bluetooth Low Energy devices to Home Assistant
- Temperature and humidity offset
- Option to calibrate voltage, current, power, and energy
- Factory reset device by pressing button for over 10 seconds
- **Automatic firmware updates:** The ESPHome factory firmware supports auto-update for new releases

---

## LED Status & Light Modes

The RGB LED on the Rowi2 device indicates the current state:

| State | Color / Effect | Description |
|-------|----------------|-------------|
| **Improv BLE (Onboarding)** | Aqua, Fast Pulse | Device is in onboarding mode |
| **Initialization (WiFi connected)** | Solid White | Device is initializing, WiFi connected |
| **Initialization (WiFi not connected)**| Magenta, Slow Pulse | Device is initializing, WiFi not connected |
| **No Home Assistant Connection** | Red, Asymmetrical Pulse | Lost connection to Home Assistant |
| **Relay ON** | Solid Orange | Output relay is ON |
| **Relay OFF** | Solid Green | Output relay is OFF |
| **Factory Reset Requested** | Solid Blue, Fast Pulse | Hold button >10s, factory reset pending |
| **Overcurrent Detected** | Solid Red, Fast Pulse | Current exceeded configured limit, power cut |

**Notes:**

- The LED updates automatically based on device state.
- Factory reset is triggered by holding the button for more than 10 seconds.

---

## Getting Started

- [Onboarding Guide (Improv-BLE)][onboarding]
- [Calibration Guide][calibrating]
- [Developer Guide: Building & Installing ESPHome Firmware][building]

---

## Troubleshooting

- If your device is not discovered during onboarding, ensure Bluetooth is enabled and the device is in onboarding
mode (after power-up or factory reset).
- For manual firmware installation or advanced usage, see the [Developer Guide][building].

---

## Links

- [Rowi2 Specifications][vaiotech-tech]
- [Buy Rowi2 in AU/NZ][vaiotech-shop]
- [Request global version][vaiotech-contact]
- [Calibration Guide][calibrating]
- [Build it yourself: Developer Guide][building]

---

[esphome]: https://esphome.io
[vaiotech]: https://www.vaiotech.co.nz/kiwi-warmer-series/
[vaiotech-tech]: https://www.kiwi-warmer.co.nz/for-developers/
[vaiotech-shop]: https://www.kiwi-warmer.co.nz/shop/product/866878/rowi-2-smart-plug-for-home-assistant/
[vaiotech-contact]: https://www.vaiotech.co.nz/contact-us/
[onboarding]: https://github.com/vt-vaio/rowi2/blob/main/docs/ONBOARDING.md
[building]: https://github.com/vt-vaio/rowi2/blob/main/docs/BUILDING.md
[calibrating]: https://github.com/vt-vaio/rowi2/blob/main/docs/CALIBRATING.md

## Standard Configuration

```yaml
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! #
# !!!  After adopting the device, update the WiFi configuration accordingly. !!! #
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! #
substitutions:
  name: rowi2-plug
  friendly_name: "Rowi2 Plug"
  climate_update_interval: 10s
  sensor_timeout_interval: 30s
  energy_update_interval: 1s
  overcurrent_cutoff: '3'

packages:
  remote_package:
    url: [https://github.com/vt-vaio/rowi2](https://github.com/vt-vaio/rowi2)
    ref: main
    files:
      - packages/core.yml
      - packages/climate.yml
      - packages/energy.yml
      - packages/ble-proxy.yml
      - packages/diagnostics.yml

esphome:
  name: ${name}
  friendly_name: ${friendly_name}
  name_add_mac_suffix: true
  min_version: '2025.10.0'
  on_boot:
    priority: 375
    then:
      - script.execute: control_leds
      - delay: 10min
      - if:
          condition:
            lambda: return id(init_in_progress);
          then:
            - lambda: id(init_in_progress) = false;
            - script.execute: control_leds

esp32:
  board: nodemcu-32s
  framework:
    type: esp-idf

logger:
  level: INFO

api:
  id: api_id
  on_client_connected:
    - lambda: id(init_in_progress) = false;
    - script.execute: control_leds
  on_client_disconnected:
    - script.execute: control_leds

ota:
  - platform: esphome
    id: ota_esphome

wifi:
  id: wifi_id
  on_connect:
    - lambda: id(init_in_progress) = false;
    - script.execute: control_leds
  on_disconnect:
    - script.execute: control_leds

globals:
  - id: init_in_progress
    type: bool
    restore_value: no
    initial_value: 'true'
  - id: improv_ble_in_progress
    type: bool
    restore_value: no
    initial_value: 'false'
  - id: factory_reset_requested
    type: bool
    restore_value: no
    initial_value: 'false'
  - id: overcurrent_cutoff_detected
    type: bool
    restore_value: no
    initial_value: 'false'
