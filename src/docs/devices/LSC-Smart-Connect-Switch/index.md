---
title: LSC Smart Connect Switch
date-published: 2021-07-14
type: plug
standard: eu
board: esp8266
---

## Warning

The latest LSC Smart Connect Switch devices use the Tuya WB2S module, which is not compatible with ESPHome!

## Notice

- This plug is flashable using the latest tuya-convert with a compiled ESPHome binary
- There are several models that look similar but are technically very different!

## Product Images

![plug with box](https://www.action.com/globalassets/cmsarticleimages/79/77/2578677_8712879142799-111.png?preset=mediaSliderImageLargeHD)
![plug](https://www.action.com/globalassets/cmsarticleimages/79/78/2578677_8712879142799-110_02.png?preset=mediaSliderImageLargeHD)

## GPIO Pinout

| Pin    | Function                            |
| ------ | ----------------------------------- |
| GPIO4  | LED (on: 0 /off: 1)                 |
| GPIO12 | Relay (on: 1 /off: 0)               |
| GPIO13 | Switch/button (pressed: 0 / off: 1) |

## Basic configuration

```yaml file=config.yaml
```

[https://thibmaek.com/posts/flashing-esphome-to-lsc-smart-connect-action-switches-power-plugs](https://thibmaek.com/posts/flashing-esphome-to-lsc-smart-connect-action-switches-power-plugs)
