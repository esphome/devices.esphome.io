---
title: OpenSpool Mini
date-published: 2024-11-21
type: misc
standard: global
board: esp32
project-url: https://github.com/spuder/OpenSpool
made-for-esphome: true
difficulty: 4
---

OpenSpool is an open source RFID reader for 3d printer filament spools.
It synchronizes the type/color with bambu 3d printers.

## Hardware

- Esp32-s2
- PN532 RFID Reader
- Led Strip
- NTAG 215 - NFC tags

### Images

![OpenSpool Mini](./OpenSpoolMini.jpg "OpenSpool Mini")
![NFC](./NFC3.png "NFC Tag Placement")
![Wiring Diagram](./OpenSpoolMiniWiringDiagram.png "Wiring Diagram")  

![PCB](./PCB.png "PCB")

## Configuration

```yaml url=https://github.com/spuder/OpenSpool/blob/main/firmware/openspool-mini.yaml
```

## Resources

- Documentation/Firmware: [https://openspool.io](https://openspool.io)
- Code: [github.com/spuder/OpenSpool](https://github.com/spuder/OpenSpool)
