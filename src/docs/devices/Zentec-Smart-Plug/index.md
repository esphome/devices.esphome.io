---
title: Zentec Smart Plug
date-published: 2020-07-06
type: plug
standard: us
board: esp8266
---

Standard plug socket, with 2A USB port. Flashable via tuya-convert. [Purchased from Amazon.](https://www.amazon.com/dp/B074YGV2NK)

At least two versions of this plug exist, but the only difference between the two is the pull-up on the pin for the
button.

## Pictures

![alt text](./zentec-outside.jpg "Outside of smart plug")
![alt text](./zentec-inside.jpg "Inside view")

## GPIO Pinout

| Pin    | Function                         |
| ------ | -------------------------------- |
| GPIO2  | ESP module blue LED              |
| GPIO4  | Red LED                          |
| GPIO12 | Relay                            |
| GPI013 | Button (pull-up on older models) |

## Basic Configuration

```yaml
substitutions:
  device_name: zentec
  friendly_name: Zentec Plug

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: on #we only have one WiFi AP so just use the first one that matches
  ap: #since we listed an SSID above, this AP mode will only enable if no WiFi connection could be made
    ssid: ${friendly_name}_AP
    password: !secret wifi_password

# Enable logging
logger:
  baud_rate: 0 #disable UART logging since we aren't connected to GPIO1 TX

# Enable Home Assistant API
api:

# Enable OTA updates
ota:
  safe_mode: True

# Enable web server
web_server:
  port: 80

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
      #mode: INPUT_PULLUP # only needed on older versions of this plug
      inverted: True
    name: "${friendly_name} Button"
    internal: false # set to true to hide from hub
    on_click:
      - switch.toggle: relay

status_led:
  pin:
    number: GPIO02
    inverted: true

switch:
  - platform: gpio
    name: "${friendly_name}"
    id: "relay"
    pin: GPIO12
    on_turn_on:
      then:
        - switch.turn_off: "redLED"
    on_turn_off:
      then:
        - switch.turn_on: "redLED"
    restore_mode: ALWAYS_OFF
  - platform: gpio
    name: "redLED"
    id: "redLED"
    pin: GPIO4
    inverted: true
    restore_mode: ALWAYS_ON
    internal: true
```

## Split Configuration

If you have multiple of these sockets (likely since they come in packs), you may want to keep the shared code in one
file and only put device specific information in files for each relay.

zentec-common.yaml:

```yaml
esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  fast_connect: on #we only have one WiFi AP so just use the first one that matches
  ap: #since we listed an SSID above, this AP mode will only enable if no WiFi connection could be made
    ssid: ${friendly_name}_AP
    password: !secret wifi_password

# Enable logging
logger:
  baud_rate: 0 #disable UART logging since we aren't connected to GPIO1 TX

# Enable Home Assistant API
api:

# Enable OTA updates
ota:
  safe_mode: True

# Enable web server
web_server:
  port: 80

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
      #mode: INPUT_PULLUP # only needed on older versions of this plug
      inverted: True
    name: "${friendly_name} Button"
    internal: false # set to true to hide from hub
    on_click:
      - switch.toggle: relay

status_led:
  pin:
    number: GPIO02
    inverted: true

switch:
  - platform: gpio
    name: "${friendly_name}"
    id: "relay"
    pin: GPIO12
    on_turn_on:
      then:
        - switch.turn_off: "redLED"
    on_turn_off:
      then:
        - switch.turn_on: "redLED"
    restore_mode: ALWAYS_OFF
  - platform: gpio
    name: "redLED"
    id: "redLED"
    pin: GPIO4
    inverted: true
    restore_mode: ALWAYS_ON
    internal: true
```

And for each device's yaml:

```yaml
substitutions:
  device_name: zentec
  friendly_name: Zentec Plug

<<: !include zentec-common.yaml
```
