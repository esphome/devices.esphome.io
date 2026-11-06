---
title: AVATTO S06 WiFi IR Universal Remote Controller (No Temp/No Humidity)
date-published: 2021-04-06
type: misc
standard: global
board: esp8266
---

![Product Image](./AVATTO-S06-WiFi-IR-Universal-Remote-Controller.jpg "Product Image")

## General Notes

There's two hardware iterations of this particular IR blaster: the older version documented here that uses an ESP01
module, and [a newer one that uses a CB3S module](/devices/AVATTO-S06-IR-Remote-no-temp-no-humidity-new-version) (a
Beken BK7231N module in the same form factor as the older ESP01). Outwardly, both appear identical.

## GPIO Pinout

| Pin    | Function           |
| ------ | ------------------ |
| GPIO4  | Blue Status LED    |
| GPIO14 | Remote Transmitter |
| GPIO5  | Remote Receiver    |
| GPIO13 | Reset Button       |

## Getting it up and running

This device needs very likely to be flashed manually. Tuya-convert didn't worked for me. I have powered the device with
a mobile charger during the flashing procedure, as the used serial cable sets to logic level based on the input voltage.
Which is 3.3V in this case.

| Serial | ESP         |
| ------ | ----------- |
| RX     | TX          |
| TX     | RX          |
| RTS    | RESET       |
| 3.3V   | 3.3V        |
| GND    | GND         |
|        | GPIO0 (GND) |

### Flashing

```bash
# Create a backup of the original firmware
esptool.py -p /dev/ttyUSB0 -b 460800 read_flash 0x00000 0x100000 avotta_s06_original_firmware.bin

# Erase the flash
esptool.py -p /dev/ttyUSB0 erase_flash

# Upload the esphome firmware
esptool.py -p /dev/ttyUSB0 write_flash -fs 1MB 0x0 ir_remote.bin
```

### Hardware Hack

If you want to wake the device via the reset button on the bottom from deep sleep. You need to solder a peace of wire
between the GPIO13 and the RESET pin of the ESP8266 MCU.

## Configuration

```yaml
# Basic Config
---
# https://esphome.io/components/esp8266/
esphome:
  name: ir_remote

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Enable logging
logger:
  level: DEBUG # Default

# Enable Home Assistant API
api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret ota_password

# https://esphome.io/components/status_led/
status_led:
  pin: 4

# https://esphome.io/components/remote_receiver/
remote_receiver:
  id: rcvr
  pin:
    number: 5
    mode: INPUT_PULLUP
    inverted: True

# https://www.esphome.io/components/remote_transmitter/
remote_transmitter:
  id: tamtr
  pin: 14
  carrier_duty_percent: 50%

# https://esphome.io/components/climate/climate_ir/
climate:
  - platform: toshiba
    id: ac
    name: AC'
    receiver_id: rcvr
    transmitter_id: tamtr

switch:
  - platform: template
    name: "AC Preset"
    id: ac_preset
    icon: mdi:cached
    turn_on_action:
      - climate.control:
          id: ac
          mode: COOL
          target_temperature: 24°C
          fan_mode: AUTO
          swing_mode: VERTICAL

    # https://esphome.io/components/switch/shutdown/
  - platform: shutdown
    name: "IR Remote Shutdown"
    id: ir_remote_shutdown
```
