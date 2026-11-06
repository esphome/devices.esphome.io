---
title: DETA Grid Connect Smart Dimmer Switch 6910HA
date-published: 2024-09-18
type: dimmer
standard: au
board: bk72xx
---

## General Notes

The DETA
[Smart Dimmer Switch 6910HA](https://www.bunnings.com.au/deta-white-grid-connect-smart-touch-single-dimmer_p0237206)
This device comes with a Tuya WB3S chip and there are now two methods to make this device compatible with ESPHome:

1. **Use [Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) to flash the device.**
2. **Swap out the chip with a compatible one.**

### Using Cloudcutter

[Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) is a tool designed to simplify the process of
flashing Tuya-based devices. It allows you to bypass the need for physically opening the device and swapping out chips.
By leveraging the cloud APIs, Cloudcutter enables you to flash the firmware remotely, making it a convenient and less
intrusive option. Follow the instructions on the
[Cloudcutter GitHub repository](https://github.com/tuya-cloudcutter/tuya-cloudcutter) to use this method for flashing
your 6910HA device.  
Use profile 1.1.9 bk7231s_common_iot_config_ty

### Swap chip

replacing the WB3S chip with a ESP-12F chip and adding a 10k pull-down resister on GPIO15 as WB3S does not require it
and omits it from the board.
There's a useful guide to disassemble and serial flash these switches [on Mike McGuire's blog][1]. After that, you can
use ESPHome's OTA functionality to make any further changes.

[1]: https://blog.mikejmcguire.com/2020/05/22/deta-grid-connect-3-and-4-gang-light-switches-and-home-assistant/

### ESP-Based Pinout

| Pin    | Function      |
| ------ | ------------- |
| GPIO1  | UART TX       |
| GPIO3  | UART RX       |
| EN     | 10k pull-up   |
| RES    | 10k pull-up   |
| GPIO15 | 10k pull-down |

### BK72XX-Based Pinout

| Pin | Function |
| --- | -------- |
| RX1 | Tuya Rx  |
| TX1 | Tuya Tx  |

## Dimmer Configuration

The dimmer requires the Tuya MCU and will expose 4 datapoints

1. = Switch
2. = Dimmer setting 0-1000 This is the light setting
3. = Min Dimmer setting 0 - 1000 When pressing the button this is the lowest the dimmer will go to
4. = Countdown timer in seconds to turn off the light ie 600 = 10Min

```yaml
substitutions:
  device_name: detadimmerwitch
  friendly_name: "Dimmer Switch"

#################################

esphome:
  name: ${device_name}
  friendly_name: ${friendly_name}

# ESP-Based Board
#board: esp01_1m
#esp8266_restore_from_flash: true

bk72xx:
  board: wb3s

# disable logging over UART
logger:
  baud_rate: 0

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${device_name} Fallback"
    password: "12345678"

api:
  encryption:
    key: !secret api_encryption_key

ota:
  - platform: esphome
    password: !secret ota_password

# The web_server & sensor components can be removed without affecting core functionaility.
web_server:
  port: 80

#################################
captive_portal:

# espsetup
#uart:
#  rx_pin: GPIO3
#  tx_pin: GPIO1
#  baud_rate: 9600

uart:
  rx_pin: P10
  tx_pin: P11
  baud_rate: 9600

sensor:
  - platform: wifi_signal
    name: ${device_name} Wifi Signal Strength
    update_interval: 60s
  - platform: uptime
    name: ${device_name} Uptime

# Register the Tuya MCU connection
tuya:

# light settings
light:
  - platform: "tuya"
    name: "${friendly_name}"
    # dimmers current value
    dimmer_datapoint: 2
    # dimmer on/off
    switch_datapoint: 1
    min_value_datapoint: 3
    min_value: 0
    max_value: 1000

switch:
  - platform: restart
    name: "${friendly_name} REBOOT"
```
