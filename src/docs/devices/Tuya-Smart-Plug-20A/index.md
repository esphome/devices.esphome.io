---
title: Tuya Smart Plug 16/20A with Power Monitoring
date-published: 2025-02-04
type: plug
standard: eu
board: bk72xx
made-for-esphome: false
difficulty: 4
---

![Tuya Smart Plug 16/20A](tuya-smart-plug-20.jpg)

Bought on Aliexpress, looking similar to [Athom Smart Plug](../Athom-Smart-Plug-PG01V3-EU16A/) but internals turned out much
different: this one is using
[Tuya T34 Module](https://developer.tuya.com/en/docs/iot/t34-module-datasheet?id=Ka0l4h5zvg6j8) chip which was already
discussed on [Elektroda Forum](https://www.elektroda.com/rtvforum/topic4036975.html).
It is in fact a BK7231N MCU in QFN32 package (aka. LGA36, which is 36 pin if we count in the 4 bottom heatpads).

The power monitoring chip is
[BL0937](https://developer.tuya.com/en/docs/iot-device-dev/Electricity-statistics?id=Kaunfo4am6icc) which is known from
other Tuya designs and does not require further introduction.

![Tuya Smart Plug Closeup](hardware-closeup.jpg)

## Programming

Based on available documentation (links above) we know the T34 chip can be programmed using OpenBeken tools using

- pin 25 as UART_RXD
- pin 26 as UART_TXD
- I also used pin 7 to trigger reset which I beleived to be CEN - it looks I was wrong and CEN is on pin 9 but for some
  reason my method worked as well (probably due to brown-out reset from shorting pin 7...)

No need to desolder the chip from PCB but need to solder tiny "kynar" wires to appropriate pins, which only one is
easily available and two needs to be carefully soldered to the side of the chip, without shorting other pins.

![Tuya Smart Plug Programming](programming.jpg)

Of course you also need USB-to-serial converter, and 3v3 supply (I'm using power out on my USB-to-serial converter)
Reflash using [ltchiptool](https://docs.libretiny.eu/docs/flashing/tools/ltchiptool/) or directly with
`esphome upload <your-config.yaml>` console command.

Note: Need to reset the chip to enter programming, ie. by shorting CEN to GND for a moment!

## GPIO Pinout

| Pin | Function          |
| --- | ----------------- |
| P06 | BL0937 cf_pin     |
| P07 | BL0937 cf1_pin    |
| P08 | BL0937 sel_pin    |
| P24 | Relay & LED2      |
| P26 | Button (Inverted) |
| P28 | LED (Inverted)    |

## Basic ESPHome config

Note this is only the device-specific part shown here - make sure to extend with your ESPHome-specific settings (such as
wifi, passwords, OTA, etc...)

```yaml file=config.yaml
```
