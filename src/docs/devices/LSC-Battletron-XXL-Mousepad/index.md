---
title: LSC Battletron XXL Mousepad
date-published: 2026-09-10
type: light
board: bk72xx
standard: eu
---

## General Notes

This configuration is for the LSC Battletron XXL Mousepad
![Picture of the product](product.png "Picture of the product")

## Warning
The LEDs on this product are quite dim and not resembling of the picture on the box, if you're buying this product, maybe reconsider. If you are fine with this then proceed

## Disassembly

To get into this product you need to unscrew 7 Philips head screws hidden beneath the bottom sticker.
To unscrew them you either need to damage the bottom sticker or remove it and have to glue it again.
![Location of the screws](screws.jpg "Location of the screws")
 
## How to flash

To flash the controller, open up the controller and take the board out.
On the back of the board there are 2 pins on the Tuya CBU module you need to solder wires to.
![Picture of the board](newboard.jpg "Picture of the board")

Alternatively if you are a bit crative you can try to use some wires and some pins and hold them to the required points. This is not recommended but is an option if you are very bad with soldering or can't for some reason.

Remember that you will still need another jumper wire to short the ground and the CEN pin on the module to begin the flashing

Powering the board from regular 5V USB to flash is fine, i used a Raspberry Pi to flash my chip.

#### To take a backup

If you are using the CLI tool take a backup using:

```bash
ltchiptool flash read bk7231n <backupname>
```

#### To flash the chip

1. Create an empty configuration with the yaml below
2. Download the compiled firmware file
3. If you are using the CLI tool flash the chip using:

```bash
ltchiptool flash write <firmwarefile>
```

## GPIO Pinout

| Pin | Function       |
| --- | -------------- |
| P6 | Button     |
| P16 | 2 WS2812 Leds |


```yaml
esphome:
  name: mousepad
  friendly_name: Mousepad

bk72xx:
  board: generic-bk7231n-qfn32-tuya

logger:
  baud_rate: 0
    
api:
  encryption:
    key: ""

ota:
  - platform: esphome
    password: !secret ota_mousepad
    
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "Mousepad Fallback Hotspot"
    password: "urv6OEvKVl8a"
    
captive_portal:

e131:
wled:
  
light:
  - platform: beken_spi_led_strip
    chipset: WS2812
    num_leds: 2
    pin: 16
    name: Mousepad RGB
    id: pad_leds
    channel_colors: GRB
    gamma_correct: 1.7 # Needed so the LEDs don't turn off at 10%
    effects:
      - pulse:
      - strobe:
      - addressable_rainbow:
      - addressable_color_wipe:
      - addressable_scan:
      - addressable_twinkle:
      - addressable_random_twinkle:
      - addressable_fireworks:
      - wled:
      - e131:
          universe: 1
          channels: RGB
          
binary_sensor:
  - platform: gpio
    pin: 6
    id: light_button
    on_click:
      then:
        - light.toggle: pad_leds
```
