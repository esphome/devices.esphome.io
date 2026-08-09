---
title: Minco Heat MK80W
date-published: 2026-08-09
type: climate
standard: global
board: esp32-s3
difficulty: 3
---

# Minco Heat MK80W (Platform ME80)

The Minco Heat MK80W is a Tuya MCU-based touchscreen thermostat used for floor heating and boilers. It communicates with the Wi-Fi/ESP module via a hardware UART interface at 9600 baud.

## Hardware Modifications (Hardware Modding)

To flash this thermostat with ESPHome, the stock Tuya Wi-Fi module (such as the WBR3) must be desoldered and replaced with a custom ESP32-S3 board (or equivalent).

**Critical Wiring Note:**
One of the signal traces controlling the network status icon (Wi-Fi leaf/symbol) on the front LCD panel must be hardware-soldered directly to the pad that originally mapped to pin **`A_2`** on the stock Tuya WBR3 module. In this ESPHome configuration, this pin is mapped to **`GPIO7`**. The control logic is inverted: pulling the pin `LOW (0V)` keeps the icon solidly lit, while pulling it `HIGH` turns it off.

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

Below is the verified standalone configuration. The hardware components are separated into the main file, and advanced templates/calibrations are included via the `base.yaml` package.

```yaml file=config.yaml
```

### Advanced Templates (`base.yaml`)

```yaml
# Advanced templates, calibration logic and HA UI entities
captive_portal:

text:
  - platform: template
    id: ntp_server_address
    name: "Thermostat NTP Server"
    mode: TEXT
    optimistic: true
    initial_value: "192.168.1.200"
    restore_value: true
    on_value:
      - then:
          - lambda: |-
              ESP_LOGW("ntp_config", "New NTP address saved in memory: %s", x.c_str());

interval:
  - interval: 30min
    then:
      - if:
          condition:
            - time.has_time:
                id: ntp_time
          then:
            - lambda: |-
                ESP_LOGI("version_control", "--- BUILD STATE: [v42.0 - Final Release] ---");
                std::string current_ntp = id(ntp_server_address).state;
                ESP_LOGI("custom_net", "Scheduled time validation routine. Active NTP server: %s", current_ntp.c_str());

select:
  - platform: template
    name: "Thermostat Mode"
    id: custom_thermo_mode
    optimistic: true
    options:
      - "Auto (Schedule)"
      - "Manual"
      - "ECO Mode (Leaf)"
    on_value:
      - lambda: |-
          uint8_t raw_val = 1; 
          if (x == "Auto (Schedule)") raw_val = 0;
          if (x == "ECO Mode (Leaf)") raw_val = 2;
          uint8_t packet[] = {0x55, 0xAA, 0x00, 0x06, 0x00, 0x05, 2, 0x01, 0x00, 0x01, raw_val, 0x00};
          uint8_t cs = 0; for(size_t i=0; i<(sizeof(packet)-1); i++) { cs += packet[i]; }
          packet[sizeof(packet)-1] = cs;
          id(tuya_uart).write_array(packet, sizeof(packet));

number:
  - platform: template
    name: "Thermostat Max Limit"
    id: text_max_limit
    min_value: 20.0
    max_value: 50.0
    step: 0.5
    unit_of_measurement: "°C"
    optimistic: true
    initial_value: 33.0
    on_value:
      - lambda: |-
          int32_t raw_val = (int32_t)(x * 10);
          uint8_t packet[] = {0x55, 0xAA, 0x00, 0x06, 0x00, 0x08, 19, 0x02, 0x00, 0x04, (uint8_t)(raw_val >> 24), (uint8_t)(raw_val >> 16), (uint8_t)(raw_val >> 8), (uint8_t)(raw_val & 0xFF), 0x00};
          uint8_t cs = 0; for(size_t i=0; i<(sizeof(packet)-1); i++) { cs += packet[i]; }
          packet[sizeof(packet)-1] = cs;
          id(tuya_uart).write_array(packet, sizeof(packet));

  - platform: template
    name: "Thermostat Min Limit"
    id: text_min_limit
    min_value: 5.0
    max_value: 20.0
    step: 0.5
    unit_of_measurement: "°C"
    optimistic: true
    initial_value: 18.0
    on_value:
      - lambda: |-
          int32_t raw_val = (int32_t)(x * 10);
          uint8_t packet[] = {0x55, 0xAA, 0x00, 0x06, 0x00, 0x08, 26, 0x02, 0x00, 0x04, (uint8_t)(raw_val >> 24), (uint8_t)(raw_val >> 16), (uint8_t)(raw_val >> 8), (uint8_t)(raw_val & 0xFF), 0x00};
          uint8_t cs = 0; for(size_t i=0; i<(sizeof(packet)-1); i++) { cs += packet[i]; }
          packet[sizeof(packet)-1] = cs;
          id(tuya_uart).write_array(packet, sizeof(packet));

  - platform: template
    name: "Thermostat Calibration"
    id: text_calibration
    min_value: -9.0
    max_value: 9.0
    step: 1.0
    unit_of_measurement: "°C"
    optimistic: true
    initial_value: 0.0
    on_value:
      - lambda: |-
          int32_t raw_val = 4 - (int32_t)(x);
          uint8_t packet[] = {0x55, 0xAA, 0x00, 0x06, 0x00, 0x08, 27, 0x02, 0x00, 0x04, (uint8_t)(raw_val >> 24), (uint8_t)(raw_val >> 16), (uint8_t)(raw_val >> 8), (uint8_t)(raw_val & 0xFF), 0x00};
          uint8_t cs = 0; for(size_t i=0; i<(sizeof(packet)-1); i++) { cs += packet[i]; }
          packet[sizeof(packet)-1] = cs;
          id(tuya_uart).write_array(packet, sizeof(packet));
```
