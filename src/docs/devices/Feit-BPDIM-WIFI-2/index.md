---
title: Feit BPDIM/WIFI/2
date-published: 2020-12-04
type: dimmer
standard: us
board: esp8266
---
Another Costco/Feit device. This template should work with DIM/WIFI, DIM/WIFI/2, and DIM/WIFI/3, if you can flash it.

Please take note that you will likely have to figure out how to reach the pins and do a serial firmware flash
if the device is newer than March 2020. The tuya-convert method is non-functional with the most recent Tuya firmware.
I have followed the method described [in this SmartThings community post](https://community.smartthings.com/t/costco-cheap-feit-smart-dimmer-wifi/208142)
to perform a serial flash. It works as expected.

I split these files myself, but the salient points are re-joined here. You will need to include your own WiFi, etc.

Also of note, adjust the `min_brightness`! In circuits with many bulbs (particularly with LEDs), dimming all the way
can result in complete blackness. By setting `min_brightness` to a higher value, you can determine what the lowest
setting will actually be, and still have some light showing. For example, in some of my circuits, I set this to 143
or 150. Leave `max_brightness` at 1000.

Disabling serial logging should not be a big deal as this device is unlikely to ever be tethered, except when attempting
a manual, serial flash. Once accomplished, OTA is the way to go.

```yaml
substitutions:
  comment: "...any comment here, like the device hostname..."
  platform: ESP8266
  board: esp01_1m
  devicename: my_bpdim_1
  propername: "My BPDIM 1"
  min_brightness: '10'
  max_brightness: '1000'

esphome:
  name: $devicename
  platform: $platform
  board: $board
  comment: "${comment}"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: on

  ap:
    ssid: AP_${devicename}

captive_portal:

ota:
  password: !secret ota_pass

api:
  encryption:
    key: !secret encryption_key

# disable serial logging by setting baud_rate to 0 because baud_rate/serial connection is used by tuyamcu
logger:
  baud_rate: 0

uart:
  rx_pin: GPIO3
  tx_pin: GPIO1
  baud_rate: 9600

tuya:

light:
  - platform: "tuya"
    name: "${propername}"
    dimmer_datapoint: 2
    switch_datapoint: 1
    min_value: $min_brightness
    max_value: $max_brightness
```
