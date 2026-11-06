---
title: CircuitSetup Expandable-6 Channel ESP32 Energy Meter (ATM90E32)
date-published: 2020-10-28
type: misc
standard: global
board: esp32
---

## GPIO Pinout

| Pin    | Function                                                           |
| ------ | ------------------------------------------------------------------ |
| GPIO5  | Main Board CS 1 - CT1-3                                            |
| GPIO4  | Main Board CS 2 - CT4-6                                            |
| GPIO0  | Add-on Board 1 CS 1 - CT1-3                                        |
| GPIO16 | Add-on Board 1 CS 2 - CT4-6                                        |
| GPIO27 | Add-on Board 2 CS 1 - CT1-3                                        |
| GPIO17 | Add-on Board 2 CS 2 - CT4-6                                        |
| GPIO2  | Add-on Board 3 CS 1 - CT1-3 (do not use if ESP32 has on-board LED) |
| GPIO21 | Add-on Board 3 CS 2 - CT4-6                                        |
| GPIO13 | Add-on Board 4 CS 1 - CT1-3                                        |
| GPIO22 | Add-on Board 4 CS 2 - CT4-6                                        |
| GPIO14 | Add-on Board 5 CS 1 - CT1-3                                        |
| GPIO25 | Add-on Board 5 CS 2 - CT4-6                                        |
| GPIO15 | Add-on Board 6 CS 1 - CT1-3                                        |
| GPIO26 | Add-on Board 6 CS 2 - CT4-6                                        |
| GPIO18 | CLK Pin                                                            |
| GPIO19 | MISO Pin                                                           |
| GPIO23 | MOSI Pin                                                           |

## Main Board Only Configuration

```yaml
substitutions:
# Change the disp_name to something you want
  disp_name: 6C
# Interval of how often the power is updated
  update_time: 10s
# Current Transformers:
#  20A/25mA SCT-006: 11143
#  30A/1V SCT-013-030: 8650
#  50A/1V SCT-013-050: 15420
#  80A/26.6mA SCT-010: 41660
#  100A/50ma SCT-013-000: 27518
#  120A/40mA: SCT-016: 41787
#  200A/100mA SCT-024: 27518
  current_cal: '27518'
# Jameco 9VAC Transformer:
#  For meter versions:
#  >= v1.3: 7305
  voltage_cal: '7305'

esphome:
  name: 6chan_energy_meter

esp32:
  variant: esp32

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: !secret ip_eh_nrgnode
    gateway: !secret ip_gateway
    subnet: !secret ip_subnet
    dns1: !secret ip_dns1

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
    name: ${disp_name} WiFi
    update_interval: 60s
#IC1
  - platform: atm90e32
    cs_pin: 5
    phase_a:
      voltage:
        name: ${disp_name} Volts A
        id: ic1Volts
        accuracy_decimals: 1
      current:
        name: ${disp_name} CT1 Amps
        id: ct1Amps
# The max value for current that the meter can output is 65.535. If you expect to measure current over 65A,
# divide the gain_ct by 2 (120A CT) or 4 (200A CT) and multiply the current and power values by 2 or 4 by uncommenting the filter below
#        filters:
#          - multiply: 2
      power:
        name: ${disp_name} CT1 Watts
        id: ct1Watts
#        filters:
#          - multiply: 2
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      current:
        name: ${disp_name} CT2 Amps
        id: ct2Amps
       power:
        name: ${disp_name} CT2 Watts
        id: ct2Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      current:
        name: ${disp_name} CT3 Amps
        id: ct3Amps
      power:
        name: ${disp_name} CT3 Watts
        id: ct3Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    frequency:
      name: ${disp_name} Freq A
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
#IC2
  - platform: atm90e32
    cs_pin: 4
    phase_a:
#this voltage is only needed if monitoring 2 voltages
#      voltage:
#        name: ${disp_name} Volts B
#        id: ic2Volts
#        accuracy_decimals: 1
      current:
        name: ${disp_name} CT4 Amps
        id: ct4Amps
      power:
        name: ${disp_name} CT4 Watts
        id: ct4Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      current:
        name: ${disp_name} CT5 Amps
        id: ct5Amps
      power:
        name: ${disp_name} CT5 Watts
        id: ct5Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      current:
        name: ${disp_name} CT6 Amps
        id: ct6Amps
      power:
        name: ${disp_name} CT6 Watts
        id: ct6Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    frequency:
      name: ${disp_name} Freq B
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}

#Total Amps
  - platform: template
    name: ${disp_name} Total Amps
    id: totalAmps
    lambda: return id(ct1Amps).state + id(ct2Amps).state + id(ct3Amps).state + id(ct4Amps).state + id(ct5Amps).state + id(ct6Amps).state ;
    accuracy_decimals: 2
    unit_of_measurement: A
    icon: "mdi:flash"
    update_interval: ${update_time}
#Total Watts
  - platform: template
    name: ${disp_name} Total Watts
    id: totalWatts
    lambda: return id(ct1Watts).state + id(ct2Watts).state + id(ct3Watts).state + id(ct4Watts).state + id(ct5Watts).state + id(ct6Watts).state ;
    accuracy_decimals: 1
    unit_of_measurement: W
    icon: "mdi:flash-circle"
    update_interval: ${update_time}
#kWh
  - platform: total_daily_energy
    name: ${disp_name} Total kWh
    power_id: totalWatts
    filters:
      - multiply: 0.001
    unit_of_measurement: kWh

switch:
  - platform: restart
    name: ${disp_name} Restart
time:
  - platform: sntp
    id: sntp_time
```

