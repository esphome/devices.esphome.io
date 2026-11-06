---
title: SmartPad EM32 16A Smart Plug with Energy Metering
date-published: 2025-02-14
type: plug
standard: global
board: esp32
project-url: https://github.com/Smartpadza/Device_Configs/blob/main/smartpad-em32-smart-plug.yaml
difficulty: 1
made-for-esphome: true
---

![alt text](SPEM32.webp "SmartPad EM32 16A Smart Plug with Energy Metering")

Maker: [https://smartpad.co.za/](https://smartpad.co.za/)
Product page: [https://store.smartpad.co.za/index.php/product/tasmota-16a-smart-plugs-with-energy-monitoring/](https://store.smartpad.co.za/index.php/product/tasmota-16a-smart-plugs-with-energy-monitoring/)

Available pre-flashed with ESPHome or Tasmota.

## GPIO Pinout

| Pin    | Function   |
| ------ | ---------- |
| GPIO1  | Status LED |
| GPIO20 | Button     |
| GPIO4  | Relay      |
| GPIO7  | BL0937 CF  |
| GPIO3  | BL0937 CF1 |
| GPIO5  | BL0937 SEL |
| GPIO6  | Relay Led  |

## Configuration

```yaml url=https://github.com/Smartpadza/Device_Configs/blob/main/smartpad-em32-smart-plug.yaml
```
