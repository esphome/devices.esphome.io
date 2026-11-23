---
title: Petkit Pura Max Self-Cleaning Litter Box
date-published: 2026-11-22
type: misc
standard: global
board: esp32
difficulty: 4
project-url: https://github.com/Triskae/esphome-petkit-t4
alias:
  - title: Petkit T4 Litter Box
    slug: Petkit-T4-Litter-Box
---

## Product description

The Petkit Pura Max (model T4) is a self-cleaning cat litter box with a rotating drum, a waste bin with a flap, a load
cell, presence sensors, a 128x128 display and two buttons. The main board (T4-MAIN-V1.3, T4-MAIN-V2.3) has an
ESP32 module with 8 MB of flash. The motors, the hall sensors, the load cell and the presence sensors are not wired to
the ESP32: a separate motor MCU drives them and talks to the ESP32 over UART0.

The [esphome-petkit-t4](https://github.com/Triskae/esphome-petkit-t4) firmware fully replaces the stock one and works
offline. It reproduces the stock cleaning, leveling, maintenance and "empty litter" moves and the local menu, and adds
Home Assistant entities for the settings, the motor controls and the sensors. It builds on the
[original firmware by egormanga](https://github.com/egormanga/esphome-petkit-t4) and on the serial bus reverse
engineering by [earlynerd](https://github.com/earlynerd/petkit-pura-max-serial-bus).

This firmware drives motors in a device a pet goes into. Test it with the pet away, and keep the safety checks
(cover, bin, presence and weight) enabled.

## Flashing

The project has an [interactive install guide](https://triskae.github.io/esphome-petkit-t4/) with photos: it backs up
the stock firmware, extracts the factory weight calibration and flashes ESPHome from the browser, with the matching
`esptool` commands. Back up the whole 8 MB flash, twice, before flashing: it is the only way back to the stock
firmware.

1. Unplug the litter box, empty the drum and open the top housing to reach the main board, next to the display.
2. Solder three wires to the ESP32 serial pads on the underside of the board, or hold probes on them. Use a 3.3 V USB
   serial adapter and do not connect its power pin: the board runs from its own power adapter.
3. Hold the OK button (GPIO0), plug the litter box power adapter in, then release the button to enter download mode.

| Adapter | Board pad                 |
| ------- | ------------------------- |
| GND     | GND                       |
| RX      | WTXD (ESP32 transmit)     |
| TX      | WRXD (ESP32 receive)      |
| 3V3/5V  | not connected             |

The `DEBUG` header next to the beeper belongs to the motor MCU, not to the ESP32, and `WTX1` is a debug output of the
stock firmware: neither is needed.

## GPIO pinout

| Pin    | Function                                                    |
| ------ | ----------------------------------------------------------- |
| GPIO0  | OK button (inverted), boot button                           |
| GPIO1  | UART TX to the motor MCU                                    |
| GPIO2  | Display power supply                                        |
| GPIO3  | UART RX from the motor MCU                                  |
| GPIO4  | I²C SCL (BM8563 real-time clock)                            |
| GPIO5  | Display CS                                                  |
| GPIO15 | I²C SDA (BM8563 real-time clock)                            |
| GPIO16 | Buzzer (PWM)                                                |
| GPIO17 | Display reset                                               |
| GPIO18 | SPI clock (display)                                         |
| GPIO19 | Display DC                                                  |
| GPIO22 | Motor MCU ready (high), low while the MCU resets            |
| GPIO23 | SPI MOSI (display)                                          |
| GPIO26 | Bus power supply, enabled at boot                           |
| GPIO27 | Bus power supply on other board revisions, enabled at boot  |
| GPIO32 | 3.3 V rail monitor (ADC)                                    |
| GPIO34 | Menu button (inverted)                                      |

The display is an SH1107 128x128 OLED on SPI (`ssd1306_spi`, rotated 180°).

## Basic configuration

This configuration covers the hardware: the motor MCU link through the `pkt4_mcu` external component with its sensors
(weight, presence, cover, bin, drum and flap positions), the display, the buttons, the buzzer and the real-time clock.
It does not move the motors on its own, and the weight and distance are raw readings: the load cell and the proximity
sensor need a per-unit calibration. The cleaning cycles, the local menu, the calibration and the safety checks are in
the full firmware, [t4.yaml](https://github.com/Triskae/esphome-petkit-t4/blob/master/t4.yaml), which can be installed
and updated from the ESPHome Device Builder
([instructions](https://github.com/Triskae/esphome-petkit-t4#installing-from-the-esphome-device-builder)).

```yaml file=config.yaml
```

The MCU serial protocol and the motor commands are described in
[docs/mcu-protocol.md](https://github.com/Triskae/esphome-petkit-t4/blob/master/docs/mcu-protocol.md) and
[docs/motion.md](https://github.com/Triskae/esphome-petkit-t4/blob/master/docs/motion.md).
