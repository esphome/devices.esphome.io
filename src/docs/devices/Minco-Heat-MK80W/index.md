---
title: Minco Heat MK80W
date-published: 2026-08-09
type: relay
standard: global
board: esp32-s3
difficulty: 3
---


## Minco Heat MK80W (Platform ME80)

The Minco Heat MK80W is a Tuya MCU-based touchscreen thermostat used for floor heating and boilers.
It communicates with the Wi-Fi/ESP module via a hardware UART interface at 9600 baud.

## Hardware Modifications (Hardware Modding)

To flash this thermostat with ESPHome, the stock Tuya Wi-Fi module (such as the WBR3) must be desoldered
and replaced with a custom ESP32-S3 board (or equivalent).

**Critical Wiring Note:**
One of the signal traces controlling the network status icon (Wi-Fi leaf/symbol) on the front LCD panel
must be hardware-soldered directly to the pad that originally mapped to pin **`A_2`** on the stock Tuya WBR3 module.
In this ESPHome configuration, this pin is mapped to **`GPIO7`**.
The control logic is inverted: pulling the pin `LOW (0V)` keeps the icon solidly lit, while pulling it `HIGH` turns it off.

### Data Points (DPID) Mapping

| DPID | Type | Description |
|------|------|-------------|
| **1** | Boolean | Main Power Switch (ON / OFF) |
| **2** | Enum | Operation Mode: `0` - Auto (Schedule), `1` - Manual, `2` - ECO |
| **16** | Integer | Target Temperature (e.g., `220` = 22.0°C) |
| **19** | Integer | Maximum Temperature Limit (e.g., `330` = 33.0°C) |
| **26** | Integer | Minimum Temperature Limit (e.g., `180` = 18.0°C) |
| **27** | Integer | Temperature Calibration Offset (Signed 32-bit, base offset = `4`) |
| **36** | Enum | Relay Heating Status: `0` - Idle, `1` - Heating (Automatic) |
| **40** | Boolean | Child Lock (Disables physical wall buttons) |
| **43** | Enum | Active Sensor Source: `0` - Internal Air, `1` - External Floor, `2` - Dual Combined |
| **52** | Enum | Screen Backlight Mode: `0` - Turn Off after 15s, `1` - Dim after 15s |
| **101** | Integer | Current Room Temperature (e.g., `255` = 25.5°C) |
| **103** | Boolean | Anti-Frost Protection Mode (Active when the screen is powered OFF) |
| **106** | Integer | Temperature Hysteresis deadband (e.g., `5` = 0.5°C) |
| **108** | Raw Bytes | Weekly programmable schedule matrix |

## Configuration

Below is the verified standalone configuration split into hardware components and advanced helper entities.

```yaml file=config.yaml
```
