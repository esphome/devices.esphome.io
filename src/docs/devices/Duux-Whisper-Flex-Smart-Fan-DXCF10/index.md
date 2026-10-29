---
title: Duux Whisper Flex Smart Fan (DXCF10)
date-published: 2024-06-05
type: misc
standard: eu
board: esp8266
made-for-esphome: False
difficulty: 3
---

![Duux Whisper Flex Smart Fan](duux_DXCF10.png "Duux Whisper Flex Smart Fan")

## GPIO Pinout

| Pin    | Function |
| ------ | -------- |
| GPIO00 | Nono     |
| GPIO01 | None     |
| GPIO02 | None     |
| GPIO03 | None     |
| GPIO04 | None     |
| GPIO05 | None     |
| GPIO09 | None     |
| GPIO10 | None     |
| GPIO12 | None     |
| GPIO13 | Tuya Rx  |
| GPIO14 | None     |
| GPIO15 | Tuya Tx  |
| GPIO16 | None     |
| FLAG   | None     |

## Basic Configuration

```yaml file=config.yaml
```

## Better Configuration for Home Assistant

The used Tuya MCU has a bug where it doesn't respond to the power off command when the display dims.
Then it only wakes up the display and one has to press power off again. To remmedy this, the tuya fan component
is kept internal and a template is exposed to Home Assistant. It checks if the device really powered off and
if it didn't, it resends the power off command.

```yaml file=home_assistant_config.yaml
```
