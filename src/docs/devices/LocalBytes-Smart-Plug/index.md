---
title: LocalBytes Smart Plug
date-published: 2024-03-14
type: plug
standard: uk,eu
board: esp8266
project-url: https://github.com/LocalBytes/esphome-localbytes-plug/blob/main/localbytes-plug-pm.yaml
difficulty: 1
---

![alt text](LocalBytes-Plug.png "LocalBytes Plug")
Maker: [https://mylocalbytes.com/](https://mylocalbytes.com/)

Preflashed with ESPHome or Tasmota

## GPIO Pinout

| Pin    | Function   |
| ------ | ---------- |
| GPIO3  | Button     |
| GPIO4  | BL0937 CF  |
| GPIO5  | HLWBL CF1  |
| GPIO12 | HLWBL SELi |
| GPIO13 | LedLink    |
| GPIO14 | Relay      |

## Basic Configuration

```yaml
substitutions:
  name: localbytes-plug-pm-<NAME>
  friendly_name: Localbytes Plug PM <NAME>

packages:
  localbytes.plug-pm: github://LocalBytes/esphome-localbytes-plug/localbytes-plug-pm.yaml@main

esphome:
  name: ${name}
  name_add_mac_suffix: false
  friendly_name: ${friendly_name}

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
```
