---
title: Brilliant Lighting BL20925 Power Monitoring Plug
date-published: 2020-04-17
type: plug
standard: au
board: esp8266
---
![Brilliant BL20925 plug](./Brilliant-Lighting-BL20925-Power-Monitoring-Plug.jpeg "Product Image")

[Brilliant 20925 product brochure](https://www.ds.net.au/assets/files/web_documents/product_brochure_1/brilliant/BRI20925.pdf).

## GPIO Pinout

| Pin    | Function                   |
|--------|----------------------------|
| GPIO03 | Push Button                |
| GPIO13 | Blue LED (Inverted: true)  |
| GPIO14 | Relay                      |
| GPIO12 | HLWBL SEL Pin              |
| GPIO04 | HLW8012 CF Pin             |
| GPIO05 | HLWBL CF1 Pin              |

## Basic Config

```yaml file=config.yaml
```

## Optional features

Download the selected YAML files into the same directory and include them as local packages alongside `config.yaml`.
Add your Wi-Fi credentials in your own configuration.

Home Assistant API, OTA updates and daily energy totals using Home Assistant time:

```yaml file=home-assistant.yaml
```

Physical button, relay LED feedback and connection indicator:

```yaml file=button-and-status.yaml
```
