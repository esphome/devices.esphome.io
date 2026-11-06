---
title: Athom Energy Meter (EM6)
date-published: 2024-11-01
type: sensor
standard: global
board: esp32
project-url: https://github.com/athom-tech/esp32-configs/blob/main/athom-energy-monitor-x6.yaml
difficulty: 1
made-for-esphome: true
---

![alt text](athom_EM6.webp "Athom Energy Meter - EM6")

Maker: [https://www.athom.tech/](https://www.athom.tech/)
Product page: [https://www.athom.tech/blank-1/6-ch-energy-meter-made-for-esphome](https://www.athom.tech/blank-1/6-ch-energy-meter-made-for-esphome)

Also on Aliexpress, available pre-flashed with ESPHome or Tasmota.

## GPIO Pinout

| Pin    | Function  |
| ------ | --------- |
| GPIO7  | bl0906_tx |
| GPIO8  | bl0906_rx |
| GPIO9  | button    |
| GPIO10 | led       |

## Configuration

```yaml url=https://github.com/athom-tech/esp32-configs/blob/main/athom-energy-monitor-x6.yaml
```
