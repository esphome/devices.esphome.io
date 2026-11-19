---
title: Geeni SW003-199 6-Outlet Surge Protector
date-published: 2024-10-29
type: plug
standard: us
board: bk72xx
difficulty: 4
---

[Amazon Link](https://www.amazon.com/dp/B07DB3W915)

[Manufacturer Link](https://mygeeni.com/collections/surge-protectors/products/geeni-gn-sw003-199-surge-smart-protector-white?variant=21552685711439)

## Product Image

![Geeni 6-Outlet Surge Protector](image.jpg)

<details>
  <summary>View back plate product information</summary>

![Back](back.jpg)

</details>

<details>
  <summary>View disassembled pictures</summary>

![Opened](opened.jpg)
![CB3S](cb3s.jpg)

</details>

## Description

This device has 6 outlets, and a combined blue led button. The button toggles all pins when pressed.

The device is based on the [Tuya CB3S module](https://developer.tuya.com/en/docs/iot/cb3s?id=Kai94mec0s076). The device
couldn't be converted with tuya-cloudcutter and required serial flashing.

The CB3S is soldered onto the main board, but is easily accessible and pins are exposed. The device can easily be be
opened by unscrewing the screws at the back.

Warning: The `SW003-199-199S` variant has a different chip and pinout configuration. Be sure to verify the module being
used before flashing.

## Serial flashing

The official [Tuya CB3S module](https://developer.tuya.com/en/docs/iot/cb3s?id=Kai94mec0s076) documentation contains a
diagram with the position of each pin on the module. The module has multiple UARTs, UART1 is the one used for flashing.

| Pin | Function |
| --- | -------- |
| 1   | RST/CEN  |
| 8   | 3V3      |
| 9   | GND      |
| 15  | RXD1     |
| 16  | TXD1     |

Esphome can directly flash the device over serial. When asked, power cycle the device while holding RST/CEN low, then
disconnect RST/CEN to let the chip boot into the flashing program.

## GPIO Pinout

| Pin | Function                 |
| --- | ------------------------ |
| P6  | Outlet 1 (cord side)     |
| P24 | Outlet 2                 |
| P26 | Outlet 3                 |
| P8  | Outlet 4                 |
| P7  | Outlet 5                 |
| P9  | Outlet 6                 |
| P14 | Status LED (inverted)    |
| P23 | Toggle button (inverted) |

## Basic Configuration

The example contains the device hardware settings. Add your Wi-Fi, API and OTA configuration separately.

```yaml file=config.yaml
```
