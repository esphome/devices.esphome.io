---
title: Digitaling 20A Power Monitor RTL8710BX t102-v1.1
date-published: 2024-03-21
type: plug
standard: EU
board: rtl87xx
---

Bought from: [AliExpress](https://de.aliexpress.com/item/1005005374840269.html)

Board/Pinout: [libretiny.eu](https://docs.libretiny.eu/boards/t102-v1.1/#pinout)

Pictures: [elektroda.com](https://www.elektroda.com/rtvforum/topic4032920.html) (Pinout picture is off, uart2 is on the
two unconnected pads labled 0/12.)

Due to a bug [libretiny-eu/libretiny#227](https://github.com/libretiny-eu/libretiny/issues/227) the board w2 needs to be
selected for the relay to work:
Due to another bug you need to apply this fix to platforms\libretiny@1.4.1\cores\realtek-amb\arduino\src\wiring_irq.c
[https://github.com/libretiny-eu/libretiny/issues/155#issuecomment-1826470433](https://github.com/libretiny-eu/libretiny/issues/155#issuecomment-1826470433)

## Chips used

McuBoard: [T102_V1.1](https://docs.libretiny.eu/boards/t102-v1.1/)

MCU: RTL8710BX

Flash: GD25Q16ETIG 2 M x 8 NOR Flash

Power Sensor: [BL0937](https://developer.tuya.com/docs/iot-device-dev/Electricity-statistics?id=Kaunfo4am6icc)

Relay:
[JIEYING JY3FF-S-DC5V-A(K)](https://wmsc.lcsc.com/wmsc/upload/file/pdf/v2/C17702442.pdf)

## Flashing

Hook up 3v3 and GND

Connect TX2 and RX2 to serial interface.

Short TX2 to GND during power on, then flash via
[ltchiptool](https://docs.libretiny.eu/docs/flashing/tools/ltchiptool/).

Can be flashed in-place without desoldering.

## GPIO Pinout

| Pin  | Function                  |
| ---- | ------------------------- |
| PA00 | BL0937 cf_pin             |
| PA05 | LED (Inverted)            |
| PA12 | BL0937 cf1_pin            |
| PA14 | BL0937 sel_pin (Inverted) |
| PA15 | Relay & LED2              |
| PA18 | Button (Inverted)         |

## platformio.ini

```ini
[env:wr2]
platform = libretiny
board = wr2
framework = arduino
```

## Basic Configuration

```yaml
substitutions:
  devicename: smartplug
  friendly_name: t102-v1.1-2
  device_description: Digitaling 20A Power Monitor RTL8710BX t102-v1.1
  current_res: "0.001" # Power monitoring calibration https://esphome.io/components/sensor/hlw8012/
  voltage_div: "1600" # Power monitoring calibration

esphome:
  name: ${devicename}
  friendly_name: ${friendly_name}
  comment: ${device_description}

rtl87xx:
  board: wr2 # actually t102-v1.1 but https://github.com/libretiny-eu/libretiny/issues/247

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret api_encryption

ota:
  #password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot in case wifi connection fails
  ap:
    ssid: ${friendly_name} Fallback Hotspot
    password: !secret wifi_ap_password
captive_portal:

web_server:
  port: 80
  auth:
    username: !secret web_server_username
    password: !secret web_server_password

# Enable time component for use by daily power sensor
time:
  - platform: homeassistant
    id: homeassistant_time

binary_sensor:
  # Button on the front is pressed and then toggle relay
  - platform: gpio
    device_class: power
    pin:
      number: PA18
      mode: INPUT_PULLUP
      inverted: True
    name: Button
    on_press:
      - switch.toggle: relay
      - switch.toggle: statusled

text_sensor:
  # Reports the ESPHome Version with compile date
  - platform: version
    name: ESPHome Version
  - platform: libretiny
    version:
      name: LibreTiny Version

switch:
  # Relay itself
  - platform: gpio
    name: Relay
    pin: PA15
    id: relay
    restore_mode: RESTORE_DEFAULT_OFF
  - platform: gpio
    name: statusled
    pin: PA05
    id: statusled
    restore_mode: RESTORE_DEFAULT_OFF
    inverted: true

#bootloop fix: https://github.com/libretiny-eu/libretiny/issues/155#issuecomment-1826470433
#https://esphome.io/components/sensor/hlw8012.html
sensor:
  - platform: hlw8012
    model: BL0937
    sel_pin:
      number: PA14
      inverted: true
    cf_pin: PA00
    cf1_pin: PA12
    current:
      name: "Current"
    voltage:
      name: "Voltage"
    power:
      name: "Power"
      id: power
    update_interval: 1s
    initial_mode: CURRENT
    change_mode_every: 8
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}
  # Reports the total Power so-far each day, resets at midnight, see https://esphome.io/components/sensor/total_daily_energy/
  - platform: total_daily_energy
    name: Total Daily Energy
    icon: mdi:circle-slice-3
    power_id: power
    filters:
      - multiply: 0.001
    unit_of_measurement: kWh
    state_class: total_increasing
    device_class: energy
```
