---
title: Airtap T Series 4btn PCB by SiloCityLabs
date-published: 2025-03-02
type: misc
standard: global
board: esp32
project-url: https://github.com/SiloCityLabs/esp32-airtap/blob/main/Airtap-Tx/Gen-2/esphome-4btn-rev1.yaml
made-for-esphome: true
difficulty: 1
---

## General Notes

The Airtap T Series Custom PCB by SiloCityLabs is a custom PCB designed to replace the OEM PCB in the AC Infinity Airtap
T Series. The PCB is designed to fit in the OEM enclosure and provide additional functionality. The PCB is designed to
work with ESPHome and is compatible with the ESP32. This board supports the 4 button configuration.

## GPIO Pinout

| ESP32 Pin | Function      | Xiao Pin |
|-----------|---------------|----------|
| GPIO2     | PWM           | D0       |
| GPIO4     | Temp          | D3       |
| GPIO6     | OLED SDA      | D4       |
| GPIO7     | OLED SCL      | D5       |
| GPIO20    | Button Up     | D7       |
| GPIO8     | Button Down   | D8       |
| GPIO9     | Button Toggle | D9       |
| GPIO10    | Button Menu   | D10      |

## Configuration

```yaml url=https://github.com/SiloCityLabs/esp32-airtap/blob/main/Airtap-Tx/Gen-2/esphome-4btn-rev1.yaml
```

## Pictures

![Picture of ESP32 PCB](https://shop.silocitylabs.com/cdn/shop/files/Airtap_T_Series_PCB_Front_with_4_buttons.jpg "Picture of PCB")
