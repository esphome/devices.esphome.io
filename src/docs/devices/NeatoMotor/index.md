---
title: NeatoFx Motor
date-published: 2026-05-21
type: misc
standard: global
board: esp32
project-url: https://github.com/CodeMakesItGo/NeatoFx_Public/tree/main/Controllers/NeatoMotor
made-for-esphome: true
difficulty: 2
---

## Overview

The NeatoFx Motor is a WiFi-enabled motor and actuator controller for animated props,
winches, escape room mechanisms, and entertainment attractions. Built on ESP32 with
dual BTN8962TA H-bridge modules, one board runs four selectable behaviors: hold-to-run
joystick control (DC or 240 VAC drive), encoder-based winch control with auto-homing
and soft limits, dual pulse/air-valve firing, and simple manual joystick mode. Optional
CAN bus networking lets multiple controllers coordinate as a game, and an optional MP3
sound module adds motion-synced audio.

**Key features:**

- Dual BTN8962TA H-bridge — 30 A continuous per half-bridge, 7–24 V DC supply
- Four compile-time behaviors: standard joystick, winch, pulse, manual
- DC drive (PWM with configurable start ramp) or 240 VAC dry-contact drive
- Hold-to-run joystick inputs — release always stops the motor
- Hardware limit switches, NO or NC wiring (web UI toggle)
- Automatic stall detection via current sense ADC (8 A default, configurable)
- Winch mode: Hall quadrature encoder, auto-homing on boot, calibrated soft
  length limits, two-zone speed, soft direction-change ramping
- Pulse mode: two independent timed outputs for air valves / solenoids
- Optional CAN bus (250 kbps) — central game gating, remote drive, telemetry
- Optional DY-SV5W MP3 module for idle/run audio synced to motion
- Boot-safe H-bridge: outputs forced off at earliest boot priority
- OTA firmware updates; Home Assistant integration in networked mode

## Hardware

| Component | Specification |
|-----------|--------------|
| MCU | ESP32 (Wemos D1 Mini32) |
| Flash | 4 MB |
| Motor driver | 2 × BTN8962TA half-bridge (H-bridge pair) |
| Max motor current | 30 A continuous (BTN8962TA rated); 8 A software stall cutoff (configurable) |
| Supply voltage | 7–24 V DC |
| WiFi | 802.11 b/g/n 2.4 GHz |
| CAN | SN65HVD232 transceiver, 250 kbps (optional add-on) |
| Joystick inputs | 2 × hold-to-run (INPUT_PULLUP) |
| Limit switches | NO or NC (INPUT_PULLUP, web UI mode toggle) |
| Current sense | 2 × ADC (R_IS / L_IS) |

## GPIO Pinout

| GPIO | Function |
|------|----------|
| GPIO19 | R_PWM — direction 1 / forward / reel-out / valve A (LEDC 1 kHz) |
| GPIO18 | L_PWM — direction 2 / reverse / reel-in / valve B (LEDC 1 kHz) |
| GPIO17 | R_EN — right H-bridge enable (INH) |
| GPIO16 | L_EN — left H-bridge enable (INH) |
| GPIO34 | R_IS — right H-bridge current sense (ADC, input-only) |
| GPIO35 | L_IS — left H-bridge current sense (ADC, input-only) |
| GPIO32 | Input 1 — joystick forward / trigger A (hold-to-run) |
| GPIO27 | Input 2 — joystick reverse / trigger B (hold-to-run) |
| GPIO25 | SW1 — open/forward limit switch (standard board) |
| GPIO13 | SW2 — closed/reverse limit switch (Hall B in winch mode) |
| GPIO4 | CAN RX (with CAN add-on) / Hall A (winch) / open limit (manual) |
| GPIO5 | CAN TX (with CAN add-on) |
| GPIO26 | Status LED (home limit switch in winch mode) |
| GPIO21/22 | DY-SV5W sound module UART (with sound add-on) |

## Configuration

```yaml file=config.yaml
```

For the full configuration with all board variants, drives, and add-ons:

```yaml url=https://github.com/CodeMakesItGo/NeatoFx_Public/blob/main/Controllers/NeatoMotor/main.yaml
```

### Board variants (select one in `main.yaml`)

| Package | Behavior |
|---------|----------|
| `boards/rev3.yaml` | Standard — hold-to-run joystick, limit switches, ramping, CAN game-gating |
| `boards/rev3_winch.yaml` | Winch — encoder position tracking, auto-homing, soft limits, two-zone speed |
| `boards/rev3_pulse.yaml` | Pulse — two independent timed outputs for air valves / solenoids |
| `boards/rev3_manual.yaml` | Manual — pure hold-to-run with hard limit stops, never CAN-gated |

Standard board also selects a drive: `drive_dc.yaml` (PWM ramp) or `drive_ac.yaml`
(dry-contact control of an external 240 VAC motor controller).

### Operating modes

- **Networked** — joins home WiFi and exposes the Home Assistant native API
  (`configs/networked.yaml`).
- **Standalone** — creates its own WiFi AP (`motor-1`) for direct web control
  (`configs/standalone.yaml`).

### Behavior settings (configurable via web UI)

| Setting | Description |
|---------|-------------|
| Motor Speed | PWM duty (%) the motor ramps up to |
| Start Ramp | ms to ramp 0 → speed on every start (0 = instant) |
| Limit Switches NC Mode | Invert both end-stops for normally-closed wiring |
| Pulse Time | Output on-time per trigger (pulse board, default 100 ms) |
| Sound Run/Idle Track | MP3 track indices (sound add-on) |

## Links

- [GitHub repository](https://github.com/CodeMakesItGo/NeatoFx_Public/tree/main/Controllers/NeatoMotor)
