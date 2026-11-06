---
title: Zemismart Moonlamp
date-published: 2020-12-31
type: light
standard: global
board: esp8266
---

![Product image](Moonlamp.jpg "Product Image")
![Bottom view](BottomView.jpg "Bottom View")
![LED Layout](LEDLayout.jpg "Bottom View")

The moonlamp has both RGB and Cold / Warm white handled by three groups of three leds.

Manufacturer:
[Zemismart](https://www.zemismart.com/products/christmas-gift-led-remote-control-light-compatible-with-alexa-google-home-3d-printing-children-bedroom-colorful-moon-lamp-app-121)

The moonlamp is powered by USB, so no special regional plugs needed.

## How to flash

1. Open

   There are 3 screws securing the bottom to the 3D printed moon.

2. Unmount circuit from the box

   5 more screws, securing the diffuser to the print, and the print to the socket.

3. Pins

   There are pads for RX, TX, 3.3v, GND and I00 nicely marked on the board, ignore my mess with the solder, the GND is
rather large and takes a lot of heat, and the solder I have at the moment is terrible, and I'm just waiting for
something new to arrive.

   **REMEMBER to disconnect the battery and the USB power before flashing!!!!**

![Soldering points](SolderingPoints.png "Soldering Points")

There is only 1 MB on the onboard esp8266, so the code has every thing 'extra' removed to keep it small, and being able
to do OTA.
The WW and CW temperature values are unknown, so purely guesses.
The CW/WW and colour LED's are mutually exclusive in the original firmware, probably to conserve power, this behaviour
is kept in esphome.

**Missing features**:
The original firmware claims to have touch control, so it will change colour when you tap the globe, I haven't had the
luck to figure out how that is done.
It seems to use slightly more power when running esphome than the original firmware (the included battery doesn't last
as long).

## Basic Config

```yaml
substitutions:
  device_name: Moonlamp
  espname: moonlamp

esphome:
  name: "${espname}"

esp8266:
  board: esp01-1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  reboot_timeout: 60min
  manual_ip:
    static_ip: 1.2.3.4
    gateway: 10.2.3.1
    subnet: 255.255.255.0
  #  use_address: 1.2.3.5
  fast_connect: true
  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${device_name} Hotspot"
    password: !secret appw

logger:
  baud_rate: 0

api:

ota:
  password: !secret otapw

output:
  - platform: esp8266_pwm
    id: output_red
    pin: GPIO4
  - platform: esp8266_pwm
    id: output_green
    pin: GPIO12
  - platform: esp8266_pwm
    id: output_blue
    pin: GPIO14
  - platform: esp8266_pwm
    id: output_warm_white
    pin: GPIO13
  - platform: esp8266_pwm
    id: output_cold_white
    pin: GPIO5

light:
  - platform: rgbww
    name: "${espname}"
    id: "${device_name}"
    color_interlock: true
    red: output_red
    green: output_green
    blue: output_blue
    warm_white: output_warm_white
    cold_white: output_cold_white
    warm_white_color_temperature: 2800 K
    cold_white_color_temperature: 6200 K
```
