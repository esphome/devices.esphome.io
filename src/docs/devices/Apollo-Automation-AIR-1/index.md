---
title: Apollo Air Quality Sensor (AIR-1)
date-published: 2024-07-03
type: sensor
standard: global
board: esp32
project-url: https://github.com/ApolloAutomation/AIR-1/
difficulty: 1
made-for-esphome: true
---

![Apollo AIR-1](Apollo-AIR-1.jpg "Apollo AIR-1")

## Description

The Apollo Automation AIR-1 is an air quality sensor with the following features:

- SEN55: PM1, PM2.5, PM4, PM10, VOC, NOx, Temperature, and Humidity. 10-year sensor life.
- SCD40 CO2 Sensor.
- DPS310 Temperature and Pressure Sensor (late 2025/early 2026 models may not have the DPS310 populated due to it being discontinued; mid 2026 and later models use a DPS368 with the same features).
- MiCS-4514 from DFRobot: CO (Carbon Monoxide), C2H5OH (Alcohol), H2, NO2, NH3 (Ammonia), and CH4 (Methane).
- RGB Pixel x3.
- Bluetooth tracking and Bluetooth proxy.
- GPIO Expansion: I2C, power, and GPIO pins exposed.

## Quickstart

1. Plug in the AIR-1.
2. Connect to "AIR1 Hotspot".
3. Input WiFi credentials.
4. In Home Assistant, look at discovered devices.

## Configuration

```yaml url=https://github.com/ApolloAutomation/AIR-1/blob/main/Integrations/ESPHome/AIR-1.yaml
```

## Links

- [Shop](https://apolloautomation.com/products/air-1)
- [EU Distributor](https://opencircuit.shop/brand/apollo-automation)
- [GitHub](https://github.com/ApolloAutomation/AIR-1)
- [Wiki](https://wiki.apolloautomation.com/)
- [Discord](https://dsc.gg/ApolloAutomation)
- [YouTube](https://www.youtube.com/@ApolloAutomation)

## Product Images

![Apollo AIR-1](Apollo-AIR-1.jpg "Apollo AIR-1")

![Apollo AIR-1 Size](Apollo-AIR-1-Size.jpg "Apollo AIR-1 Size")
