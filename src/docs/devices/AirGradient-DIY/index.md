---
title: AirGradient-DIY
date-published: 2021-09-23
type: sensor
standard: us
board: esp8266
---

Air environment sensor from PM2.5, CO2, Temperature and Humidity from [AirGradient](https://www.airgradient.com/documentation/kb/kb-diy-the-airgradient-builds-overview).

Variations of the components are possible. Check your components.

If you have multiple sensor boards, you will likely need to make each sensor name unique across the boards
(e.g. "1st AirGradient Temperature"), so there aren't naming conflicts.

## Basic Configuration

```yaml file=config.yaml
```

### OLED Support

If you are using the 64x48 OLED shield that's included in the kit, you can use this config. Note that you will need to
place `fonts/helvetica.ttf` (or another font of your choosing) in the ESPHome config directory.

This config will print all four sensor states to the display.

```yaml file=display.yaml
```
