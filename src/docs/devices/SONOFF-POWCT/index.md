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
| GPIO13 | Status LED (HIGH = on, LOW = off)  |
| GPIO15 | Wifi_LED                           |
| GPIO17 | TM1621 CS                          |
| GPIO18 | TM1621 WR                          |
| GPIO21 | Relay1                             |
| GPIO23 | TM1621 RD                          |
| GPIO25 | CSE7761 Rx                         |
| GPIO26 | CSE7761 Tx                         |

## Basic Configuration

Based on Sonoff POW Elite 20a (POWR320D) (Source: [https://devices.esphome.io/devices/Sonoff-POW-Elite-20a](https://devices.esphome.io/devices/Sonoff-POW-Elite-20a)).

To get the correct current and power values, the measurement must be divided by the M_PI constant.

The status LED on GPIO13 is lit when the pin is high: Sonoff's own firmware drives it at the same level as the relay.
The Wi-Fi LED on GPIO15 is lit when low.

This configuration covers the hardware: the relay, the button, both LEDs, the CSE7761 power monitor and the display.
A short press of the button toggles the relay; a long press switches the display between voltage and current, and
power. Add your own `wifi:` credentials, `api:` and `ota:` (and `captive_portal:` if you want it) before flashing.

```yaml file=config.yaml
```

## Daily Energy

This adds a daily energy total, reset at midnight by Home Assistant's time, and shows it on the display next to
the power. Its `display:` entry replaces the lambda of the display in `config.yaml`.

```yaml file=energy.yaml
```

## Power Factor and Subordinate Device

These sensors are derived from the measurements: the power factor, and whether the device plugged into the POWCT
is running (drawing more than 4 W).

```yaml file=derived-sensors.yaml
```
