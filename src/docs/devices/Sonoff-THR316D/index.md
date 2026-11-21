---
title: Sonoff THR316D
date-published: 2026-11-21
type: relay
standard: global
board: esp32
difficulty: 3
---

![Sonoff THR316D](sonoff-th-elite.jpg "Photo of a Sonoff TH Elite")

Sonoff THR316D is a part of
[Sonoff TH Elite](https://sonoff.tech/en-eu/products/sonoff-th-elite-smart-temperature-and-humidity-monitoring-switch)
series, along with [THR320D](../Sonoff-THR320D).
For the purposes of ESPHome, these devices are likely identical, and both are likely very similar to the TH Origin line
([THR316](../Sonoff-THR316) and THR320), except TH Origin not having LED screens.
It's quite possible that all four of these devices could share a single YAML configuration template.

## Initial flashing

To enter flashing mode, remove the back cover by unscrewing all four screws at the back, connect your USB-UART cable
to the J7 programming header on the board, then connect the USB end of the cable to your computer,
**while holding the button on the front side of the relay pressed**.

## GPIO pinout

| Pin    | Function                                        |
| ------ | ----------------------------------------------- |
| GPIO0  | Push Button (HIGH = off, LOW = on)              |
| GPIO5  | Display (TM1621) Data                           |
| GPIO13 | Right LED (Green/Auto)                          |
| GPIO15 | Middle LED (Blue/WiFi)                          |
| GPIO16 | Left LED (Red/Relay)                            |
| GPIO17 | Display (TM1621) CS                             |
| GPIO18 | Display (TM1621) Write                          |
| GPIO21 | Relay                                           |
| GPIO23 | Display (TM1621) Read                           |
| GPIO25 | Pin 2 of the RJ-9 connector                     |
| GPIO27 | Pin 1 of the RJ-9 connector                     |

## RJ9 pinout

RJ9 pins, when the connector is viewed from the contacts side, cables exiting at the bottom, and pin 1 is farthest left.

| Pin | Function               |
| --- | ---------------------- |
| 1   | Sensor 3.3V Power      |
| 2   | Sensor Bus Data In/Out |
| 3   | Not Connected          |
| 4   | Sensor Ground          |

## Basic configuration with Sonoff THS01 temperature and humidity sensor connected

The relay will be exposed as a climate control system in Home Assistant.

LED meaning:

- Left LED (Red): Lit when relay is on (electricity passes to Line Out)
- Middle LED (Blue) : Lit when Wi-Fi is connected
- Right LED (Green) : Lit when climate control (Auto mode) is enabled

Button usage:

- Single press: Manually turn the relay on or off
- Double press: Manually turn climate control (Auto mode) on or off

In Auto mode, the relay will turn on automatically when ambient temperature falls **below** the specified threshold.
This is useful for heating scenarios, but not for cooling.

Before using the file, check out the commented out blocks. You might want to learn about and subsequently enable
the API, OTA updates, and the Captive portal.

```yaml file=config.yaml
```

## Slightly more complex configuration example

This configuration is mostly same as above, except:

- API, OTA updates, and the Captive portal have been enabled
- you can choose whether the relay will be turned on when the temperature falls below the specified threshold ("heating"),
  or above the threshold ("cooling").

Auto mode can still be enabled or disabled by double-clicking the button, and enabling it restores its type
("heating" or "cooling") to the one that was used last.

```yaml file=advanced.yaml
```
