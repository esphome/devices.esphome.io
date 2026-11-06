---
title: Arlec 9W 92mm Grid Connect Smart RGB+CCT LED Downlight (ALD295HA)
date-published: 2025-06-23
type: light
standard: au
board: bk72xx
difficulty: 4
---

![Product Image](./ALD295HA.jpeg "Product Image")

Sold at Bunnings in Australia as
[Model number ALD295HA](https://www.bunnings.com.au/arlec-9w-92mm-grid-connect-smart-rgb-cct-led-downlight_p0549111).

This device uses a CB2S module (BK7231N MCU) + BP5768 10 Pin LED Driver, and can be flashed with the
`kickstart-bk7231n.uf2` [Kickstart](https://github.com/libretiny-eu/esphome-kickstart) firmware using
[ltchiptool](https://github.com/libretiny-eu/ltchiptool).

## Tuya Cloudcutter / Tuya Convert

The board cannot be flashed using Tuya Cloudcutter (Running Tuya version 1.5.40). I haven't tried Tuya Convert.

## Access

Ensure device is not plugged in.
This device can be accessed easily enough with a suction cup and a Phillips head screwdriver:

- Using a suction cup on the front diffuser, pop out the front diffuser, remove that and the cardboard reflector.
- Undo the 2 Phillips head screws and remove the back cover.
- Carefully remove the Control PCB from the LED PCB (6 Pin Connector).
- Once board has been removed, the TX/RX pins can be accessed for flashing.

![Remove diffuser Image](./1.jpg "1")
![Remove card and screws Image](./2.jpg "2")
![Remove back cover and PCB Image](./3.jpg "3")

## Flashing

I have had best success flashing these Tuya chips with the ESP Test Rack Module Programmer.
Solder connections to 3V3, GND, TX, RX and connect to module programmer of choice. additional GND required to touch CEN
during start of flashing process.

| CB2S | Programmer              |
| ---- | ----------------------- |
| 3V3  | 3V3                     |
| GND  | GND                     |
| RX1  | TX (Maybe marked RX)    |
| TX1  | RX (Maybe marked TX)    |
| CEN  | Touch GND @ Flash Start |

![Pin Connections Image](./A.jpg "Pin Connections")
![3V3 GND TX RX soldered on Image](./B.jpg "3V3 GND TX RX soldered on")
![ESP flash module connections with additional GND Image](./C.jpg "ESP flash module connections with additional GND")
![Connections Image](./D.jpg "Connections")
![Touching CEN pin to reset for flash Image](./E.jpg "Touching CEN pin to reset for flash")

## GPIO Pinout CB2S

| Pin         | Function     |
| ----------- | ------------ |
| GPIO07/ P24 | BP5758 Data  |
| GPIO09/ P26 | BP5758 Clock |

![LED Driver](./4.jpg "BP5758")

## Example Configuration

Some values are commented out. Values were pulled from tuya dump.

```yaml
# model: Arlec 9W 92mm Grid Connect Smart RGB+CCT LED Downlight - ALD295HA (CB2S(BK7231N,tuya version was 1.5.40) + BP5758D)

substitutions:
  device_name: arlec-rgb-cct-ald295ha
  friendly_name: Arlec ALD295HA
  id_name: arlec_rgb_cct
#  light_name: Downlight  # Uncomment this line and change name under light entity to specifically name the light.

esphome:
  name: ${device_name}
  friendly_name: ${friendly_name}

bk72xx:
  board: cb2s
  #  board: generic-bk7231n-qfn32-tuya

logger:

web_server:
captive_portal:
mdns:
api:
ota:
  platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

bp5758d:
  clock_pin: P26
  data_pin: P24

output:
  - platform: bp5758d
    id: output_red
    channel: 3
    current: 14
    #max_power: 0.8
  - platform: bp5758d
    id: output_green
    channel: 2
    current: 14
    #max_power: 0.8
  - platform: bp5758d
    id: output_blue
    channel: 1
    current: 14
    #max_power: 0.8
  - platform: bp5758d
    id: output_cold
    channel: 5
    current: 24
    max_power: 0.8
  - platform: bp5758d
    id: output_warm
    channel: 4
    current: 24
    max_power: 0.8

light:
  - platform: rgbww
    id: ${id_name}
    name: None # Set to name: "${light_name}" to specifically name the light
    color_interlock: true
    constant_brightness: true
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
    red: output_red
    green: output_green
    blue: output_blue
    cold_white: output_cold
    warm_white: output_warm
    restore_mode: RESTORE_DEFAULT_ON
    gamma_correct: 1.5
    default_transition_length: 0.5s
    #max_brightness: 100%
    #min_brightness: 10%
```
