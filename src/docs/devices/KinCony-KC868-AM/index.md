---
title: KinCony KC868-AM
date-published: 2023-04-18
type: relay
standard: global
board: esp32
---

## GPIO Pinout

| Pin    | Function            |
| ------ | ------------------- |
| GPIO15 | Relay               |
| GPIO5  | 1-Wire GPIO         |
| GPIO14 | 1-Wire GPIO         |
| GPIO13 | 1-Wire GPIO         |
| GPIO33 | 1-Wire GPIO         |
| GPIO23 | ETH_MDC             |
| GPIO18 | ETH_MDIO            |
| GPIO35 | RS485_RXD           |
| GPIO32 | RS485_TXD           |
| GPIO4  | IIC_SDA             |
| GPIO16 | IIC_SCL             |
| GPIO36 | Free GPIOs for user |
| GPIO37 | Free GPIOs for user |
| GPIO38 | Free GPIOs for user |
| GPIO39 | Free GPIOs for user |
| GPIO34 | Free GPIOs for user |

[Additional pinout/design details](https://www.kincony.com/esp32-io-expansion-board.html)

## Basic Configuration

```yaml
# Basic Config
esphome:
  name: KC868-AM

esp32:
  variant: esp32
  framework:
    type: arduino

# Enable logging
logger:

# Example configuration entry
ethernet:
  type: LAN8720
  mdc_pin: GPIO23
  mdio_pin: GPIO18
  clk_mode: GPIO17_OUT
  phy_addr: 0

switch:
  - platform: gpio
    name: "am-light1"
    pin: 15
    inverted: False
```
