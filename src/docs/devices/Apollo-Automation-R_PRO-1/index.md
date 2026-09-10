---
title: Apollo PoE mmWave Multisensor (R_PRO-1)
date-published: 2025-05-09
type: sensor
standard: global
board: esp32
project-url: https://github.com/ApolloAutomation/R_PRO-1
difficulty: 1
made-for-esphome: true
---

![Apollo R_PRO-1](Apollo-R_PRO-1.JPG "Apollo R_PRO-1")

## Description

The Apollo Automation R_PRO-1 is a PoE mmWave multisensor with the following features:

- PoE or wifi. The board can be powered from PoE through the vertical RJ45, this also provides the internet connection
  to the board for rock solid connection. It can also be powered from USBC with ethernet or wifi for the connection
- ld2412 mmWave - This mmWave has great still detection and is lightning fast. It is fully configurable from Home
  Assistant and has a auto calibrate feature.
- ld2450 mmWave - This mmWave can track the x/y coordinates of 2 targets in a room. Meaning you don't just know someone
  is in the room, you know if they are on the couch or near the TV.
- ltr390 - Provides both LUX and UV values. This will let you know how bright the room is and if there is sunlight or
  not.
- Expansion port on the back for additional sensors such as CO2, GPIO, or other
- RGB Pixels: Notify you of the status
- Buzzer: Can play beeps, and RTTTL tones when outside a specified temperature range
- Bluetooth tracking and Bluetooth proxy

## Mounting

The R_PRO-1 has been designed to fit both in recessed ceiling mounts and wall gang boxes. This provides a clean and non
intrusive way to place the sensor in a room.

## Quickstart

1. Plug in the R_PRO-1 into USB power.
2. Connect to "R_PRO-1 Hotspot".
3. Input WiFi credentials.
4. In Home Assistant, look at discovered devices.
5. If you'd like to switch to the ethernet version please follow the guide on our wiki

## Configuration

```yaml url=https://github.com/ApolloAutomation/R_PRO-1/blob/main/Integrations/ESPHome/R_PRO-1_W.yaml
```

## Links

- [Shop](https://apolloautomation.com/products/r-1)
- [GitHub](https://github.com/ApolloAutomation/R_PRO-1)
- [Wiki](https://wiki.apolloautomation.com/)
- [Discord](https://dsc.gg/ApolloAutomation)
- [YouTube](https://www.youtube.com/@ApolloAutomation)

## Product Images
