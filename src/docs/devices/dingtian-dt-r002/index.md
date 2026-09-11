---
title: "Dingtian DT-R002"
date-published: 2026-04-24
type: relay
standard: global
board: esp32
difficulty: 3
---

## Product description

A 2-channel relay board with an ESP32 and an Ethernet interface. Available direct from the manufacturer on
[AliExpress](https://www.aliexpress.com/item/4001232791244.html).

Unlike the variants with more channels, the two relays on this model are directly controlled by GPIOs and no I/O
expander is used.

When ordering this board ask for relay board with test firmware, otherwise the ESP32 will be locked.

Initial programming can then be done using the
[pin descriptions](https://github.com/dtlzp/relay_dev_demo/blob/main/gpio_pinout/2ch.png) and
[pinout photo](https://github.com/dtlzp/relay_dev_demo/blob/main/gpio_pinout/debug_port_2CH_V2.png).

Disconnect external power while programming. Connect GND and 3V3 to your programmer's power supply (which must be set
to 3.3V). Connect IO1 (TX) to your programmer's RX, and IO3 (RX) to your programmer's TX. Connect IO0 to GND while
booting to enter bootloader. Once programmed, you can perform future upgrades OTA.

## Basic Configuration

The ESP32 naturally supports wifi, however as you've bought this relay board because it has Ethernet, the example
configuration here enables only Ethernet and not wifi.

If you bought the version with a case, both the LED and the "factory" button are within the case and are inaccessible
when closed, but are exposed in this example anyway.

```yaml file=config.yaml
```
