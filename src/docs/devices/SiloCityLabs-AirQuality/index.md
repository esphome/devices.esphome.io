---
title: Air Quality by SiloCityLabs
date-published: 2025-03-11
type: sensor
standard: global
board: esp32
project-url: https://github.com/SiloCityLabs/esp32-airquality/blob/main/esphome-v1.yaml
made-for-esphome: true
difficulty: 1
---

## General Notes

The Air Quality Monitor Kit is designed to provide real-time data on air quality, utilizing the Seeed Xiao ESP32-C3 and
the PMS7003 particulate matter sensor. This kit is ideal for environmental monitoring with high accuracy and low power
consumption. Features:

- Utilizes Seeed Xiao ESP32-C3.
- Measures PM1.0, PM2.5, and PM10.
- Includes WS2812B LED on GPIO20.
- Serial communication via UART.

## GPIO Pinout

|              | XIAO PIN | C3     | C6     | S3     |
|--------------|----------|--------|--------|--------|
| ESPHOME      | N/A      | ✅      |        | ✅      |
| TASMOTA      | N/A      | ✅      | ✅      | ✅      |
| PMS7003 RST. | D0       | GPIO2  | GPIO0  | GPIO1  |
| PMS7003 RX.  | D1       | GPIO3  | GPIO1  | GPIO2  |
| PMS7003 TX.  | D2       | GPIO4  | GPIO2  | GPIO3  |
| PMS7003 SET  | D4       | GPIO6  | GPIO22 | GPIO43 |
| WS2812B      | D7       | GPIO20 | GPIO17 | GPIO44 |

## Configuration

```yaml url=https://github.com/SiloCityLabs/esp32-airquality/blob/main/esphome-v1.yaml
```

## Pictures

![Picture of Air Quality Monitor](https://shop.silocitylabs.com/cdn/shop/files/PXL-20250101_132041506_2.jpg "Picture of Air Quality Monitor")
![Picture of ESP32 PCB](https://shop.silocitylabs.com/cdn/shop/files/2024-06-17T16_01_47.135Z-1000048262.jpg "Picture of ESP32 PCB")
