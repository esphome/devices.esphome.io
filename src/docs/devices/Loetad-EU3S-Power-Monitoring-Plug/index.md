---
title: Loetad EU3S Power Monitoring Plug
date-published: 2020-08-03
type: plug
standard: eu
board: esp8266
---
  ![alt text](./Loetad-EU3S-Power-Monitoring-Plug.jpg "Product Image")
  ![alt text](./Loetad-EU3S-Power-Monitoring-Plug-Reference.jpg "Product Reference Image")

Model reference: EU3S

- [AWOW EU3S 16A Power Monitoring Plug](https://devices.esphome.io/devices/awow-eu3s-power-monitoring-plug/)
- [CloudFree EU Plug (P1EU)](https://devices.esphome.io/devices/cloudfree-eu-plug-p1eu/)
- Maxus Brio Head 16A Power Monitoring Plug (BRIO-W-HEAD16)
- iQtech SmartLife Power Monitoring Plug (WS020)

Manufacturer: Loetad

## GPIO Pinout

| Pin    | Function                   |
|--------|----------------------------|
| GPIO02 | Blue LED (Inverted: true)  |
| GPIO05 | HLW8012 CF Pin             |
| GPIO12 | HLWBL SELi Pin             |
| GPIO13 | Push Button                |
| GPIO14 | HLWBL CF1 Pin              |
| GPIO15 | Relay                      |

## Basic Config

The base configuration describes hardware only. Add your own Wi-Fi, API, OTA, and captive-portal settings as needed;
the site examples intentionally exclude credentials.

```yaml file=config.yaml
```

## Optional Daily Energy

To restore the former daily-energy example, configure Wi-Fi and the Home Assistant API.
Add the `time:` block below to your base config and merge its `sensor:` entry into the existing sensor list.
The base list defines the `wattage` power sensor.

```yaml file=daily-energy.yaml
```
