---
title: Apollo PoE Temperature Probe Multisensor (TEMP_PRO-1)
date-published: 2025-05-09
type: sensor
standard: global
board: esp32
project-url: https://github.com/ApolloAutomation/TEMP_PRO-1
difficulty: 1
made-for-esphome: true
---

![Apollo TEMP_PRO-1](Apollo-TEMP_PRO-1.JPG "Apollo TEMP-1")

## Description

The Apollo Automation TEMP_PRO-1 is a PoE temperature multisensor with the following features:

- PoE or wifi. The board can be powered from PoE through the vertical RJ45, this also provides the internet connection
  to the board for rock solid connection. It can also be powered from USBC with ethernet or wifi for the connection
- SHT30 Temperature and Humidity Probe. Has a dust proof housing. Great for measuring attics, crawlspaces, basements, or
  anywhere else
- DS18b20 - Waterproof temperature probe. Can be used in freezers, fish tanks, pools, or anywhere else
- 2 Expansion ports for additional sensors such as CO2, GPIO, or other
- DFRobot I2C expansion port - Allows things like Mics gas sensor and more
- Sensiroin PM connector, allows plugging in a SEN55 module
- QWIIC Port - Allows plugging in SparkFun QWIIC sensors
- RGB Pixel: Notify you of the status
- Buzzer: Can play beeps, and RTTTL tones when outside a specified temperature range
- Bluetooth tracking and Bluetooth proxy

## Quickstart

1. Plug in the TEMP_PRO-1 into USB power.
2. Connect to "TEMP1 Hotspot".
3. Input WiFi credentials.
4. In Home Assistant, look at discovered devices.
5. If you'd like to switch to the ethernet version please follow the guide on our wiki

## Configuration

```yaml url=https://github.com/ApolloAutomation/TEMP_PRO-1/blob/main/Integrations/ESPHome/TEMP_PRO-1_W.yaml
```

## Links

- [Shop](https://apolloautomation.com/products/temp-pro-1)
- [GitHub](https://github.com/ApolloAutomation/TEMP_PRO-1)
- [Wiki](https://wiki.apolloautomation.com/)
- [Discord](https://dsc.gg/ApolloAutomation)
- [YouTube](https://www.youtube.com/@ApolloAutomation)

## Product Images

![Apollo TEMP_PRO-1](Apollo-TEMP_PRO-1.JPG "Apollo TEMP-1")
