---
title: Tuya AP Future CCT LED Controller
date-published: 2021-11-02
type: light
standard: global
board: esp8266
---

## General Notes

Tuya AP Future CCT LED Controller with a tywe3s chip.

Available on [aliexpress](https://www.aliexpress.com/item/4000080534824.html) from multiple vendors.

Other versions of this controller are available that do RGB, RGBW, RGBCW.

Flashed using the [Digiblur Clamp method](https://digiblur.com/2020/07/16/free-your-smart-devices-from-the-cloud-without-soldering-the-tuya-clamp-for-tasmota-esphome)

![alt text](./Tuya-AP-Future-CCT.png "Tuya AP Future CCT LED Controller")

## GPIO Pinout

| Pin    | Function           |
| ------ | ------------------ |
| GPIO5  | Cold White Channel |
| CPIO13 | Warm White Channel |

## Basic Configuration

```yaml file=config.yaml
```