## Main Board + 1 Add-on Board Configuration

```yaml
substitutions:
  # Change the disp_name to something you want
  disp_name: 6C
  # Interval of how often the power is updated
  update_time: 10s
  # Current Transformers:
  #  20A/25mA SCT-006: 11143
  #  30A/1V SCT-013-030: 8650
  #  50A/1V SCT-013-050: 15420
  #  80A/26.6mA SCT-010: 41660
  #  100A/50ma SCT-013-000: 27518
  #  120A/40mA: SCT-016: 41787
  #  200A/100mA SCT-024: 27518
  current_cal: "27518"
  # Jameco 9VAC Transformer:
  #  For meter versions:
  #  >= v1.3: 7305
  #  <= v1.2: 42620
  voltage_cal: "7305"

esphome:
  name: 6chan_energy_meter

esp32:
  variant: esp32

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: !secret ip_eh_nrgnode
    gateway: !secret ip_gateway
    subnet: !secret ip_subnet
    dns1: !secret ip_dns1

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
    name: ${disp_name} WiFi
    update_interval: 60s
  #IC1 Main
  - platform: atm90e32
    cs_pin: 5
    phase_a:
      voltage:
        name: ${disp_name} Volts A
        id: ic1Volts
        accuracy_decimals: 1
      current:
        name: ${disp_name} CT1 Amps
        id: ct1Amps
      # The max value for current that the meter can output is 65.535. If you expect to measure current over 65A,
      # divide the gain_ct by 2 (120A CT) or 4 (200A CT) and multiply the current and power values by 2 or 4 by uncommenting the filter below
      #        filters:
      #          - multiply: 2
      power:
        name: ${disp_name} CT1 Watts
        id: ct1Watts
      #        filters:
      #          - multiply: 2
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      current:
        name: ${disp_name} CT2 Amps
        id: ct2Amps
      power:
        name: ${disp_name} CT2 Watts
        id: ct2Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      current:
        name: ${disp_name} CT3 Amps
        id: ct3Amps
      power:
        name: ${disp_name} CT3 Watts
        id: ct3Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    frequency:
      name: ${disp_name} Freq A
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC2 Main
  - platform: atm90e32
    cs_pin: 4
    phase_a:
      current:
        name: ${disp_name} CT4 Amps
        id: ct4Amps
      power:
        name: ${disp_name} CT4 Watts
        id: ct4Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      current:
        name: ${disp_name} CT5 Amps
        id: ct5Amps
      power:
        name: ${disp_name} CT5 Watts
        id: ct5Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      current:
        name: ${disp_name} CT6 Amps
        id: ct6Amps
      power:
        name: ${disp_name} CT6 Watts
        id: ct6Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC1 AddOn
  - platform: atm90e32
    cs_pin: 0
    phase_a:
      current:
        name: ${disp_name} CT7 Amps
        id: ct7Amps
      power:
        name: ${disp_name} CT7 Watts
        id: ct7Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      current:
        name: ${disp_name} CT8 Amps
        id: ct8Amps
      power:
        name: ${disp_name} CT8 Watts
        id: ct8Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      current:
        name: ${disp_name} CT9 Amps
        id: ct9Amps
      power:
        name: ${disp_name} CT9 Watts
        id: ct9Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC2 AddOn
  - platform: atm90e32
    cs_pin: 16
    phase_a:
      current:
        name: ${disp_name} CT10 Amps
        id: ct10Amps
      power:
        name: ${disp_name} CT10 Watts
        id: ct10Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      current:
        name: ${disp_name} CT11 Amps
        id: ct11Amps
      power:
        name: ${disp_name} CT11 Watts
        id: ct11Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      current:
        name: ${disp_name} CT12 Amps
        id: ct12Amps
      power:
        name: ${disp_name} CT12 Watts
        id: ct12Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}

  #Total Amps Main
  - platform: template
    name: ${disp_name} Total Amps Main
    id: totalAmpsMain
    lambda: return id(ct1Amps).state + id(ct2Amps).state + id(ct3Amps).state + id(ct4Amps).state + id(ct5Amps).state + id(ct6Amps).state ;
    accuracy_decimals: 2
    unit_of_measurement: A
    icon: "mdi:flash"
    update_interval: ${update_time}
  #Total Amps AddOn
  - platform: template
    name: ${disp_name} Total Amps Add-on
    id: totalAmpsAddOn
    lambda: return id(ct7Amps).state + id(ct8Amps).state + id(ct9Amps).state + id(ct10Amps).state + id(ct11Amps).state + id(ct12Amps).state ;
    accuracy_decimals: 2
    unit_of_measurement: A
    icon: "mdi:flash"
    update_interval: ${update_time}
  #Total Amps
  - platform: template
    name: ${disp_name} Total Amps
    id: totalAmps
    lambda: return id(totalAmpsMain).state + id(totalAmpsAddOn).state ;
    accuracy_decimals: 2
    unit_of_measurement: A
    icon: "mdi:flash"
    update_interval: ${update_time}

  #Total Watts Main
  - platform: template
    name: ${disp_name} Total Watts Main
    id: totalWattsMain
    lambda: return id(ct1Watts).state + id(ct2Watts).state + id(ct3Watts).state + id(ct4Watts).state + id(ct5Watts).state + id(ct6Watts).state ;
    accuracy_decimals: 1
    unit_of_measurement: W
    icon: "mdi:flash-circle"
    update_interval: ${update_time}
  #Total Watts AddOn
  - platform: template
    name: ${disp_name} Total Watts Add-on
    id: totalWattsAddOn
    lambda: return id(ct7Watts).state + id(ct8Watts).state + id(ct9Watts).state + id(ct10Watts).state + id(ct11Watts).state + id(ct12Watts).state ;
    accuracy_decimals: 1
    unit_of_measurement: W
    icon: "mdi:flash-circle"
    update_interval: ${update_time}
  #Total Watts
  - platform: template
    name: ${disp_name} Total Watts
    id: totalWatts
    lambda: return id(totalWattsMain).state + id(totalWattsAddOn).state ;
    accuracy_decimals: 1
    unit_of_measurement: W
    icon: "mdi:flash-circle"
    update_interval: ${update_time}

  #kWh
  - platform: total_daily_energy
    name: ${disp_name} Total kWh
    power_id: totalWatts
    filters:
      - multiply: 0.001
    unit_of_measurement: kWh

switch:
  - platform: restart
    name: ${disp_name} Restart
time:
  - platform: sntp
    id: sntp_time
```

