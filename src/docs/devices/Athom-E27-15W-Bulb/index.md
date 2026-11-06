---
title: Athom E27 15W Bulb
date-published: 2021-10-05
type: light
standard: global
board: esp8266
---

## Flashing Procedure

Natively runs Tasmota, upload ESPHome binary to flash wirelessly.

## Bulb Specifications

Color: RGB+Warm+Cold White
Color Temperature: 3000-6000K
Brightness: 1400 lumens
Voltage: 110V~250V
Power: 15W
Base: E27

Manufacturer: [Athom.tech](https://www.athom.tech/)

## Product Images

![Athom E27 15W Bulb](./Athom-E27-15W-Bulb.png "Athom E27 15W Bulb")

## GPIO Pinout

| Pin    | Function             |
| ------ | -------------------- |
| GPIO13 | CT Output            |
| GPIO5  | CT Brightness Output |
| GPIO4  | Red Output           |
| GPIO12 | Green Output         |
| GPIO14 | Blue Output          |

## Basic Configuration

```yaml file=config.yaml
```
