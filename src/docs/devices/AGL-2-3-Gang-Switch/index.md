---
title: AGL Switch 2, 3 gang variants
date-published: 2024-01-15
type: switch
standard: br
board: esp8266
difficulty: 3
---

## General Notes

The [AGL](https://www.aglbrasil.com/en/produtos/smart-home) Switch is available in Brazil.

This config was created based on the 2 gang switch that I had.

## Product Images

Front of 2 gang switch
![alt text](./agl_1106062.png "Front of 2 gang switch")

Back of 2 gang switch
![alt text](./back.jpg "Back of 2 gang switch")

## GPIO Pinout

### 2-Gang Version

PCB
![alt text](./open.jpg "PCB")

| Pin    | Function                        |
| ------ | ------------------------------- |
| GPIO2  | Status LED                      |
| GPIO16 | Button 1 (HIGH = off, LOW = on) |
| GPIO5  | Button 2 (HIGH = off, LOW = on) |
| GPIO13 | Relay 1                         |
| GPIO12 | Relay 2                         |

### 3-Gang Version

| Pin    | Function                        |
| ------ | ------------------------------- |
| GPIO2  | Status LED                      |
| GPIO16 | Button 1 (HIGH = off, LOW = on) |
| GPIO5  | Button 2 (HIGH = off, LOW = on) |
| GPIO4  | Button 3 (HIGH = off, LOW = on) |
| GPIO13 | Relay 1                         |
| GPIO12 | Relay 2                         |
| GPIO14 | Relay 3                         |

## Basic Configuration (2-Gang)

```yaml file=config.yaml
```
