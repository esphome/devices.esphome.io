---
title: Sonoff BASIC R4 v1.0
date-published: 2023-11-28
type: relay
standard: global
board: esp32
difficulty: 3
---

Sonoff BASIC R4 is upgraded with esp32c3 and a new 'magic mode switch' feature that can be enabled with custom component
by @ssieb.

Pinouts and pictures are taken from [digiblur's website](https://digiblur.com/wiki/devices/relays/sonoff-basic-r4/)

![alt text](sonoff_basic_r4.webp "Sonoff BASIC R4")

## GPIO Pinout

| Pin    | Function                                   |
| ------ | ------------------------------------------ |
| GPIO4  | Relay (pull-in)                            |
| GPIO5  | Pin for 'Magic Switch Mode'                |
| GPIO6  | Blue LED                                   |
| GPIO9  | Button                                     |
| GPIO10 | Relay hold (via 100 Ω resistor), see below |

## PCB

![alt text](sonoff_basic_r4_pcb.webp "Sonoff BASIC R4 PCB")

![alt text](sonoff_basic_r4_pcb_rear.webp "Sonoff BASIC R4 PCB rear")

## Basic Configuration

```yaml file=config.yaml
```

## Relay pull-and-hold (GPIO10)

GPIO10 drives a second transistor (Q2, with a series base resistor and a pull-down to GND).
Q2 feeds the relay coil through a 100 Ω resistor (R20, marked "101"). It works as a
"pull-and-hold" circuit: GPIO4 pulls the relay in at full coil current, then GPIO10 alone
holds it at reduced current. This lowers coil power and heat while the relay is on.

To switch it on, set GPIO10 and GPIO4 HIGH, wait a short time, then set GPIO4 LOW. To
switch it off, set both LOW. The basic configuration (GPIO4 only) still works, but the coil
then runs at full current the whole time.

The complete configuration below uses pull-and-hold instead of the basic configuration.
The button and magic switch toggle the relay the same way.

```yaml file=relay-pull-hold.yaml
```

The button and `magic_switch` actions keep working unchanged, because they toggle `switch_1`.

## Bluetooth proxy

The ESP32-C3 can also act as a Bluetooth proxy for Home Assistant. Add this to the
basic configuration:

```yaml file=bluetooth-proxy.yaml
```
