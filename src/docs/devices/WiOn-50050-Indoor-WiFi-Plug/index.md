---
title: WiOn 50050 Indoor WiFi Plug
date-published: 2023-07-02
type: plug
standard: us
board: esp8266
Made-for-esphome: False
difficulty: 4
---
[Amazon Link](https://www.amazon.com/dp/B00ZYLRQNE)

## WiOn 50050 Indoor WiFi Plug

The device has 2 indicator LEDs, 1 power button, 1 reset button and 1 controllable relay.
The device is controlled by a ESP8266 that is from ECO-PLUGS/PAGECO-PLUGS, and the
[FCC filing](https://fcc.report/FCC-ID/PAGECO-PLUGS) can be found here.
The device uses a Proprietary app that cannot be flashed to ESPHome OTA, the initial install must be USB to Serial. Once
ESPHome is installed all future downloads can be OTA.

## Product Image

![WiOn 50050](WiOn-50050.jpg)

## GPIO Pinout

The GPIO pinout was learned from
[NorthernMan54](https://gist.github.com/NorthernMan54/ef912a07482b9ab83fa80b91b5b763e8).

The GPIOs being used are:

* Button: GPIO13
* Relay1: GPIO15

* ## Enter Flash Mode

In order to get the ESP chip into flash mode I did the following:
Hold GPIO0 to ground, then apply power. My connections were soldered, so I left GPIO0 connected to ground for the
duration of the flash.
Once log showed a successful flash I removed the GPIO0, TX and RX pins and rebooted device.
  
## Basic Configuration

```yaml
esphome:
  name: ecoplug
  friendly_name: EcoPlug

esp8266:
  board: esp01_1m

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "$proper_devicename Hotspot"
    password: !secret ap_password

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
    id: button
    on_press:
     - switch.toggle: relay1

  - platform: status
    name: Eco Plug

switch:
  - platform: gpio
    name: "Eco Plug 1"
    pin: GPIO15
    id: relay1
    icon: "mdi:power-socket-us"

captive_portal:
```
