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

Set `current_input: current_transformer` on the `cse7761` platform (requires ESPHome 2026.11.0 or newer). The option
defaults to `shunt`, which is meant for a shunt resistor: it sets the current input to 16x gain and uses a different
scale factor, so readings come out about `M_PI` times too high. With `current_transformer` the chip uses 1x gain on the
current input and the component applies the matching scale, so no filters are needed.

On older ESPHome versions, which do not have the `current_input` option, remove it from the configuration and divide
the current, power and energy measurements by the `M_PI` constant instead:

```yaml inline
filters:
  - lambda: return x / M_PI;
```

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
