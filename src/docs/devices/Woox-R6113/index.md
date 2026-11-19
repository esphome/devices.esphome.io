---
title: Woox R6113 Smart Plug 16A
date-published: 2026-10-14
type: plug
standard: eu
board: bk72xx
---

## Description

The WOOX R6113 is a 16A BK7231N-based smart plug with power monitoring, a relay-controlled outlet,
and a single user button with status LED.

## Images

![Woox R6113](./woox-r6113.png "Woox R6113")

![Woox R6113 back](./woox-r6113-back.png "Woox R6113 back")

## GPIO Pinout

| Pin | Function |
| --- | -------- |
| P6  | LED      |
| P7  | Button   |
| P8  | Relay    |
| P11 | SEL      |
| P24 | CF1      |
| P26 | CF       |

## Board Configuration

Full config: [config.yaml](./config.yaml)

```yaml file=config.yaml
```

## Flashing steps

I used these steps:

- Prepared the firmware using ESPHome Web and manually downloaded the UF2 package.
- Prepared the hardware as described in
  [this Elektroda article](https://www.elektroda.com/news/news3966148.html),
  using a USB-to-TTL serial adapter.
- Flashed the device from Linux using ltchiptool:

```bash
ltchiptool flash write sm1.uf2 --device /dev/ttyUSB1
```

Output:

```text
I: Detected file type: UF2 - esphome 2026.3.1
I: Connecting to 'Beken 7231N' on /dev/ttyUSB1 @ 115200
I: Connect UART1 of the BK7231 to the USB-TTL adapter:
I:
I:     --------+        +--------------------
I:          PC |        | BK7231
I:     --------+        +--------------------
I:          RX | ------ | TX1 (GPIO11 / P11)
I:          TX | ------ | RX1 (GPIO10 / P10)
I:             |        |
I:         GND | ------ | GND
I:     --------+        +--------------------
I: To enter download mode, the chip has to be rebooted while the flashing program
I: is trying to establish communication.
I: In order to do that, you need to bridge CEN pin to GND with a wire.
I: |-- Success! Chip info: BK7231N
I: Writing 'sm1.uf2'
I: |-- esphome 2026.3.1 @ 2026-10-13 20:13:15 -> cb2s
Booting firmware  [################################################################]  100%
I: |-- Finished in 79.828 s
```
