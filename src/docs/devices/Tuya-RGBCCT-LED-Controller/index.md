---
title: Tuya AP-Future-RGBCCT LED Controller (AP-02-5CH-V2)
date-published: 2023-10-04
type: light
standard: global
board: BK72xx
---

Available on AliExpress: [WIFI RGBCCT](https://aliexpress.com/item/1005005724297417.html)

This controller is a RGB CCT PWM Controller based on the WB3S chipset by TUYA.
Since LibreTiny is supported by ESPHome since 2023.09 it is possible to use this chipset.

It is possible to convert this device with [Tuya-Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) with
the following profile:
[TY-02-1CH LED Strip](https://github.com/tuya-cloudcutter/tuya-cloudcutter.github.io/blob/master/devices/tuya-generic-ty-02-1ch-led-strip.json)

There are many variants that look almost identical from the outside. Scroll down past the Sample configuration to see
hints for other variants.

![Product Image](image.png "Product Image")

## Sample configuration

``` yaml
esphome:
  name: tuya-rgbcct-5ch-controller
  friendly_name: Tuya RGBCCT 5ch Controller

bk72xx:
  board: generic-bk7231t-qfn32-tuya

web_server:

captive_portal:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:
api:
ota:

text_sensor:
  - platform: debug
    reset_reason:
      name: Reset Reason
  - platform: libretiny
    version:
      name: LibreTiny Version

output:
  - platform: libretiny_pwm
    id: output_red
    pin: P9
  - platform: libretiny_pwm
    id: output_green
    pin: PWM5
  - platform: libretiny_pwm
    id: output_blue
    pin: PWM4
  - platform: libretiny_pwm
    id: output_cold
    pin: PWM2
  - platform: libretiny_pwm
    id: output_warm
    pin: PWM0

light:
  - platform: rgbww
    id: light_rgbww
    name: Light
    color_interlock: true
    cold_white_color_temperature: 6500 K
    warm_white_color_temperature: 2700 K
    red: output_red
    green: output_green
    blue: output_blue
    cold_white: output_cold
    warm_white: output_warm
```

## Model with RF

This section is based on a "TY02-1CH-RF-V1", a dimmable white-only variant of the device above, with an RF remote.
Remotes from other variants (RGB, RGBCCT, etc.) emit the same commands; the difference is just the face plate.

This config snippet handles off/on/dimmer/brighter.
The `dump:` section allows you to figure out what other buttons send, so you can give them purpose too.

```yaml
remote_receiver:
  dump:
    - nec
  pin:
    number: P7
    inverted: true
    mode: INPUT_PULLUP

binary_sensor:
  - platform: remote_receiver
    id: "off"
    nec:
      address: 0xFBE2
      command: 0xDA25
    on_press:
      then:
        - light.turn_off:
            id: light_monochromatic
  - platform: remote_receiver
    id: "on"
    nec:
      address: 0xFBE2
      command: 0xD926
    on_press:
      then:
        - light.turn_on:
            id: light_monochromatic
  - platform: remote_receiver
    id: "lower"
    nec:
      address: 0xFBE2
      command: 0x916E
    on_press:
      then:
        - light.dim_relative:
            id: light_monochromatic
            relative_brightness: -5%
            transition_length: 0s
  - platform: remote_receiver
    id: "higher"
    nec:
      address: 0xFBE2
      command: 0xF00F
    on_press:
      then:
        - light.dim_relative:
            id: light_monochromatic
            relative_brightness: 5%
            transition_length: 0s
```
