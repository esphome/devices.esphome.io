---
title: Zemismart Switch TB21 TB22 TB23
date-published: 2022-01-29
type: switch
standard: global
board: esp8266
---

![Product image](zemismart-tb23.jpg "Product Image")

This switch comes in three variants with 1 to 3 gangs (TB21, TB22, TB23).
They all use the same config, you just drop the extra relays/inputs

Manufacturer:
[Zemismart](https://www.zemismart.com/products/tb21)

## How to flash

### Open

Remove the button front, no screws, just use a small pointed tool to loose the holds on the sides.

![Product image](board-front.jpeg "Board Front")

There is no need to remove the circuit from the case, but it be easily lifted up from the sides. It is just held by the
pin headers connecting to the relays board below

### Pins

There are pads for RX, TX, 3.3v, GND and I00 nicely marked on the back of the board. You can just insert pins without
soldering.
Use this image to map the right connectors.

![Product image](board-back.jpeg "Board Back")

## Basic Config

The green leds are used as status light and also as backlight, when the gang is off.
It can be controlled to be always off.

```yaml file=config.yaml
```
