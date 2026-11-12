---
title: "Tuya WiFi PIR Motion Sensor"
date-published: 2026-07-18
type: sensor
standard: global
board: bk72xx
made-for-esphome: false
difficulty: 4
---

## Tuya WiFi PIR Motion Sensor

I believe this is from AliExpress. This is a WiFI version but they also come in Zigbee versions.
It has the [CBU module](https://docs.libretiny.eu/boards/cbu/) with the Beken BK7231N.

I'm not sure if this device supports cloudcutter - I just flashed it via UART. It might support it if not upgraded

![PIR](pir.jpg "PIR")

### Disassembly

After removing the battery cover by sliding it off, use a tool to pry around the edge and loosen the four clips.
At the same time press gently on the PIR lense to push out the PCB.

You can flash directly to the CBU board with a USB to serial adapter.
You'll probably need to solder wires to the module but it can remain connected to the PCB.
Make sure your UART RX and TX lines are 3.3V. I only connected GND, TX and RX and used the two AAAs to power it.
Insert the last battery as you're trying to connect with ltchiptool to put it in program mode.

### Board overview

The board uses the PIR sensor BS-612 from Senba Sensing Technology.
The PIR itself and all the surrounding components are powered by a 2.5V LDO.

The board has obviously been designed for low power usage.
The voltage divider for the battery measurement is enabled with P17 which then allows measurement with the ADC on P23.

The SW and REL inputs should not have software pullups or pulldowns enabled as that will increase power usage.

There are two switched resistor outputs namemd VR1 and VR2.
VR1 can be used to control the PIR on time (see BS-612 datasheet).
VR2 can be used to control the PIR sensitivity.

By default the on time is fixed to 30S and the sensitivity is fixed to low.
You can enable the programmable on time or sensitivity by moving the 0 ohm resistors into the empty spots to their right.
The VR1 and VR2 outputs could be controlled via a lookup table.
Alternatively, you could fix the on time to the lowest (2s) by removing the 1M ohm resistor connected to ONTIME.

The LED is controlled via a P-channel mosfet switched by an N-channel mosfet.

![PCB from front](front.jpg "PCB from front")
![PCB from rear](back.jpg "PCB from rear")

## GPIO pinout

| PIN | GPIO | Component      |
|-----|------|----------------|
| 1   | P14  | VR1A           |
| 2   | P16  | REL (PIR out)  |
| 3   | P20  | SW (Button)    |
| 5   | P23  | BAT%           |
| 6   | P1   | VR1B           |
| 7   | P0   | VR1C           |
| 8   | P8   | VR2C           |
| 9   | P7   | VR2B           |
| 11  | P26  | LED1           |
| 12  | P24  | VR2A           |
| 14  | GND  | GND            |
| 15  | 3V3  | +V             |
| 20  | P17  | BAT% EN        |

## Basic Configuration

```yaml file=config.yaml
```
