---
title: Arlec Grid Connect Smart 9W RGB CCT LED Downlight (ALD092RHA)
date-published: 2021-08-11
type: light
standard: au
board: esp8266
---

Sold at Bunnings in Australia. Model number ALD092RHA.

Flashing requires opening the inline driver (hence, exposure to line voltage), and soldering wires to the TYWE5P board
inside.
Flashing via tuya-convert did not work for me. Assumed to be affected by
[New PSK format - Issue #483](https://github.com/ct-Open-Source/tuya-convert/issues/483).

Colour temperature advertised on the box as 3000K for warm white, 5700K for cold white + RGB.

## GPIO Pinout

| Pin    | Function              |
| ------ | --------------------- |
| GPIO04 | Cold white brightness |
| GPIO05 | Warm white brightness |
| GPIO12 | Red                   |
| GPIO13 | Blue                  |
| GPIO14 | Green                 |

## Flashing

- Open the driver by removing the four screws on the terminal covers, and then unclipping the back plate
- On the underside, solder wires to IO0, Tx, Rx, and GND.
- Easily flashed using [esphome-flasher](https://github.com/esphome/esphome-flasher). Connect both GPIO0 and GND to GND
  on your USB-UART bridge (Puts device in flash mode), then Tx and Rx as required. Power the device up (CARE to avoid
  the live voltage lugs, traces, etc), and hit flash.
  - The device can also presumably be powered from a suitable USB-UART bridge by also soldering to the 3.3v pin
    (labelled as such) on the board, and powering from the bridge. This avoids having to plug the device in at the wall
    for flashing, and hence removes the risk of exposure to the line voltage. Not tested.
- Once flashed, desolder the wires from earlier and re-assemble the device.

## Basic Configuration

```yaml
substitutions:
  device_name: "living_room_light_1"
  friendly_name: "Living Room Light 1"

esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

logger:

api:

ota:

sensor:
  - platform: uptime
    name: ${friendly_name} Uptime

  - platform: wifi_signal
    name: ${friendly_name} Signal Strength

output:
  - platform: esp8266_pwm
    id: output_cw
    pin: GPIO4
  - platform: esp8266_pwm
    id: output_ww
    pin: GPIO5
  - platform: esp8266_pwm
    pin: GPIO12
    id: output_r
  - platform: esp8266_pwm
    pin: GPIO13
    id: output_b
  - platform: esp8266_pwm
    pin: GPIO14
    id: output_g

light:
  - platform: rgbww
    color_interlock: true
    name: ${friendly_name}
    red: output_r
    green: output_g
    blue: output_b
    warm_white: output_ww
    cold_white: output_cw
    cold_white_color_temperature: 5700 K
    warm_white_color_temperature: 3000 K
```
