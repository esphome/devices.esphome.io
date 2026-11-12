---
title: TreatLife DS03 Fan Controller
date-published: 2021-01-06
type: dimmer
standard: us
board:
  - esp8266
  - bk72xx
---

[Amazon Link](https://www.amazon.com/dp/B086PPRWL7)

## Notes

Different revisions of this product may come with different types of Tuya WiFi modules (e.g TYWE3S, WB3S, CB3S). The
physical layout of these modules is very similar but they do have different GPIO naming schemas. There are also slight
differences in Tuya MCU data point configurations. Please pay close attention before flashing.

This TuyaMCU requires a baud rate of 115200. This will generate a error in the log saying 9600 is requested. This is to
be expected and will be ignored. Setting baud rate to 9600 will cause boot issues

## ESP8266 GPIO Pinout

| Pin   | Function |
| ----- | -------- |
| GPIO1 | Tuya Tx  |
| GPIO3 | Tuya Rx  |

## CB3S GPIO Pinout

| Pin   | Function |
| ----- | -------- |
|  P11  | Tuya Tx  |
|  P10  | Tuya Rx  |

## Basic configuration - TYWE3S / ESP8266 variant

```yaml file=config.yaml
```

## Basic configuration - CB3S / BK7231N variant

```yaml file=config-cb3s.yaml
```
