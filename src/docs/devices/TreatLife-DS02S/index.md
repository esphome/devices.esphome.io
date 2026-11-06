---
title: TreatLife DS02S Single Pole Dimmer
date-published: 2021-05-08
type: dimmer
standard: us
board: esp8266
---

Treatlife DS02S Switch![image](Treatlife-DS02S.png)

[Amazon Link](https://www.amazon.com/dp/B07YKFSWJN)

## Notes

This TuyaMCU requires a baud rate of 9600 (see latest note on January 2022 for more info), unlike the DS03 dimmer.

July 2021 - New device purchased now has Tuya WB3S Wifi Microcontroller in place of the previous TYWE3S, which is not
ESP based. Luckily, the main board still has the appropriate footprint for an ESP-12F. Further instructions on how to
swap microcontrollers can be found
[in the Home Assistant community](https://community.home-assistant.io/t/treatlife-dual-outlet-indoor-dimmer-plug-wb3s-to-esp-12-transplant/256798)

January 2022 - Newer models require a baudrate of 115200, similar to that of the DS03 dimmer. Like the DS03, it might
say `Invalid baud_rate: Integration requested baud_rate 9600 but you have 115200!`, however this can be ignored.

## GPIO Pinout

| Pin   | Function |
| ----- | -------- |
| GPIO1 | Tuya Tx  |
| GPIO3 | Tuya Rx  |

## Basic Configuration

```yaml
substitutions:
  device_name: familyroom_light_1 #change
  friendly_name: Family Room Light #change
  icon: "mdi:light-switch"

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: true
  ap:
    ssid: ${device_name}
    password: !secret esphome_ap_password

logger:
  baud_rate: 0

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret esphome_ota_password

web_server:
  port: 80

uart:
  rx_pin: GPIO3
  tx_pin: GPIO1
  baud_rate: 9600 #This may need to be 115200 See above in the notes

tuya:

sensor:
  - platform: wifi_signal
    name: ${friendly_name} WiFi Signal
    update_interval: 60s

  - platform: uptime
    name: ${friendly_name} Uptime

light:
  - platform: "tuya"
    name: ${friendly_name}
    dimmer_datapoint: 2
    switch_datapoint: 1
    min_value: 100
    max_value: 1000
```

## Advanced Configuration

Below are some advanced configuration options that may be required if your dimmer is not behaving as expected.

This will add a select component to allow changing the dimming mode on the MCU, giving you a drop-down of dimming mode
options. Recommended to try out all and see which works best, then set it statically.

```yaml
select:
  - platform: "tuya"
    id: "dimmer_mode"
    name: "Dimming Mode"
    enum_datapoint: 4
    options:
      0: Mode 1 # Index 0
      1: Mode 2 # Index 1
      2: Mode 3 # Index 2
```

Here is a script that will set the dimming mode in a more static fashion when ESPHome Reboots. This will select based on
the index of the select component instead of by name of the mode. This can still be set via drop down if this script is
included, it will just set it to this value every boot.

```yaml
esphome:
  on_boot:
    then:
      - delay: 30s # Wait 30 seconds because even with a priority of -200.0, it will not update the datapoint.
      - select.set_index:
          id: "dimmer_mode"
          index: 2
```
