---
title: CircuitSetup Split Single Phase Energy Meter (ATM90E32) with ESP32
date-published: 2020-10-28
type: misc
standard: global
board: esp32
---

## GPIO Pinout

| Pin    | Function    |
| ------ | ----------- |
| GPIO5  | Chip Select |
| GPIO18 | CLK Pin     |
| GPIO19 | MISO Pin    |
| GPIO23 | MOSI Pin    |

## Detailed Power Configuration

```yaml
substitutions:
  # Change the disp_name to something you want
  disp_name: House
  # Interval of how often the power is updated
  update_time: 10s
  # Current transformer calibrations:
  # 80A/26.6mA SCT-010: 39571
  # 100A/50mA SCT-013: 26315
  # 120A/40ma SCT-016: 39473 - default kit CT
  # 200A/100mA SCT-024: 26315
  current_cal: "39473"
  # AC Transformer voltage calibration 9VAC Jameco 157041: 37106
  # For Meters >= v1.4 rev3: 3920
  voltage_cal: "3920"

esphome:
  name: energy_meter

esp32:
  variant: esp32

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: !secret ip_eh_nrgnode_2chan32
    gateway: !secret ip_gateway
    subnet: !secret ip_subnet
    dns1: !secret ip_dns1

# Enable if you want to send this data to an MQTT broker
# mqtt:
#  broker: !secret mqtt_broker
#  username: !secret mqtt_user
#  password: !secret mqtt_pass

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:

web_server:
  port: 80

spi:
  clk_pin: 18
  miso_pin: 19
  mosi_pin: 23

sensor:
  - platform: wifi_signal
    name: ${disp_name} WiFi Signal
    update_interval: 60s
  - platform: atm90e32
    cs_pin: 5
    phase_a:
      voltage:
        name: ${disp_name} Volts
        accuracy_decimals: 1
      current:
        name: ${disp_name} CT1 Amps
        id: "ct1Amps"
      # The max value for current that the meter can output is 65.535. If you expect to measure current over 65A,
      # divide the gain_ct by 2 (120A CT) or 4 (200A CT) and multiply the current and power values by 2 or 4 by uncommenting the filter below
      #        filters:
      #          - multiply: 2
      power:
        name: ${disp_name} CT1 Watts
        accuracy_decimals: 1
        id: "ct1Watts"
      #        filters:
      #          - multiply: 2
      reactive_power:
        name: ${disp_name} CT1 Reactive Power
        accuracy_decimals: 1
        id: "ct1Reactive"
      #        filters:
      #          - multiply: 2
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      current:
        name: ${disp_name} CT2 Amps
        id: "ct2Amps"
      # The max value for current that the meter can output is 65.535. If you expect to measure current over 65A,
      # divide the gain_ct by 2 (120A CT) or 4 (200A CT) and multiply the current and power values by 2 or 4 by uncommenting the filter below
      #        filters:
      #          - multiply: 2
      power:
        name: ${disp_name} CT2 Watts
        accuracy_decimals: 1
        id: "ct2Watts"
      #        filters:
      #          - multiply: 2
      reactive_power:
        name: ${disp_name} CT2 Reactive Power
        accuracy_decimals: 1
        id: "ct2Reactive"
      #        filters:
      #          - multiply: 2
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    frequency:
      name: ${disp_name} Freq
    chip_temperature:
      name: ${disp_name} Chip Temp
    line_frequency: 60Hz
    gain_pga: 2X
    update_interval: ${update_time}
  - platform: template
    name: ${disp_name} Total Amps
    id: "totalAmps"
    lambda: return id(ct1Amps).state + id(ct2Amps).state;
    accuracy_decimals: 2
    unit_of_measurement: A
    update_interval: ${update_time}
    icon: "mdi:current-ac"
  - platform: template
    name: ${disp_name} Total Watts
    id: "totalWatts"
    lambda: return id(ct1Watts).state + id(ct2Watts).state;
    accuracy_decimals: 0
    unit_of_measurement: W
    icon: "mdi:power"
    update_interval: ${update_time}
  - platform: template
    name: ${disp_name} Total Reactive Power
    id: "totalReactivePower"
    lambda: return id(ct1Reactive).state + id(ct2Reactive).state;
    accuracy_decimals: 0
    unit_of_measurement: VAR
    icon: "mdi:flash-circle"
    update_interval: ${update_time}

  - platform: total_daily_energy
    name: ${disp_name} Total kWh
    power_id: totalWatts
    filters:
      - multiply: 0.001
    unit_of_measurement: kWh

time:
  - platform: sntp
    id: sntp_time

switch:
  - platform: restart
    name: ${disp_name} Restart
```
