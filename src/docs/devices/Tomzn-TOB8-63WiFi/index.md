---
title: TomZN (Hiking) TOB8-63WiFi
date-published: 2024-06-27
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

![Front View](./TOB8-63WiFi_front.jpg "TOB8 Front View")
![Inside View](./TOB8-63WiFi_inside.jpg "TOB8 Inside View")
![Module View](./TOB8-63WiFi_module.jpg "TOB8 ESP Module")

## GPIO Pinout

| Pin    | Function          | Notes    |
| ------ | ----------------- | -------- |
| GPIO00 | Button            |          |
| GPIO12 | Relay             |          |
| GPIO13 | Status LED - Blue | inverted |
| GPIO03 | CSE7759B meter    |          |
| GPIO06 | soldered, unknown |          |
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
