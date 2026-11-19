---
title: Mirabella Genio Wi-Fi 500 LED Mulitcoloured Fairy Lights
date-published: 2021-03-02
type: light
standard: au
board: esp8266
---

## General Notes

This page covers the Mirabella Genio Wi-Fi 500 LED multicoloured fairy lights pictured below.

![Mirabella Genio Wi-Fi 500 LED Mulitcoloured Fairy Lights](./Mirabella-Genio-Wi-Fi-500-LED-Mulitcoloured-Fairy-Lights.jpg "Genio Wi-Fi 500 LED Fairy Lights")

## GPIO Pinout

| Pin    | Function       |
| ------ | -------------- |
| GPIO4  | Button LED     |
| GPIO5  | Button         |
| GPIO12 | H-Bridge Pin A |
| GPIO14 | H-Bridge Pin B |

## Basic Configuration

```yaml file=config.yaml
```

## Optional features

Download the selected YAML files into the same directory and include them as local packages alongside `config.yaml`.
Add your Wi-Fi credentials in your own configuration.

Home Assistant API and OTA updates:

```yaml file=home-assistant.yaml
```

Flash the indicator until Wi-Fi connects:

```yaml file=connection-status.yaml
```
