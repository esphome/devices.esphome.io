---
title: "Shelly Plug M Gen3"
date-published: 2026-08-25
type: plug
standard: eu
board: esp32
---

![Product Link](https://www.shelly.com/de/products/shelly-plug-s-gen3)

![Shelly Plug M Gen3](Doku.png "Shelly Plug M Gen3")

To enter bootloader mode, Boot needs to be pulled down (connected to ground).

## GPIO Pinout

| Pin   | Function  |
| ----- | --------- |
| GPIO1 | NTC       |
| GPIO5 | BL0942 TX |
| GPIO4 | BL0942 RX |
| GPIO19 | Blue LED |
| GPIO10 | Green LED|
| GPIO7 | Button    |
| GPIO0 | Relay     |

## Basic Configuration

```yaml file=config.yaml
```
