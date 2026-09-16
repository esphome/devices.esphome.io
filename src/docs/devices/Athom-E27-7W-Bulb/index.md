---
title: Athom E27 7W Bulb
date-published: 2021-10-05
type: light
standard: global
board: esp8266
---

## Flashing Procedure

Natively runs Tasmota, upload ESPHome binary to flash wirelessly.

## Bulb Specifications

Manufacturer: [Athom.tech](https://www.athom.tech/)

Color: RGB+Warm+Cold White
Color Temperature: 3000-6000K
Brightness: 600 lumens
Voltage: 110V~240V
Power: 7W
Base: E27

## Product Images

![Athom E27 7W Bulb](./Athom-E27-7W-Bulb.png "Athom E27 7W Bulb")

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
