---
title: glowswitch WiFi
date-published: 2026-04-08
type: misc
standard: global
board: esp32
project-url: https://github.com/glowswitch/glowswitch-esphome  
made-for-esphome: true
difficulty: 1
---

The [glowswitch WiFi](https://glowswitch.net) is a small device that attaches to a light switch
and uses a servo to turn it on and off.

Features:

- SG90 Servo to press light switch
- Manual override button
- Servo position adjustable through `number` entity
- Powered by USB-C port

![image](https://github.com/user-attachments/assets/333948db-ffb1-4703-b86c-60c6d182976b)

## Configuration

```yaml url=https://github.com/glowswitch/glowswitch-esphome/blob/main/firmware.yaml
```
