---
title: Tuya YG400A-W Wifi Smoke Detector
date-published: 2025-12-10
type: sensor
standard: global
board: bk72xx
difficulty: 3
---

This is currently about YG400A-W A008. The packaging states "Model No.: YG400A"
but that may as well apply to different variants.
Older models for instance seem to feature an esp
(see the [Tasmota device template page](https://templates.blakadder.com/YG400A.html))

## GPIO Pinout

| Pin | Function        |
| --- | --------------- |
| 23  | Battery voltage |
| 26  | Voltage divider |
| 17  | Red Led         |
| 9   | Tamper button   |
| 15  | Smoke detection |
| 28  | Reset button    |

Details mainly taken from
[this discussion at electroda.com](https://www.elektroda.com/rtvforum/topic3941698-90.html).
Thanks to the authors!
