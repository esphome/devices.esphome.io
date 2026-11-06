---
title: Aquaria S1 24 P
date-published: 2026-02-07
type: misc
standard: eu
board: rtl87xx
made-for-esphome: False
difficulty: 3
---

The Olympia/Aquaria S1 24 P is a dehumidifier (Italian I believe) that uses a Tuya module for its WIFI/BT capabilities.

It uses this Tuya [chip](https://developer.tuya.com/en/docs/iot/wbr1-module-datasheet?id=K9duisiao4qpa),
([LibreTiny ref](https://docs.libretiny.eu/boards/wbr1/)) on this Tuya
[module](https://developer.tuya.com/en/docs/iot/jwbr2s5v-datasheet?id=K9mxm59oqep1q)

The chip is a RTL8720CF, but its main constraint is that its flash is tiny, the most barebones ESPHome binary already
uses more than 50% of it, which means OTA is not possible, so this is a flash once and forget.

Despite the warn on the LibreTiny website about the need for desoldering to strap pin PA00, on this particular module is
not needed, as the PCB has holes (a label/sticker with the module serial may need to be removed) to allow access to said
pins, the module also has pin holes, so if you have pogo pin clamps, you can do all this without soldering.

I initially took the module out, but then for testing and flashing test configs, I did it all with the module being
plugged straight to the device, as the pogo clamps can hold themselves, I've used 2, one for the pins on the side, where
you need to connect these pins to your USB-TTL

- Log_TX -> RX
- Log_RX -> TX
- GND -> GND

power comes from the device, so don't plug 3.3v to your USB device, but, do take a dupont cable from it and using a
second pogo clamp, plug it back to PA00 (this puts the chip in download mode, yes, you need to give it 3.3v)

If you have multiple of these devices, you will likely need to make each device name unique across the same network (I'd
recommend enabling mac suffix if you plan to have more than one cause the OTA restriction)

## Full configuration

```yaml
esphome:
  name: aquaria-s1-24-p
  friendly_name: Aquaria S1 24 P

rtl87xx:
  # this is not strictly the board (generic-rtl8720cf-2mb-992k), but's needed cause a bug on the ESPHome source code, otherwise the UART pins are not correctly mapped
  # kudos to this guy https://github.com/esphome/issues/issues/6909#issuecomment-3037309282
  board: bw15 

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret key

# No OTA section cause it's basically useless anyway

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "Aquaria-Dehumidifier-Fallback"
    password: !secret wifi_ap_pwd

captive_portal:

web_server:
  port: 80
  # Not really needed, but given the OTA thing, I rather over configure
  auth:
    username: admin
    password: !secret web_admin_pwd

uart:
  id: uart_bus
  tx_pin: GPIO14
  rx_pin: GPIO13
  baud_rate: 9600

tuya:
  uart_id: uart_bus

# SWITCHES
switch:
  - platform: "tuya"
    name: "Power"
    switch_datapoint: 1
    icon: "mdi:power"
  - platform: "tuya"
    name: "Light"
    switch_datapoint: 101
    icon: "mdi:lightbulb"
  - platform: "tuya"
    name: "Child Lock"
    switch_datapoint: 7
    icon: "mdi:lock"
  - platform: "tuya"
    name: "Swing"
    switch_datapoint: 8
    icon: "mdi:swap-horizontal"
  # These 2 doesn't seem to work on this particular device, but the AI found that for this product id those datapoints should be that, so I leave them for completeness, can be deleted or disabled on HA if you have the exact same device and thus not care about them
  - platform: "tuya"
    name: "Internal Dry"
    switch_datapoint: 107
    icon: "mdi:fan-minus"
  - platform: "tuya"
    name: "Ionizer"
    switch_datapoint: 108
    icon: "mdi:air-filter"

# SENSORS
sensor:
  - platform: "tuya"
    name: "Current Humidity"
    sensor_datapoint: 3
    unit_of_measurement: "%"
    device_class: "humidity"
    state_class: "measurement"
  - platform: "tuya"
    name: "Current Temperature"
    sensor_datapoint: 110 
    unit_of_measurement: "°C"
    device_class: "temperature"
    state_class: "measurement"
  - platform: "tuya"
    id: fault_bitmask
    sensor_datapoint: 11
    #This bitmap can't be directly mapped to a bool, so we hide the raw and use a template to be nice to HA
    internal: true 
  - platform: wifi_signal
    internal: true
    id: wifi_rssi_raw
    update_interval: 60s

# BINARY SENSORS
binary_sensor:
  - platform: template
    name: "Tank Full"
    device_class: problem
    lambda: |-
      return ((int)id(fault_bitmask).state & 0x02);

# NUMBERS
number:
  - platform: "tuya"
    name: "Target Humidity"
    number_datapoint: 4
    min_value: 30
    max_value: 80
    step: 5
    unit_of_measurement: "%"
    icon: "mdi:water-percent"
  - platform: "tuya"
    name: "Off Timer"
    number_datapoint: 106
    min_value: 0
    max_value: 24
    step: 1
    unit_of_measurement: "h"
    icon: "mdi:timer-outline"    

# SELECTS (Enums)
select:
  - platform: "tuya"
    name: "Mode"
    enum_datapoint: 2
    options:
      0: "Dry"
      1: "Laundry"
    icon: "mdi:tune"
  - platform: "tuya"
    name: "Fan Speed"
    enum_datapoint: 6
    options:
      0: "Low"
      1: "Medium"
      2: "High"
    icon: "mdi:fan"

text_sensor:
  - platform: wifi_info
    ip_address:
      name: "IP"
      entity_category: diagnostic
      icon: mdi:ip-network

  - platform: wifi_info
    ssid:
      name: "SSID"
      entity_category: diagnostic
      icon: mdi:wifi-settings

  - platform: template
    name: "WiFi Strength"
    entity_category: diagnostic
    icon: "mdi:signal-cellular-3"
    update_interval: 60s
    lambda: |-
      int rssi = int(id(wifi_rssi_raw).state);
      if (rssi < -90)      return {"Very Weak"};
      else if (rssi < -80) return {"Weak"};
      else if (rssi < -70) return {"Moderate"};
      else if (rssi < -60) return {"Strong"};
      else                 return {"Very Strong"};    
```
