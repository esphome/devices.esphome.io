---
title: Sonoff POW Ring (POWCT)
date-published: 2024-06-24
type: relay
standard: global
board: esp32
difficulty: 3
---

## GPIO Pinout

| Pin    | Function                           |
| ------ | ---------------------------------- |
| GPIO00 | Push Button (HIGH = off, LOW = on) |
| GPIO05 | TM1621 DA                          |
| GPIO13 | Status LED (HIGH = off, LOW = on)  |
| GPIO15 | Wifi_LED                           |
| GPIO17 | TM1621 CS                          |
| GPIO18 | TM1621 WR                          |
| GPIO21 | Relay1                             |
| GPIO23 | TM1621 RD                          |
| GPIO25 | CSE7761 Rx                         |
| GPIO26 | CSE7761 Tx                         |

## Basic Configuration

Based on Sonoff POW Elite 20a (POWR320D) (Source: [https://devices.esphome.io/devices/Sonoff-POW-Elite-20a](https://devices.esphome.io/devices/Sonoff-POW-Elite-20a)).

This device measures current with a current transformer, so set `current_input: current_transformer` on the `cse7761`
platform (ESPHome 2026.11 or newer). The default, `shunt`, is meant for shunt resistors: it sets the current input to
16x gain and uses a different scale factor. With `current_transformer` the chip uses 1x gain and the component applies
the matching scale.

```yaml file=config.yaml
```

## Display Pages

A long press on the button cycles the display between voltage / current and energy / power. Add this file to the
configuration above:

```yaml file=display-pages.yaml
```

## Power Factor

```yaml file=power-factor.yaml
```

## Subordinate Device

Reports whether the device plugged into the relay is running, based on its power consumption.

```yaml file=subordinate-device.yaml
```
