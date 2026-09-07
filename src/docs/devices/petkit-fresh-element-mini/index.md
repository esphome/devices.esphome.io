---
title: Petkit Fresh Element Mini Pet Feeder
date-published: 2026-08-25
type: misc
standard: global
board: esp8266
difficulty: 4
project-url: https://github.com/wrobelda/petkit-element-mini-esphome
---

## Product description

The Petkit Fresh Element Mini, product code P530, is an automatic dry-food pet
feeder with an ESP8266 Wi-Fi module. ESPHome replaces the stock cloud firmware
on that module and communicates with the feeder's original motor controller,
so no additional microcontroller or motor rewiring is required.

This is not a board revision of the ESP32-based Fresh Element Solo. The Mini
uses two processors:

- the ESP8266 handles Wi-Fi, schedules, and high-level control;
- a Nuvoton ISD91230 Cortex-M0 controls the motor, outlet, indicators, beeper,
  and sensors.

Keeping the original motor controller preserves its motion and door-safety
logic.

## Hardware

The ESP8266 and ISD91230 communicate over UART0 at 115200 baud. Packets use an
`AA AA` header and CRC-16/CCITT-FALSE. The external `petkit_feeder` component
implements that protocol.

| ESP8266 pin | Function |
| --- | --- |
| GPIO1 | UART0 transmit to ISD91230; board pad TX0 |
| GPIO3 | UART0 receive from ISD91230; board pad RX0 |
| GPIO2 | UART1 transmit-only logger; board pad TX1 |
| GPIO13 | Manual-feed button, active-low with pull-up |
| GPIO0 | Wi-Fi/reset button and ESP8266 boot strap |
| GPIO15 | ISD91230 active-low reset |
| GPIO5 / GPIO14 | Battery-backed PCF8563 RTC I2C bus |

UART1 logging remains available on TX1 because the feeder control bus uses
UART0.

## Features

- local one-serving feed control, nominally 5 g per counted wheel cycle;
- stock-style held manual feeding with discrete servings;
- outlet open, close, timeout recovery, and motor-controller reset;
- four schedules stored and evaluated on the feeder;
- battery-backed time through the PCF8563 RTC;
- food detection, outlet and wheel feedback;
- adapter and battery voltage, plus a mains/battery power-source sensor;
- upper Wi-Fi indicator and beeper control;
- normal ESPHome OTA after the initial migration.

Actual serving weight varies with kibble size, density, and hopper level.

## Installation

Do not upload the configuration below directly to the stock firmware. The
stock bootloader uses Espressif's paired non-OS SDK layout, so installation
uses the feeder's stock OTA client and an intermediate transition image.

Follow the project's [wireless installation
guide](https://github.com/wrobelda/petkit-element-mini-esphome#installation).
It uses the separate [Petkit compatibility
server](https://github.com/wrobelda/petkit-compat-server) for SoftAP
provisioning and the first stock-format update. Lower-to-upper slot relocation
is automatic when required; uploading the final ESPHome factory image through
the transition image's authenticated web interface is currently a separate
step.

## Configuration

```yaml file=config.yaml

```

The configuration above describes the feeder hardware. The complete project
adds the local schedules, controls, indicator policy, encrypted Home Assistant
API, hardware tests, wireless migration bridge, and installation tutorial.
After migration, normal ESPHome OTA updates are supported.

## Validation

The UART framing and command behavior were checked against logic captures and
both stock processors' firmware. On-device tests covered startup, sensor and
power reporting, manual and Home Assistant feeding, 1/2/3-serving counted
motion, local schedules, motor-controller reset, the complete wireless
stock-to-Kickstart-to-ESPHome migration, and a subsequent standard ESPHome OTA.
