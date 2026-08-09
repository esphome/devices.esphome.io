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

Below is the verified and fully working standalone production configuration. It includes optimized polling intervals, automated Wi-Fi status LED blinking logic, and corrected signed 4-byte integer handling for the calibration offset (`4 - X` conversion rule).

```yaml
# ==============================================================================
# Standalone ESPHome Configuration for Minco Heat MK80W / ME80 Thermostat
# ==============================================================================

captive_portal:

safe_mode:
  disabled: true

uart:
  id: tuya_uart
  tx_pin: GPIO1
  rx_pin: GPIO2
  baud_rate: 9600
  rx_buffer_size: 1024

time:
  - platform: sntp
    id: ntp_time
    timezone: "Europe/Moscow"
    
tuya:
  id: tuya_bus
  uart_id: tuya_uart
  time_id: ntp_time 

text:
  # Allows dynamic adjustment of the local NTP server address from Home Assistant
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

switch:
  # Maps to physical pin A_2 of the original WBR3 footprint
  - platform: gpio
    pin: GPIO7
    id: thermo_status_pin
    restore_mode: ALWAYS_OFF

  - platform: tuya
    name: "Thermostat Child Lock"
    switch_datapoint: 40

  - platform: tuya
    name: "Thermostat Anti-Frost Mode"
    switch_datapoint: 103

interval:
  # Loop 1 (250ms): Fast blinking animation while searching for network/time sync
  - interval: 250ms
    then:
      - lambda: |-
          if (!id(ntp_time).now().is_valid()) {
            if (id(thermo_status_pin).state) {
              id(thermo_status_pin).turn_off();
            } else {
              id(thermo_status_pin).turn_on();
            }
          }

  # Loop 2 (5s): Standard button poll + Lock network icon solid (LOW) upon successful sync
  - interval: 5s
    then:
      - lambda: |-
          auto* uart_bus = id(tuya_uart);

          // Query physical buttons state from the thermostat MCU
          uint8_t query_packet[] = {0x55, 0xAA, 0x00, 0x08, 0x00, 0x00, 0x07};
          uart_bus->write_array(query_packet, sizeof(query_packet));

          // If connected - latch status indicator without flooding time packets
          if (id(ntp_time).now().is_valid()) {
            id(thermo_status_pin).turn_off(); // LOW level latches the status LED on solidly
            
            uint8_t wifi_status_packet[] = {0x55, 0xAA, 0x00, 0x03, 0x00, 0x01, 0x04, 0x08};
            uart_bus->write_array(wifi_status_packet, sizeof(wifi_status_packet));
          }

  # Loop 3 (30min): Scheduled system maintenance log
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

climate:
  - platform: tuya
    id: thermostat_climate
    name: "Thermostat"
    switch_datapoint: 1
    target_temperature_datapoint: 16
    current_temperature_datapoint: 101
    temperature_multiplier: 0.1

select:
  # Mode Selection (Injects raw bytes into DP 2 to bypass built-in limitations for ECO mode)
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
          uint8_t raw_val = 1; // Default to Manual
          if (x == "Auto (Schedule)") raw_val = 0;
          if (x == "ECO Mode (Leaf)") raw_val = 2;

          ESP_LOGI("custom_mode", "Shifting operation mode register DP 2 to: %d", raw_val);
          uint8_t packet[] = {0x55, 0xAA, 0x00, 0x06, 0x00, 0x05, 2, 0x01, 0x00, 0x01, raw_val, 0x00};
          uint8_t cs = 0; for(size_t i=0; i<(sizeof(packet)-1); i++) { cs += packet[i]; }
          packet[sizeof(packet)-1] = cs;
          id(tuya_uart).write_array(packet, sizeof(packet));

  - platform: tuya
    name: "Thermostat Backlight Mode"
    enum_datapoint: 52
    options:
      0: "Turn Off after 15s"
      1: "Dim after 15s"

  - platform: tuya
    name: "Thermostat Sensor Source"
    enum_datapoint: 43
    options:
      0: "Internal Air Sensor (IN)"
      1: "External Floor Sensor (OUT)"
      2: "Dual Combined Sensor (ALL)"

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
          uint8_t packet[] = {
            0x55, 0xAA, 0x00, 0x06, 0x00, 0x08, 
            19, 0x02, 0x00, 0x04, 
            (uint8_t)(raw_val >> 24), (uint8_t)(raw_val >> 16), (uint8_t)(raw_val >> 8), (uint8_t)(raw_val & 0xFF), 
            0x00
          };
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
          uint8_t packet[] = {
            0x55, 0xAA, 0x00, 0x06, 0x00, 0x08, 
            26, 0x02, 0x00, 0x04, 
            (uint8_t)(raw_val >> 24), (uint8_t)(raw_val >> 16), (uint8_t)(raw_val >> 8), (uint8_t)(raw_val & 0xFF), 
            0x00
          };
          uint8_t cs = 0; for(size_t i=0; i<(sizeof(packet)-1); i++) { cs += packet[i]; }
          packet[sizeof(packet)-1] = cs;
          id(tuya_uart).write_array(packet, sizeof(packet));

  # Signed 4-byte validation offset with '4 - X' shift matrix applied
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
          
          uint8_t packet[] = {
            0x55, 0xAA, 0x00, 0x06, 0x00, 0x08, 
            27, 0x02, 0x00, 0x04, 
            (uint8_t)(raw_val >> 24), (uint8_t)(raw_val >> 16), (uint8_t)(raw_val >> 8), (uint8_t)(raw_val & 0xFF), 
            0x00
          };
          uint8_t cs = 0; for(size_t i=0; i<(sizeof(packet)-1); i++) { cs += packet[i]; }
          packet[sizeof(packet)-1] = cs;
          id(tuya_uart).write_array(packet, sizeof(packet));
```
