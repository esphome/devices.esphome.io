---
title: Dikale Filament Dryer PCB by SiloCityLabs
date-published: 2025-02-26
type: misc
standard: global
board: esp32
project-url: https://github.com/SiloCityLabs/esp32-dikale-dryer/blob/main/config.yaml
made-for-esphome: true
difficulty: 1
---

## General Notes

The **Dikale Filament Dryer PCB** by **SiloCityLabs** is a custom PCB designed to replace the original PCB of the Dikale
Filament Dryer. The PCB is based on an **ESP32** and can be controlled via **Home Assistant** using the **ESPHome**
firmware. The PCB features a **temperature sensor** and a **humidity sensor** to monitor the conditions inside the
dryer. The PCB also features a **display** to show the current temperature and humidity, as well as a **button
controll** to adjust the settings.

The PCB is designed to fit inside the Dikale Filament Dryer and can be powered by the original power supply. The PCB can
be connected to the original heater and fan, and can be controlled via the original buttons.

## GPIO Pinout

| XIAO Pin | Pin    | Function     | Description               |
| -------- | ------ | ------------ | ------------------------- |
| D0       | GPIO2  | Fan 1        | Original 12v Fan          |
| D1       | GPIO3  | Fan 2        | 4 pin PWM fan             |
| D2       | GPIO4  | 10k NTC      | OEM Temp sensor           |
| D3       | GPIO5  | Heat Element | Relay for heating element |
| D4       | GPIO6  | i2c SDA      | Shared Bus                |
| D5       | GPIO7  | i2c SCL      | Shared Bus                |
| D9       | GPIO9  | BTN pwr      | Power Button              |
| D10      | GPIO10 | BTN mode     | Mode Button               |
| D7       | GPIO20 | BTN up       | Up Button                 |
| D8       | GPIO8  | BTN down     | Down Button               |

## Configuration

```yaml url=https://github.com/SiloCityLabs/esp32-dikale-dryer/blob/main/config.yaml
```

## Pictures

![Picture of ESP32 PCB Front](https://shop.silocitylabs.com/cdn/shop/files/dikale-esp32-pcb-front.webp "Picture of ESP32 PCB Front")
![Picture of ESP32 PCB Back](https://shop.silocitylabs.com/cdn/shop/files/dikale-esp32-pcb-back.webp "Picture of ESP32 PCB Back")
![Picture of OEM Dikale Unit](https://shop.silocitylabs.com/cdn/shop/files/compatible-dikale-unit.jpg "Picture of OEM Dikale Unit")
