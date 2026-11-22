---
title: Senseair tSENSE (K70) with D1 Mini
date-published: 2026-11-22
type: sensor
standard: global
board: esp8266
difficulty: 4
project-url: https://espeasy.readthedocs.io/en/latest/Plugin/P052_tSense_K70.html
---

## Description

The Senseair tSENSE (K70) is a wall-mount CO2, temperature and humidity transmitter with a touchscreen, three
0-10 V outputs and a relay (sold by CO2Meter.com as the "CO2 Relay SE-0034"). It is usually used to drive a
fresh-air damper or ventilation fan. A Wemos D1 Mini fits inside the case and talks Modbus RTU to the tSENSE
through its 3.5 mm service port, so ESPHome can read the sensors, watch the relay, override it and edit the relay
thresholds while the tSENSE keeps running its own control logic.

Opening the case and soldering to the board voids the tSENSE warranty.

## Wiring

The D1 Mini mounting and wiring follow the
[ESPEasy tSense (K70) guide](https://espeasy.readthedocs.io/en/latest/Plugin/P052_tSense_K70.html), which has
photos of the vias and pads. Power the D1 Mini from the tSENSE 5 V and GND vias, and connect the service-port
pads:

| D1 Mini      | tSENSE                       |
| ------------ | ---------------------------- |
| 5V           | 5 V via                      |
| G            | GND via                      |
| D7 (GPIO13)  | TX on the 3.5 mm port pads   |
| D8 (GPIO15)  | RX on the 3.5 mm port pads   |

GPIO13/GPIO15 are the ESP8266 UART0 pins swapped, so serial logging is disabled in the config.

## Modbus registers

Measured on a tSENSE Disp T RH RL over the service port (slave address `0xFE`, 9600 8N1). Addresses are the
0-based values sent on the wire.

| Type    | Address   | Meaning                                                                         |
| ------- | --------- | ------------------------------------------------------------------------------- |
| Input   | 0         | Error bits, 0 = OK (bit meanings as in the ESPEasy guide)                       |
| Input   | 3         | CO2, ppm                                                                        |
| Input   | 4         | Temperature × 100, in the unit the display is set to (°C or °F)                 |
| Input   | 5         | Relative humidity × 100                                                         |
| Input   | 21-24     | Live levels of outputs 1-4 (0-16383 = 0-100 %); output 4 is the relay          |
| Input   | 28        | Bit 8 (`0x100`) = relay on                                                      |
| Holding | 21-24     | Output 1-4 override; 32767 = none. Relay (24): 0 = off, 16383 = on               |
| Holding | 32-35     | Output 1-4 range low (relay: 35 = release level, ppm)                            |
| Holding | 40-43     | Output 1-4 range span (relay: 43 = span; switch-on level = low + span)          |
| Holding | 62        | RS-485 baud rate                                                                |
| Holding | 63        | RS-485 address                                                                  |

Holding registers above 63 answer with an illegal-address exception. Input register 2 does not follow the relay.
Changing the relay High setting on the touchscreen from 1500 to 1400 changed only holding register 43
(300 to 200), which is how the low + span layout was identified.

## Notes

- The D1 Mini inside the case warms the sensor by roughly 2-3 °F, which also makes the humidity read a few points
  low. `self-heating-correction.yaml` adds an adjustable offset and recomputes humidity at the corrected
  temperature.
- Writing the relay thresholds from Home Assistant updates the touchscreen settings, and changes made on the
  touchscreen show up in Home Assistant.
- Whether a relay override survives a tSENSE power cycle has not been tested.

## Basic configuration

```yaml file=config.yaml
```

## Readable status text

```yaml file=status-text.yaml
```

## Self-heating correction

```yaml file=self-heating-correction.yaml
```
