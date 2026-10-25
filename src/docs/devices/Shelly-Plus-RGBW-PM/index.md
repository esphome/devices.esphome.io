---
title: Shelly Plus RGBW PM
date-published: 2024-09-18
type: light
standard: uk, us, eu
board: esp32
---

![Product Image](Shelly-Plus-RGBW-PM.png "Shelly Plus RGBW PM")

## GPIO Pinout

| Pin | Function |
| --- | --- |
| GPIO14 | Onboard LED |
| GPIO22 | Onboard Button |
| GPIO25 | PWM 1 (R) |
| GPIO26 | PWM 2 (G) |
| GPIO27 | PWM 3 (B) |
| GPIO4 | PWM 4 (W) |
| GPIO36 | Input 1 |
| GPIO37 | Input 2 |
| GPIO38 | Input 3 |
| GPIO39 | Input 4 |
| GPIO33 | NTC Temp Sensor |
| GPIO34 | Voltage Monitor |
| GPIO35 | OpAmp Current Monitor |

## Plus addon interface

Use it for flashing. Connect EN pin to the RESET pin of your USB-UART converter.

![Addon interface pinout](Plus-addon-interface.png "Shelly Plus addon interface")

## Configuration for RGBW

```yaml file=config.yaml
