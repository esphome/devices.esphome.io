---
title: Sonoff RE5V1C - 5V Relay Module
date-published: 2024-02-16
type: relay
standard: global
board: esp8266
difficulty: 2
---

## Product Images

![Product Image](./sonoff_RE5V1C.webp "Product Image")
![PCB Top](./sonoff_RE5V1C_top.jpg "PCB Top")
![PCB Bottom](./sonoff_RE5V1C_bottom.jpg "PCB Bottom")

## Specification

- Power Supply: 5V DC
- Dry contact output
- Max Current: 10A
- Humidity: 5%-90%RH, Non-condensing
- Operating Temperature: 0ºC-40ºC(32°F-104°F)
- Nano size: 34.5*25*19mm

## Notes

- For programming use ERX/ETX - marked on image
- Red LED connected to Relay operated by GPIO12
- Green LED operated by GPIO13
- More GPIO available on top of PCB

## GPIO Pinout

### Wired on board

| Pin    | Function       |
| ------ | -------------- |
| GPIO00 | Button         |
| GPIO12 | Relay, Red LED |
| GPIO13 | Green LED      |

### On Top of PCB

| Pin    | Name | Comment |
| ------ | ---- | ------- |
| GPIO02 | I02  |         |
|        | 3V3  |         |
| GPIO04 | RX   | PWM out |
| GPIO05 | TX   |         |
|        | GND  |         |
| GPIO03 | ERX  | U0RXD   |
| GPIO01 | ETX  | U0TXD   |

## Board Configuration

```yaml
esphome:
  name: Sonoff RE5V1C

esp8266:
  board: esp8285
  restore_from_flash: true

logger:
  esp8266_store_log_strings_in_flash: False
```
