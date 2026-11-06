---
title: DETA Grid Connect Smart Switch (Single 6911HA / Double 6912HA / Triple 6903HA / Quad 6904HA)
date-published: 2023-10-23
type: switch
standard: au
board: bk72xx
---

## General Notes

The DETA [Smart Single Switch (6911HA)][1] and [Smart Double Switch (6912HA)][2] are made by Arlec as part of the
[Grid Connect ecosystem][3], and are sold at Bunnings in Australia and New Zealand.

[1]: https://www.bunnings.com.au/deta-smart-single-gang-light-switch-touch-activated-with-grid-connect_p0098811
[2]: https://www.bunnings.com.au/deta-smart-double-gang-light-switch-touch-activated-with-grid-connect_p0098812
[3]: https://grid-connect.com.au/

### Series 1

Series 1 models could be OTA flashed using using tuya-convert.

### Series 2

[Triple 6903HA][4] and [Quad 6904HA][5] The pin outs on the 3 & 4 gang switches are different to the 1 and 2 gang
switches. Some 4 gang switches are on random Tuya firmware 1.1.5 and may need to use the "Lonsonho" brand
"X804A 4 Gang Smart Wifi Switch" option in Cloudcutter, otherwise use the Deta single gang switch.

[4]: https://www.bunnings.com.au/deta-smart-touch-activated-triple-gang-light-switch-with-grid-connect_p0161014
[5]: https://www.bunnings.com.au/deta-smart-touch-activated-quad-gang-light-switch-with-grid-connect_p0161015

### Series 3

Recently purchased devices are using the Beken BK7231N microcontroller and need flashing with a serial flasher. There
are headers on the board.

## Getting it up and running

### Cloudcutter

[Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) is a tool designed to simplify the process of
flashing Tuya-based devices. It allows you to bypass the need for physically opening the device and swapping out chips.
By leveraging the cloud APIs, Cloudcutter enables you to flash the firmware remotely, making it a convenient and less
intrusive option. Follow the instructions on the
[Cloudcutter GitHub repository](https://github.com/tuya-cloudcutter/tuya-cloudcutter) to use this method for flashing
your device.

### Disassembly

If you can't or don't wish to use Cloudcutter, you can flash directly to the outlet with USB to serial adapter.

## Overview

This guide covers the DETA Smart Switches, including the [Single (6911HA)][1] and [Double (6912HA)][2], which are part
of the [Grid Connect ecosystem][3]. These switches are available at Bunnings stores in Australia and New Zealand.

## Series Information

### Series 1 - Flashing

- **Flashing Method**: OTA via tuya-convert

### Series 2 - Flashing

- **Microcontroller**: Beken BK7231T
- **Flashing Method**: OTA via Cloudcutter

> **Note**: The [Triple 6903HA][4] and [Quad 6904HA][5] models have different pinouts compared to the 1 and 2 gang
switches.
>
### Series 3 - Flashing

- **Microcontroller**: Beken BK7231N
- **Flashing Method**: Serial

## Setup Guide

### Using Cloudcutter

[Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) is a tool designed to simplify the flashing process.
Follow the [official guide](https://github.com/tuya-cloudcutter/tuya-cloudcutter) for instructions.

### Manual Flashing

If you prefer to flash manually, you'll need a USB to serial adapter. Follow the disassembly steps below:

1. Remove the front plastic face.
2. Unscrew the two exposed screws.
3. Remove the clear panel and the small PCB underneath.

> **Tip**: You can convert these switches to ESPHome by replacing the WB3S chip with an ESP-12E or ESP-12F chip and
adding a 10k pull-down resistor on GPIO15.

## GPIO Pinouts

### Tuya-Based Models

| Pin    | Function                       |
| ------ | ------------------------------ |
| GPIO4  | Status LED _(inverted)_        |
| GPIO12 | Button, Bottom                 |
| GPIO13 | Relay, Top _(includes LED)_    |
| GPIO14 | Relay, Bottom _(includes LED)_ |
| GPIO16 | Button, Top                    |

Triple 6903HA

| Pin    | Function                       |
| ------ | ------------------------------ |
| GPIO16 | Button, Top                    |
| GPIO04 | Button, Middle                 |
| GPIO03 | Button, Bottom                 |
| GPIO05 | Relay, Top _(includes LED)_    |
| GPIO14 | Relay, Middle _(includes LED)_ |
| GPIO12 | Relay, Bottom _(includes LED)_ |
| GPIO0  | Status LED _(inverted)_        |

### BK72XX-Based Models

| Pin | Function                      |
| --- | ----------------------------- |
| P6  | Relay, Left _(includes LED)_  |
| P9  | Status LED _(inverted)_       |
| P14 | Button, Left                  |
| P24 | Button, Right                 |
| P26 | Relay, Right _(includes LED)_ |

> **Note**: Each relay shares a pin with its associated LED.

## Advanced Modifications

To gain individual control of button LEDs, remove specific diodes and solder a wire from the cathode side of the diode
pad to a spare GPIO pin.
[See this example](https://community-assets.home-assistant.io/optimized/4X/f/9/b/f9b1f8ea23ccc1049ea4eda1765e3f19fb173925_2_666x500.jpeg).

## Configuration Examples

### 1 & 2 Gang Configuration for the BK72XX configurations

```yaml
substitutions:
  devicename: "deta-double-gang"
  friendlyname: Deta Double Gang Switch
  friendlyname_left: Deta Double Gang - Left
  friendlyname_right: Deta Double Gang - Right
  deviceid: deta_double_gang
  deviceicon: "mdi:light-recessed"
  devicemodel: Deta Grid Connect Double Gang 6912HAMBK (Matte Black)

#################################
esphome:
  name: ${devicename}

bk72xx:
  board: generic-bk7231t-qfn32-tuya

packages:
  device_base:
    !include {
      file: common/device_base.yaml,
      vars: { friendlyname: "Deta Double Gang Switch" },
    }

#################################

## ---------------- ##
##    Status LED    ##
## ---------------- ##
status_led:
  pin:
    number: P9
    inverted: true

## ---------------- ##
##      Relays      ##
## ---------------- ##
output:
  # Left Relay
  - platform: gpio
    id: relay_left
    pin: P6
  # Right Relay
  - platform: gpio
    id: relay_right
    pin: P26

## ------------ ##
##    Lights    ##
## ------------ ##
light:
  # Left Light
  - platform: binary
    name: ${friendlyname_left}
    icon: ${deviceicon}
    output: relay_left
    id: light_left

  # Right Light
  - platform: binary
    name: ${friendlyname_right}
    icon: ${deviceicon}
    output: relay_right
    id: light_right
    internal: True

## ----------------- ##
##      Buttons      ##
## ----------------- ##
binary_sensor:
  # Left Button
  - platform: gpio
    id: button_left
    pin:
      number: P14
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - light.toggle: light_left
    internal: True

  # Right Button
  - platform: gpio
    id: button_right
    pin:
      number: P24
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - light.toggle: light_right
    internal: True
```

### 2 Gang Configuration for ESP

```yaml
esphome:
 name: "deta6912ha"
 friendly_name: DETA Smart Double Switch

esp8266:
  board: esp01_1m
  early_pin_init: False

logger:
  baud_rate: 0
 
captive_portal:
  
api:
  encryption:
    key: !secret api_key
  
ota:
  platform: esphome
  password: !secret ota_password
  
wifi:
 ssid: !secret wifi_ssid
 password: !secret wifi_password
 ap:
   ssid: "DETA Smart Double Switch"
   password: !secret wifi_ap_password

status_led:
  pin:
    number: GPIO4
    inverted: False

output:
  - platform: gpio
    pin: GPIO13
    id: relay1
  - platform: gpio
    pin: GPIO14
    id: relay2
  
light:
  - platform: binary
    name: "Light 1"
    output: relay1
    id: light1
  - platform: binary
    name: "Light 2"
    output: relay2
    id: light2

binary_sensor:
  - platform: gpio
    id: button1
    pin:
      number: GPIO16
      mode: INPUT
      inverted: True
    on_press:
      - light.toggle: light1
  - platform: gpio
    id: button2
    pin:
      number: GPIO12
      mode: INPUT
      inverted: True
    on_press:
      - light.toggle: light2


switch:
  - platform: restart
    name: "Restart"
```

### 3 Gang Configuration for BK72XX (Series 2)

```yaml
substitutions:
  devicename: "deta-triple-gang-switch"
  friendlyname: Deta Triple Gang Switch
  friendlyname_1: Light 1
  friendlyname_2: Light 2
  friendlyname_3: Light 3
  deviceid: deta_triple_gang
  deviceicon: "mdi:light-recessed"
  devicemodel: Deta Grid Connect Triple Gang 6903HA Series 2

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

#################################

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

## ---------------- ##
##    Status LED    ##
## ---------------- ##
status_led:
  pin:
    number: P1
    inverted: true

## ---------------- ##
##      Relays      ##
## ---------------- ##
output:
  # Relay 1
  - platform: gpio
    id: relay_1
    pin: P8
  # Relay 2
  - platform: gpio
    id: relay_2
    pin: P26
  # Relay 3
  - platform: gpio
    id: relay_3
    pin: P24

## ------------ ##
##    Lights    ##
## ------------ ##
light:
  # Light 1
  - platform: binary
    name: ${friendlyname_1}
    icon: ${deviceicon}
    output: relay_1
    id: light_1

  # Light 2
  - platform: binary
    name: ${friendlyname_2}
    icon: ${deviceicon}
    output: relay_2
    id: light_2

    # Light 3
  - platform: binary
    name: ${friendlyname_3}
    icon: ${deviceicon}
    output: relay_3
    id: light_3

## ----------------- ##
##      Buttons      ##
## ----------------- ##
binary_sensor:
  # Button 1
  - platform: gpio
    id: button_1
    pin:
      number: P14
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - light.toggle: light_1
    internal: True

  # Button 2
  - platform: gpio
    id: button_2
    pin:
      number: P9
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - light.toggle: light_2
    internal: True

    # Button 3
  - platform: gpio
    id: button_3
    pin:
      number: P10
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - light.toggle: light_3
    internal: True
```

### 3 Gang Configuration for ESP

```yaml
substitutions:
  device_name: deta3gangswitch
  friendly_name: "3 Gang Switch"
  device_ip: 192.168.0.x

#################################

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m
  restore_from_flash: true

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: ${device_ip}
    gateway: 192.168.0.1
    subnet: 255.255.255.0
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "ESPHOME"
    password: "12345678"

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret ota_password

logger:

# The web_server & sensor components can be removed without affecting core functionaility.
web_server:
  port: 80

sensor:
  - platform: wifi_signal
    name: ${device_name} Wifi Signal Strength
    update_interval: 60s
  - platform: uptime
    name: ${device_name} Uptime

#################################

status_led:
  pin:
    number: GPIO0
    inverted: True

output:
  # 1st button
  - platform: gpio
    pin: GPIO5
    id: relay1

  # 2nd button
  - platform: gpio
    pin: GPIO14
    id: relay2

  # 3rd button
  - platform: gpio
    pin: GPIO12
    id: relay3

light:
  # 1st button
  - platform: binary
    name: "${friendly_name} 1st"
    output: relay1
    id: light1

  # 2nd button
  - platform: binary
    name: "${friendly_name} 2nd"
    output: relay2
    id: light2

  # 3rd button
  - platform: binary
    name: "${friendly_name} 3rd"
    output: relay3
    id: light3

# Buttons
binary_sensor:
  # 1st button
  - platform: gpio
    pin:
      number: GPIO16
      mode: INPUT
      inverted: True
    name: "${friendly_name} 1st Button"
    #toggle relay on push
    on_press:
      - light.toggle: light1

  # 2nd button
  - platform: gpio
    pin:
      number: GPIO4
      mode: INPUT_PULLUP
      inverted: True
    name: "${friendly_name} 2nd Button"
    #toggle relay on push
    on_press:
      - light.toggle: light2

  # 3rd button
  - platform: gpio
    pin:
      number: GPIO3
      mode: INPUT_PULLUP
      inverted: True
    name: "${friendly_name} 3rd Button"
    #toggle relay on push
    on_press:
      - light.toggle: light3

switch:
  - platform: restart
    name: "${friendly_name} REBOOT"
```

### 4 Gang Configuration for BK72XX (Series 2)

```yaml
substitutions:
  devicename: "deta-quad-gang-switch"
  friendlyname: Deta Quad Gang Switch
  friendlyname_1: Light 1
  friendlyname_2: Light 2
  friendlyname_3: Light 3
  friendlyname_4: Light 4
  deviceid: deta_quad_gang
  deviceicon: "mdi:light-recessed"
  devicemodel: Deta Grid Connect Quad Gang 6904HA Series 2

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

#################################

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

## ---------------- ##
##    Status LED    ##
## ---------------- ##
status_led:
  pin:
    number: P1
    inverted: true

## ---------------- ##
##      Relays      ##
## ---------------- ##
output:
  # Relay 1
  - platform: gpio
    id: relay_1
    pin: P8
  # Relay 2
  - platform: gpio
    id: relay_2
    pin: P26
  # Relay 3
  - platform: gpio
    id: relay_3
    pin: P7
  # Relay 4
  - platform: gpio
    id: relay_4
    pin: P24

## ------------ ##
##    Lights    ##
## ------------ ##
light:
  # Light 1
  - platform: binary
    name: ${friendlyname_1}
    icon: ${deviceicon}
    output: relay_1
    id: light_1

  # Light 2
  - platform: binary
    name: ${friendlyname_2}
    icon: ${deviceicon}
    output: relay_2
    id: light_2

    # Light 3
  - platform: binary
    name: ${friendlyname_3}
    icon: ${deviceicon}
    output: relay_3
    id: light_3

    # Light 4
  - platform: binary
    name: ${friendlyname_4}
    icon: ${deviceicon}
    output: relay_4
    id: light_4

## ----------------- ##
##      Buttons      ##
## ----------------- ##
binary_sensor:
  # Button 1
  - platform: gpio
    id: button_1
    pin:
      number: P14
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - light.toggle: light_1
    internal: True

  # Button 2
  - platform: gpio
    id: button_2
    pin:
      number: P9
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - light.toggle: light_2
    internal: True

    # Button 3
  - platform: gpio
    id: button_3
    pin:
      number: P6
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - light.toggle: light_3
    internal: True

    # Button 4
  - platform: gpio
    id: button_4
    pin:
      number: P10
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      then:
        - light.toggle: light_4
    internal: True
```

### 4 Gang Configuration for ESP

> **Note**: Not updated for BK72XX.

```yaml
substitutions:
  device_name: deta4gangswitch
  friendly_name: "4 Gang Switch"
  device_ip: 192.168.0.x

#################################

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m
  restore_from_flash: true

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: ${device_ip}
    gateway: 192.168.0.1
    subnet: 255.255.255.0
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "ESPHOME"
    password: "12345678"

api:
  encryption:
    key: !secret api_encryption_key

ota:
  password: !secret ota_password

logger:

# The web_server & sensor components can be removed without affecting core functionaility.
web_server:
  port: 80

sensor:
  - platform: wifi_signal
    name: ${device_name} Wifi Signal Strength
    update_interval: 60s
  - platform: uptime
    name: ${device_name} Uptime

#################################

status_led:
  pin:
    number: GPIO0
    inverted: True

output:
  # 1st button
  - platform: gpio
    pin: GPIO5
    id: relay1

  # 2nd button
  - platform: gpio
    pin: GPIO14
    id: relay2

  # 3rd button
  - platform: gpio
    pin: GPIO12
    id: relay3

  # 4th button
  - platform: gpio
    pin: GPIO15
    id: relay4

light:
  # 1st button
  - platform: binary
    name: "${friendly_name} 1st"
    output: relay1
    id: light1

  # 2nd button
  - platform: binary
    name: "${friendly_name} 2nd"
    output: relay2
    id: light2

  # 3rd button
  - platform: binary
    name: "${friendly_name} 3rd"
    output: relay3
    id: light3

  # 4th button
  - platform: binary
    name: "${friendly_name} 4th"
    output: relay4
    id: light4

# Buttons
binary_sensor:
  # 1st button
  - platform: gpio
    pin:
      number: GPIO16
      mode: INPUT
      inverted: True
    name: "${friendly_name} 1st Button"
    #toggle relay on push
    on_press:
      - light.toggle: light1

  # 2nd button
  - platform: gpio
    pin:
      number: GPIO4
      mode: INPUT_PULLUP
      inverted: True
    name: "${friendly_name} 2nd Button"
    #toggle relay on push
    on_press:
      - light.toggle: light2

  # 3rd button
  - platform: gpio
    pin:
      number: GPIO3
      mode: INPUT_PULLUP
      inverted: True
    name: "${friendly_name} 3rd Button"
    #toggle relay on push
    on_press:
      - light.toggle: light3

  # 4th button
  - platform: gpio
    pin:
      number: GPIO13
      mode: INPUT_PULLUP
      inverted: True
    name: "${friendly_name} 4th Button"
    #toggle relay on push
    on_press:
      - light.toggle: light4

switch:
  - platform: restart
    name: "${friendly_name} REBOOT"
```