## Main Board + 5 Add-on Boards Configuration

```yaml
# 5 add-on boards - 36 current channels
# ESPHome has a limit on the amount of sensors that it can handle before running out of memory.
# Because of this, only the power sensor for each current channel is output

substitutions:
  # Change the disp_name to something you want
  disp_name: Energy_Meter
  # Interval of how often the power is updated
  update_time: 10s
  # Current Transformers:
  #  20A/25mA SCT-006: 11143
  #  30A/1V SCT-013-030: 8650
  #  50A/1V SCT-013-050: 15420
  #  80A/26.6mA SCT-010: 41660
  #  100A/50ma SCT-013-000: 27518
  #  120A/40mA: SCT-016: 41787
  #  200A/100mA SCT-024: 27518
  current_cal: "11143"
  # Jameco 9VAC Transformer:
  #  For meter versions:
  #  >= v1.3: 7305
  #  <= v1.2: 42620
  voltage_cal: "7305"

esphome:
  name: energy_meter

esp32:
  variant: esp32

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:

spi:
  clk_pin: 18
  miso_pin: 19
  mosi_pin: 23
sensor:
  #IC1 Main
  - platform: atm90e32
    cs_pin: 5
    phase_a:
      voltage:
        name: ${disp_name} Volts A Main
        id: ic1Volts
        accuracy_decimals: 1
      current:
        name: ${disp_name} CT1 Amps
        id: ct1Amps
      power:
        name: ${disp_name} CT1 Watts
        id: ct1Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      current:
        name: ${disp_name} CT2 Amps
        id: ct2Amps
      power:
        name: ${disp_name} CT2 Watts
        id: ct2Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      current:
        name: ${disp_name} CT3 Amps
        id: ct3Amps
      power:
        name: ${disp_name} CT3 Watts
        id: ct3Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    frequency:
      name: ${disp_name} Freq A Main
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC2 Main
  - platform: atm90e32
    cs_pin: 4
    phase_a:
      current:
        name: ${disp_name} CT4 Amps
        id: ct4Amps
      power:
        name: ${disp_name} CT4 Watts
        id: ct4Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      current:
        name: ${disp_name} CT5 Amps
        id: ct5Amps
      power:
        name: ${disp_name} CT5 Watts
        id: ct5Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      current:
        name: ${disp_name} CT6 Amps
        id: ct6Amps
      power:
        name: ${disp_name} CT6 Watts
        id: ct6Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC1 AddOn 1
  - platform: atm90e32
    cs_pin: 0
    phase_a:
      power:
        name: ${disp_name} CT7 Watts
        id: ct7Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      power:
        name: ${disp_name} CT8 Watts
        id: ct8Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      power:
        name: ${disp_name} CT9 Watts
        id: ct9Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC2 AddOn 1
  - platform: atm90e32
    cs_pin: 16
    phase_a:
      power:
        name: ${disp_name} CT10 Watts
        id: ct10Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      power:
        name: ${disp_name} CT11 Watts
        id: ct11Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      power:
        name: ${disp_name} CT12 Watts
        id: ct12Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC1 AddOn 2
  - platform: atm90e32
    cs_pin: 27
    phase_a:
      power:
        name: ${disp_name} CT13 Watts
        id: ct13Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      power:
        name: ${disp_name} CT14 Watts
        id: ct14Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      power:
        name: ${disp_name} CT15 Watts
        id: ct15Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC2 AddOn 2
  - platform: atm90e32
    cs_pin: 17
    phase_a:
      power:
        name: ${disp_name} CT16 Watts
        id: ct16Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      power:
        name: ${disp_name} CT17 Watts
        id: ct17Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      power:
        name: ${disp_name} CT18 Watts
        id: ct18Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC1 AddOn 3
  - platform: atm90e32
    cs_pin: 2
    phase_a:
      power:
        name: ${disp_name} CT19 Watts
        id: ct19Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      power:
        name: ${disp_name} CT20 Watts
        id: ct20Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      power:
        name: ${disp_name} CT21 Watts
        id: ct21Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC2 AddOn 3
  - platform: atm90e32
    cs_pin: 21
    phase_a:
      power:
        name: ${disp_name} CT22 Watts
        id: ct22Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      power:
        name: ${disp_name} CT23 Watts
        id: ct23Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      power:
        name: ${disp_name} CT24 Watts
        id: ct24Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC1 AddOn 4
  - platform: atm90e32
    cs_pin: 13
    phase_a:
      power:
        name: ${disp_name} CT25 Watts
        id: ct25Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      power:
        name: ${disp_name} CT26 Watts
        id: ct26Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      power:
        name: ${disp_name} CT27 Watts
        id: ct27Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC2 AddOn 4
  - platform: atm90e32
    cs_pin: 22
    phase_a:
      power:
        name: ${disp_name} CT28 Watts
        id: ct28Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      power:
        name: ${disp_name} CT29 Watts
        id: ct29Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      power:
        name: ${disp_name} CT30 Watts
        id: ct30Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC1 AddOn 5
  - platform: atm90e32
    cs_pin: 14
    phase_a:
      power:
        name: ${disp_name} CT31 Watts
        id: ct31Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      power:
        name: ${disp_name} CT32 Watts
        id: ct32Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      power:
        name: ${disp_name} CT33 Watts
        id: ct33Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}
  #IC2 AddOn 5
  - platform: atm90e32
    cs_pin: 25
    phase_a:
      power:
        name: ${disp_name} CT34 Watts
        id: ct34Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_b:
      power:
        name: ${disp_name} CT35 Watts
        id: ct35Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    phase_c:
      power:
        name: ${disp_name} CT36 Watts
        id: ct36Watts
      gain_voltage: ${voltage_cal}
      gain_ct: ${current_cal}
    line_frequency: 60Hz
    gain_pga: 1X
    update_interval: ${update_time}

  #Total Watts Main
  - platform: template
    name: ${disp_name} Total Watts Main
    id: totalWattsMain
    lambda: return id(ct1Watts).state + id(ct2Watts).state + id(ct3Watts).state + id(ct4Watts).state + id(ct5Watts).state + id(ct6Watts).state ;
    accuracy_decimals: 1
    unit_of_measurement: W
    icon: "mdi:flash-circle"
    update_interval: ${update_time}
  #Total Watts AddOn1
  - platform: template
    name: ${disp_name} Total Watts Add-on1
    id: totalWattsAddOn1
    lambda: return id(ct7Watts).state + id(ct8Watts).state + id(ct9Watts).state + id(ct10Watts).state + id(ct11Watts).state + id(ct12Watts).state ;
    accuracy_decimals: 1
    unit_of_measurement: W
    icon: "mdi:flash-circle"
    update_interval: ${update_time}
  #Total Watts AddOn2
  - platform: template
    name: ${disp_name} Total Watts Add-on2
    id: totalWattsAddOn2
    lambda: return id(ct13Watts).state + id(ct14Watts).state + id(ct15Watts).state + id(ct16Watts).state + id(ct17Watts).state + id(ct18Watts).state ;
    accuracy_decimals: 1
    unit_of_measurement: W
    icon: "mdi:flash-circle"
    update_interval: ${update_time}
  #Total Watts AddOn3
  - platform: template
    name: ${disp_name} Total Watts Add-on3
    id: totalWattsAddOn3
    lambda: return id(ct19Watts).state + id(ct20Watts).state + id(ct21Watts).state + id(ct22Watts).state + id(ct23Watts).state + id(ct24Watts).state ;
    accuracy_decimals: 1
    unit_of_measurement: W
    icon: "mdi:flash-circle"
    update_interval: ${update_time}
  #Total Watts AddOn4
  - platform: template
    name: ${disp_name} Total Watts Add-on4
    id: totalWattsAddOn4
    lambda: return id(ct25Watts).state + id(ct26Watts).state + id(ct27Watts).state + id(ct28Watts).state + id(ct29Watts).state + id(ct30Watts).state ;
    accuracy_decimals: 1
    unit_of_measurement: W
    icon: "mdi:flash-circle"
    update_interval: ${update_time}
  #Total Watts AddOn5
  - platform: template
    name: ${disp_name} Total Watts Add-on5
    id: totalWattsAddOn5
    lambda: return id(ct31Watts).state + id(ct32Watts).state + id(ct33Watts).state + id(ct34Watts).state + id(ct35Watts).state + id(ct36Watts).state ;
    accuracy_decimals: 1
    unit_of_measurement: W
    icon: "mdi:flash-circle"
    update_interval: ${update_time}
  #Total Watts
  - platform: template
    name: ${disp_name} Total Watts
    id: totalWatts
    lambda: return id(totalWattsMain).state + id(totalWattsAddOn1).state + id(totalWattsAddOn2).state + id(totalWattsAddOn3).state + id(totalWattsAddOn4).state + id(totalWattsAddOn5).state ;
    accuracy_decimals: 1
    unit_of_measurement: W
    icon: "mdi:flash-circle"
    update_interval: ${update_time}
  #kWh
  - platform: total_daily_energy
    name: ${disp_name} Total kWh
    power_id: totalWatts
    filters:
      - multiply: 0.001
    unit_of_measurement: kWh
time:
  - platform: sntp
    id: sntp_time
```
