---
title: TESLA Smart Switch Dimmer Touch
date-published: 2025-10-26
type: dimmer
standard: eu
board: bk72xx
difficulty: 2
---

## Product Description

This is a wall mounted light dimmer for EU standard wall boxes. The dimmer comes with a WB3S module suitable for
ESPHome and can be flashed using Tuya Cloudcutter.

Manufacturer: [Tesla Electronics](https://tesla-electronics.online/en/)

## Product Images

![TESLA EDM-01AA-EU](tesla-dimmer.webp "TESLA Smart Switch Dimmer Touch")

## Flashing

The device contains a WB3S module (BK72xx, WiFi), which can be flashed using Tuya Cloudcutter, without opening up the
device, or directly using ltchiptool. Alternatively, it should also be possible to replace the module with e.g. a
WT0132C6-S5 (ESP32C6) module.

## Configuration example

```yaml file=config.yaml
```
