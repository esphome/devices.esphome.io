---
title: LEDVANCE SMART+ WIFI FLOOR
date-published: 2026-01-07
type: light
standard: global
board: bk72xx
---

LEDVANCE SMART+ WIFI FLOOR

## Product Details

- [SMART+ Wifi Floor Corner Slim](https://www.ledvance.com/en-int/home-lighting/products/smart-home/smart-luminaires/smart-indoor-luminaires/smart-floor-standing-luminaires/modern-and-smart-floor-standing-luminaire-for-indirect-illumination-with-wifi-technology-c231589?productId=206148)
- GTIN/EAN 4058075765153

Other of the "Floor" series are probably very similar.

## GPIO Pinout

| Pin | Function             |
| --- | -------------------- |
| P7  | Warm White LED PWM   |
| P9  | IR Receiver          |
| P16 | Addressable RGB Data |
| P24 | LED Power Supply     |
| P26 | Cold White LED PWM   |
| ADC | Microphone           |

## Flashing Instructions

- Unknown if this light can be flashed without disassembly.
- Module is snapped together and easy to disassemble.
- It's easy to solder wires to RX1 and TX1 pins to  flash using `esphome upload` or ltchiptool.
  See [flashing instructions](https://docs.libretiny.eu/docs/platform/beken-72xx/) at libretiny.

## Basic Configuration

This configuration ignores the IR receiver and microphone completely, it should be trivial to add IR capabilities.

The RGB LEDs seem to be controlled by an WS2811 (three LEDs per control-chip, I have not disassembled the lamp) and the
SM16703 timings work better than the WS2812 ones (the latter one produce frequent glitches in the output).

```yaml
---
substitutions:
  name: floor-lamp
  friendly_name: Floor Lamp

esphome:
  name: ${name}
  friendly_name: ${friendly_name}

bk72xx:
  board: cbu

logger:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

ota:

api:

output:
  - platform: libretiny_pwm
    id: output_cw
    pin: P26
    frequency: 1000 Hz
    power_supply: output_enable
  - platform: libretiny_pwm
    id: output_ww
    pin: P7
    frequency: 1000 Hz
    power_supply: output_enable

power_supply:
  - id: output_enable
    pin: P24
    keep_on_time: 0.5 s

light:
  - platform: beken_spi_led_strip
    rgb_order: RGB
    pin: P16
    num_leds: 6
    chipset: SM16703
    name: "RGB"
    power_supply: output_enable
    max_refresh_rate: 16 ms
  - platform: cwww
    name: "CCT"
    cold_white: output_cw
    warm_white: output_ww
    cold_white_color_temperature: 6536 K
    warm_white_color_temperature: 2000 K
    constant_brightness: true
```
