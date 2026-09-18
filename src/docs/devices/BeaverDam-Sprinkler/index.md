---
title: BeaverDam Sprinkler
date-published: 2026-08-03
type: misc
standard: global
board: esp32
project-url: https://github.com/thebeaverdam/ESP32_SprinklerSystem
difficulty: 1
made-for-esphome: true
---

## ESP32 MultiBoard

The BeaverDam Sprinkler System is designed to bring advanced,
automated control to your irrigation system,
leveraging the power of the ESP32 microcontroller and
seamless integration with Home Assistant.

This board offers a robust and flexible platform
for managing up to 8 independent irrigation zones.
It’s engineered for reliability and ease of use,
making it ideal for both DIY enthusiasts and professional
installers looking to upgrade traditional irrigation systems to a smart,
app-controlled environment.

Is designed to be compatible with both 12V DC and 24V AC
irrigation solenoid valves, depending on the specific model
of the board. This flexibility ensures it can integrate
with a wide range of existing irrigation systems,
reducing the need for costly valve replacements.

![Sprinkler](Sprinkler.jpg "Sprinkler")

---

## 🧩 Specifications

- **Power Supply:** 12V or 24V DC input
- **Qwiic Connector:** For I²C peripherals (3.3V)
- **8 zone valve control**
- **ESPHome Compatible:** Designed to easily integrate with ESPHome.

---

## Pinout

![Pinout](Sprinkler%20pinout_bck.png "Pinout")

---

## Configuration

```yaml url=https://github.com/thebeaverdam/ESP32_SprinklerSystem/blob/main/firmware/sprinkler.yaml
```
