---
title: LSC smart plug 2578685
date-published: 2023-04-17
type: plug
standard: eu
board: bk72xx
---

## Notice

- This smart plug is flashable using the latest tuya-cloudcutter with a compiled ESPHome binary. I recommend following
  this [Youtube Video](https://youtu.be/sSj8f-HCHQ0).
- There is a version with BK7231N and a version with BK7231T. Both should work but you need to make sure to use the
  right version. I recommend to use the the configuration gererated by ltchiptool and esphome-kickstart as shown in the
  video instead of this configuration, because it might change.
- The second configuration is the version that worked for me (Version 1.1.8 in the App and with BK7231N)

## Product Images

![plug with box](lsc-plug-2578685.jpg)
![plug](lsc-plug-no-box2578685.jpg)

## GPIO Pinout

Pinout for Version with BK7231T

| Pin | Function      |
| --- | ------------- |
| P7  | Switch button |
| P26 | Blue LED      |
| P6  | Red LED       |
| P8  | Relay         |

Pinout for Version with BK7231N (Relay and LED Swapped)

| Pin | Function      |
| --- | ------------- |
| P7  | Switch button |
| P26 | Blue LED      |
| P8  | Red LED       |
| P6  | Relay         |

## Basic configuration

Version for BK7231T and BK7231N, just change board_model substitutions:
```yaml file=config.yaml```
