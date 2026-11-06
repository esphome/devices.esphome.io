---
title: Deta Grid Connect Double Powerpoint with Dual USB 6920HA
date-published: 2023-02-27
type: plug
standard: au
board: bk72xx
---

## Deta Grid Connect Smart Double Touch Power Point With Dual USB

Manufactured by
[Deta](https://detaelectrical.com.au/product/deta-grid-connect-smart-double-touch-power-point-with-dual-usb/)
this is a AU/NZ standard wall outlet/powerpoint with USB charging ports based on the Beken BK7231T module. Now that
ESPHome natively supports BK72XX microcontrollers, you can also put ESPHome directly onto the device.

## Getting it up and running

### Using Cloudcutter

[Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) is a tool designed to simplify the process of
flashing Tuya-based devices. It allows you to bypass the need for physically opening the device and swapping out chips.
By leveraging the cloud APIs, Cloudcutter enables you to flash the firmware remotely, making it a convenient and less
intrusive option. Follow the instructions on the
[Cloudcutter GitHub repository](https://github.com/tuya-cloudcutter/tuya-cloudcutter) to use this method for flashing
your Deta 6920HA device.

### Disassembly

If you can't or don't wish to use Cloudcutter, you can flash directly to the outlet with USB to serial adapter.

To disassemble the outlet in order to flash, remove the front plastic face (secured by clips on each side),
then remove the two exposed screws. Remove the clear panel and then carefully remove the small thin PCB
that sat underneath the panel.

## GPIO pinout

| GPIO # |   Component   |
|:------:|--------------:|
| P8     |    Status LED |
| P10    |     Sensor Rx |
| P7     |      Button 1 |
| P24    |      Button 2 |
| P6     |       Relay 1 |
| P26    |       Relay 2 |

## Basic Configuration

```yaml
substitutions:
  devicename: "deta-double-powerpoint-usb"
  friendlyname: Deta Powerpoint USB
  friendlyname_left: Powerpoint Left
  friendlyname_right: Powerpoint Right
  deviceid: deta-double-powerpoint-usb
  devicemodel: Deta Grid Connect 6920HA Series 2

#################################

esphome:
  name: ${devicename}
  
bk72xx:
  board: generic-bk7231t-qfn32-tuya

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "ESPHOME"
    password: "123456"

logger:

web_server:

captive_portal:

api:

ota:

sensor:
  - platform: wifi_signal
    name: ${friendlyname} Wifi Signal Strength
    update_interval: 60s
  - platform: uptime
    name: ${friendlyname} Uptime
  - platform: cse7766
    current:
      name: "${friendlyname} Current"
      icon: mdi:current-ac
      filters:
        - multiply: 4.867
        - throttle_average: 30s
    voltage:
      name: "${friendlyname} Voltage"
      icon: mdi:flash
      filters:
        - multiply: 1.905
        - throttle_average: 30s
    power:
      name: "${friendlyname} Power"
      icon: mdi:gauge
      id: powerpoint_wattage
      filters:
        - throttle_average: 30s
    energy:
      name: "${friendlyname} Energy"
      icon: mdi:gauge
      id: powerpoint_energy
      filters:
        - throttle: 30s
  - platform: total_daily_energy
    name: "${friendlyname} Daily Energy"
    power_id: powerpoint_wattage
    filters:
      - multiply: 0.001
      - throttle: 60s
    unit_of_measurement: kWh
    icon: mdi:chart-bar

text_sensor:
  - platform: wifi_info
    ip_address:
      name: ${friendlyname} IP
    ssid:
      name: ${friendlyname} SSID
    bssid:
      name: ${friendlyname} BSSID
    mac_address:
      name: ${friendlyname} Mac
  - platform: version
    name: ${friendlyname} ESPHome Version

# Enable time component for use by daily power sensor
time:
  - platform: homeassistant
    id: homeassistant_time

uart:
  rx_pin: P10
  baud_rate: 4800

output:
- platform: gpio
  pin: P8
  inverted: false
  id: led

###Buttons
binary_sensor:
# Left button
  - platform: gpio
    device_class: power
    pin:
      number: P7
      mode: INPUT
      inverted: True
    name: "${friendlyname} Left Button"
    #toggle relay on push
    on_press:
      - switch.toggle: relay_a
# Right button
  - platform: gpio
    device_class: power
    pin:
      number: P24
      mode: INPUT
      inverted: True
    name: "${friendlyname} Right Button"
    #toggle relay on push
    on_press:
      - switch.toggle: relay_b

switch:
  - platform: gpio
    pin: P6
    name: "${friendlyname_left}"
    restore_mode: always off
    id: relay_a
    icon: mdi:power-socket-au
  - platform: gpio
    pin: P26
    name: "${friendlyname_right}"
    restore_mode: always off
    id: relay_b
    icon: mdi:power-socket-au
    on_turn_on:
      - output.turn_on: led
    on_turn_off:
      - output.turn_off: led
```
