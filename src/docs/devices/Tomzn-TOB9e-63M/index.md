---
title: TomZN (Hiking) TOB9e-63M
date-published: 2024-06-20
type: misc
standard: global
board: esp8266
difficulty: 3
---

## Notes

- On/Off switch
- Voltage/Current/Power/Energy Metering
- Working Voltage: AC100-280V
- Mechanical Life: Over 100000 Times
- Working Temperature: -25℃-70℃
- Red LED's wired to Relay and display it status
- Energy measurement starts from 0 on every power-up
- Not provide Power Apparent & Factor data

![Front View](./TOB9e-63M_front.png "TOB9e Front View")
![Opened View](./TOB9e-63M_opened.jpg "TOB9e Opened View")

## GPIO Pinout

| Pin    | Function          | Notes    |
| ------ | ----------------- | -------- |
| GPIO00 | Button            |          |
| GPIO12 | Relay             |          |
| GPIO13 | Status LED - Blue | inverted |
| GPIO03 | CSE7759B meter    |          |
| GPIO07 | soldered, unknown |          |

## Required for CSE7759B meter

```yaml
esp8266:
  board: esp8285

logger:
  baud_rate: 0

uart:
  rx_pin: RX
  baud_rate: 4800

sensor:
  - platform: cse7766
```
