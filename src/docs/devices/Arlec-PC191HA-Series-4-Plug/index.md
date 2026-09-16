---
title: Arlec PC191HA Series 4
date-published: 2026-06-16
type: plug
standard: au
board: bk72xx
made-for-esphome: false
difficulty: 4
---

![Product Image](Arlec-PC191HA-Plug.jpg "Product Image")

The Arlec PC191HA power plug is part of the [Grid Connect ecosystem](https://grid-connect.com.au/) and is sold at
Bunnings in Australia and New Zealand.  
These are available in White (PC191HA) or Black (PC191BKHA), and in 4-packs of White and Black - which are identical.  
It is compact, easily fitting side-by-side in double wall sockets.

The Arlec Grid Connect Smart Plug In Socket With Energy Meter uses a T1-2S module with BK7238 chip. They are not
vulnerable to the cloudcutter exploit, and require soldering to remove the main PCB from the housing, and further
soldering to remove the module from the PCB. Not for the faint of heart, but working with the DEV release of ESPHome
2026.08 as at July 2026. They use a BL0942 energy sensor that is connected via two UART pins only.

## GPIO Pinout

| Pin | Function                             |
| --- | ------------------------------------ |
| P8  | (P8) Status LED                      |
| P10 | (RX1) BL0942 UART TX                 |
| P11 | (TX1) BL0942 UART RX                 |
| P24 | (P24) Button                         |
| P26 | (P26) Relay                          |

## Getting it up and running

As with prior generations of the PC191HA, the case is ultrasonic-welded and will require a thin tool to pry it open. 
Some cosmetic damage is bound to occur.
Once open, a reasonably powerful soldering it required to remove the main PCB from the power pins. Heat each side in
turn and raise the PCB a little from each side.
Then the module can be removed from the board by way of desoldering wick.

The module is labelled, connections to 3V3, GND, TX1 and RX1 are required. Crossover the UART pins to your TTL adaptor:

| Pin Module | Pin TTL |
| -- | -- |
|  TX1 | RX |
| RX1 | TX |

Briefly touching CEN while your flasher is running will reset the chip and allow flash upload to begin.

## Basic Config

```yaml file=config.yaml
```
