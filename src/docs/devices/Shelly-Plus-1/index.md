---
title: Shelly Plus 1
date-published: 2021-11-01
type: relay
standard: uk, us, eu, au
board: esp32
---

![Shelly Plus 1](shelly_plus_1_pinout.jpg "Shelly Plus 1")

## GPIO Pinout

| Pin    | Function                                          |
| ------ | ------------------------------------------------- |
| GPIO0  | LED (Inverted), Shelly Plus Add-On: DATA (Output) |
| GPIO1  | Shelly Plus Add-On: DATA (Input)                  |
| GPIO3  | Shelly Plus Add-On: ANALOG IN                     |
| GPIO4  | Switch input                                      |
| GPIO19 | Shelly Plus Add-On: DIGITAL IN                    |
| GPIO25 | Button (Inverted, Pull-up)                        |
| GPIO26 | Relay                                             |
| GPIO32 | NTC                                               |
| GPIO33 | Relay supply voltage sensor                       |

The Shelly Plus 1 is based on the ESP32-U4WDH (Single core, 160MHz, 4MB embedded flash)

> **Note:**
>Espressif has made a change, i.e. newer chips (line 5=DHxxxxxxx) have been updated to Dual-Core with 240 MHz.
>See details: Product-Change-Notice (PCN) [ESP-07-2-007-03][pcn]
>
>For the newer chips `cpu_frequency` and `sdkconfig_options` can be commented out in the YAML, if full
>performance >of the ESP32 is required.

Please calibrate the NTC, the value below is just a rough estimate!

Credit and thanks to

- [https://templates.blakadder.com/shelly_plus_1.html](https://templates.blakadder.com/shelly_plus_1.html)

## Configuration as relay with overtemperature protection

```yaml file=config.yaml
```

[pcn]: https://documentation.espressif.com/PCN-2021-021%20ESP32-U4WDH%20%e5%8d%87%e7%ba%a7%e4%b8%ba%e5%8f%8c%e6%a0%b8%e5%a4%84%e7%90%86%e5%99%a8%e4%ba%a7%e5%93%81.pdf
