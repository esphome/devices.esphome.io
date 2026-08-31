---
title: Apollo Multi-Target Radar (MTR-1)
date-published: 2024-07-03
type: sensor
standard: global
board: esp32
project-url: https://github.com/ApolloAutomation/MTR-1/
difficulty: 1
made-for-esphome: true
---

![Apollo MTR-1](Apollo-MTR-1.JPG "Apollo MTR-1")

## Description

The Apollo Automation MTR-1 is a multi-target radar sensor with the following features:

- LD2450 Multi-target radar sensor.
- LTR-390UV LUX and UV Sensor.
- DPS310 Temperature and Pressure Sensor (late 2025/early 2026 models may not have the DPS310 populated due to it being discontinued; mid 2026 and later models use a DPS368 with the same features).
- SCD-40 CO2 Sensor.
- RGB Pixel.
- Piezo Buzzer.
- GPIO Expansion: I2C, power, and GPIO pins exposed.

## Quickstart

1. Plug in the MTR-1.
2. Connect to "MTR1 Hotspot".
3. Input WiFi credentials.
4. In Home Assistant, look at discovered devices.

## Configuration

```yaml url=https://github.com/ApolloAutomation/MTR-1/blob/main/Integrations/ESPHome/MTR-1.yaml
```

## Links

- [Shop](https://apolloautomation.com/products/mtr-1)
- [EU Distributor](https://opencircuit.shop/brand/apollo-automation)
- [GitHub](https://github.com/ApolloAutomation/MTR-1)
- [Wiki](https://wiki.apolloautomation.com/)
- [Discord](https://dsc.gg/ApolloAutomation)
- [YouTube](https://www.youtube.com/@ApolloAutomation)

## Product Images

![Apollo MTR-1](Apollo-MTR-1.JPG "Apollo MTR-1")

![Apollo MTR-1 Targets](Apollo-MTR-1-Targets.png "Apollo MTR-1 Targets")
