---
title: IoTorero Smart Plug US V3 (PG03V3-US16A)
date-published: 2024-04-25
type: plug
standard: us
board: esp32
project-url: https://github.com/athom-tech/esp32-configs/blob/main/athom-smart-plug.yaml
difficulty: 1
made-for-esphome: true
alias:
  - title: Athom Smart Plug US V3 (PG03V3-US16A)
    slug: Athom-Smart-Plug-PG03V3-US16A
---

![alt text](athom-plug-us-v3.webp "IoTorero Smart Plug US V3 - PG03V3-US16A")

The same plug is sold as **IoTorero** and as **Athom** - IoTorero is a rebranding of Athom, and the hardware and
firmware are identical. Units labelled either way use the configuration below.

Maker: [https://www.athom.tech/](https://www.athom.tech/)
Product page: [https://www.athom.tech/blank-1/esp32-c3-us-plug-for-esphome](https://www.athom.tech/blank-1/esp32-c3-us-plug-for-esphome)

Also on Aliexpress, available pre-flashed with ESPHome or Tasmota.

## GPIO Pinout

| Pin    | Function   |
| ------ | ---------- |
| GPIO20 | CSE7766 Rx |
| GPIO3  | Button     |
| GPIO5  | Relay      |
| GPIO6  | Led        |

## Configuration

```yaml url=https://github.com/athom-tech/esp32-configs/blob/main/athom-smart-plug.yaml
```
