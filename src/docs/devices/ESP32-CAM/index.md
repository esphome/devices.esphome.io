---
title: Generic ESP32-CAM
date-published: 2019-10-11
type: misc
standard: global
board: esp32
---

## GPIO Pinout

| Pin    | Function        |
| ------ | --------------- |
| GPIO0  | External Clock  |
| GPIO26 | i2c Pins        |
| GPIO27 | i2c Pins        |
| GPIO05 | Data Pins       |
| GPIO18 | Data Pins       |
| GPIO19 | Data Pins       |
| GPIO21 | Data Pins       |
| GPIO36 | Data Pins       |
| GPIO39 | Data Pins       |
| GPIO34 | Data Pins       |
| GPIO35 | Data Pins       |
| GPIO25 | Vsync Pin       |
| GPIO23 | Href Pin        |
| GPIO22 | Pixel Clock Pin |
| GPIO32 | Power Down Pin  |
| GPIO4  | Camera Light    |

## Basic Configuration

```yaml
# Basic Config
# https://www.banggood.com/Geekcreit-ESP32-CAM-WiFi-bluetooth-Camera-Module-Development-Board-ESP32-With-Camera-Module-OV2640-p-1394679.html
esphome:
  name: esp_cam02

esp32:
  variant: esp32

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

logger:
  #level: INFO
api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: "ota_password"

esp32_camera:
  external_clock:
    pin: GPIO0
    frequency: 20MHz
  i2c_pins:
    sda: GPIO26
    scl: GPIO27
  data_pins: [GPIO5, GPIO18, GPIO19, GPIO21, GPIO36, GPIO39, GPIO34, GPIO35]

  # the order of the data_pins is significant, don't mix up the order

  vsync_pin: GPIO25
  href_pin: GPIO23
  pixel_clock_pin: GPIO22
  power_down_pin: GPIO32
  resolution: 800x600
  name: esp_cam02
  idle_framerate: 0.1fps

output:
  - platform: ledc
    pin: GPIO4
    channel: 2 # channel 1 is used for esp32_camera
    id: led
light:
  - platform: monochromatic
    output: led
    name: espcam_02 light
```
