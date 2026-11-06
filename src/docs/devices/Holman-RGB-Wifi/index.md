---
title: Holman RGB Wifi Connected Controller
date-published: 2023-04-13
type: light
standard: au
board: esp8266
---

## General Notes

Available from [Bunnings](https://www.bunnings.com.au/holman-rgb-wi-fi-garden-light-controller_p0189462)

Uses [TYWE3L](https://developer.tuya.com/en/docs/iot/wifie3lpinmodule?id=K9605uj1ar87n) module.
Can be programmed without removing from PCB.

![Holman RGB Controller](holman_rgb_controller.png "RGB Controller")

## GPIO Pinout

| Pin    | Function     |
| ------ | ------------ |
| GPIO0  | Panel Button |
| GPIO12 | PWM Green    |
| GPIO13 | PWM Red      |
| GPIO14 | PWM Blue     |

## Status LED Not Implemented

The user manual says that the power led on the panel will flash on initialisation (wifi status?). I have not been able
to determine what pin this led is connected so this configuration does not support status_led.

## Configuration

The example contains the device hardware settings. Add your Wi-Fi, API and OTA configuration separately.

```yaml file=config.yaml
```

### Human-readable uptime

Combine this fragment with the hardware configuration above to publish the formatted uptime text sensor.

```yaml file=human-readable-uptime.yaml
```
