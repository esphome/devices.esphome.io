---
title: Flux Open Home Night Light
date-published: 2026-02-03
type: light
standard: global
board: esp32
difficulty: 1
made-for-esphome: true
project-url: https://github.com/FluxOpenHome/NightLight
---

## Description

The Flux Night Light is an open-source, ESPHome-powered night light built on the ESP32-C3 with a 16-LED WS2812 addressable LED array arranged in a 4x4 grid. It integrates natively with Home Assistant for full color, brightness, and effect control.

### Features

- **16 Addressable LEDs**: WS2812 LEDs in a 4x4 snake-wired grid layout
- **13 Built-in Effects**: Including Pulse, Rainbow, Fire simulation, Fireworks, Twinkle, and a custom Flux Logo animation
- **State Persistence**: Color, brightness, and active effect are saved to flash and automatically restored after a power loss
- **OTA Updates**: Firmware updates delivered over HTTP from GitHub releases with automatic detection in Home Assistant
- **WiFi Provisioning**: Bluetooth LE (Improv), serial, or captive portal for initial setup
- **Web Interface**: Built-in web server on port 80 for direct device control
- **Dashboard Import**: Supports ESPHome dashboard adoption for easy onboarding
- **WLED Compatible**: Can alternatively run WLED firmware by setting the data pin to GPIO10

### Entities Created

- **light.led_array** - Full RGB light control with color picker, brightness, and effect selection
- **update.firmware_update** - OTA firmware update entity
- **sensor.uptime** - Device uptime
- **sensor.wifi_signal** - WiFi signal strength in dBm
- **text_sensor.ip_address** - Device IP address
- **text_sensor.connected_ssid** - Connected WiFi network
- **text_sensor.esphome_version** - Running ESPHome version
- **button.restart** - Device restart

### Available Effects

| Effect | Description |
|--------|-------------|
| Pulse | Smooth brightness pulsing between 20% and 100% |
| Random | Transitions to random colors |
| Strobe | Quick on/off cycling |
| Flicker | Random brightness variations around the set color |
| Addressable Rainbow | Moving rainbow across the LED strip |
| Addressable Color Wipe | New colors introduced at the start of the strip |
| Addressable Scan | Single dot sliding back and forth |
| Addressable Twinkle | Random LEDs brighten momentarily like stars |
| Addressable Random Twinkle | Twinkle with random colors |
| Addressable Fireworks | Random sparkles that cascade and fade |
| Addressable Flicker | Per-LED flicker around the active color |
| Fire | Realistic flame simulation using a heat map |
| Flux Logo | Animated Flux logo drawn on the 4x4 grid |

## Hardware

| Component | Specification |
|-----------|--------------|
| MCU | ESP32-C3 (esp32-c3-devkitm-1) |
| LEDs | 16x WS2812 (GRB color order) |
| Data Pin | GPIO10 |
| Layout | 4x4 grid, snake wiring pattern |

### LED Grid Layout

```
Row 4: LED 16  15  14  13   (right to left)
Row 3: LED  9  10  11  12   (left to right)
Row 2: LED  8   7   6   5   (right to left)
Row 1: LED  1   2   3   4   (left to right)
```

## Setup

1. Flash the device using ESPHome Dashboard or CLI
2. Configure WiFi via:
   - **BLE**: Improv via the ESPHome app or Home Assistant Companion
   - **USB**: [web.esphome.io](https://web.esphome.io)
   - **Captive Portal**: Connect to the fallback AP (password: `12345678`)
3. Device auto-discovers in Home Assistant

## Configuration

The device configuration is available on [GitHub](https://github.com/FluxOpenHome/NightLight). It can be adopted directly via the ESPHome dashboard using the built-in `dashboard_import`.

```yaml
dashboard_import:
  package_import_url: github://FluxOpenHome/NightLight/flux-night-light.yaml@main
  import_full_config: true
```

## Alternative Firmware: WLED

This device is also compatible with WLED. To use WLED instead of ESPHome:

1. Flash WLED for ESP32-C3 via USB or [install.wled.me](https://install.wled.me)
2. In the WLED web UI, go to **Config > LED Preferences**
3. Set **GPIO** to **10**, **LED count** to **16**, **Color order** to **GRB**
4. Save and reboot

## Support

- [GitHub Repository](https://github.com/FluxOpenHome/NightLight)
- [GitHub Issues](https://github.com/FluxOpenHome/NightLight/issues)
