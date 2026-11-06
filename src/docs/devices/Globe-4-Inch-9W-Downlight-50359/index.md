---
title: Globe 4 Inch 9W Downlight 50359
date-published: 2022-09-07
type: light
standard: us
board: esp32
---

RGBWW smart light bulb, ultra slim recessed lighting kit, RGB colors + warm/cold white (2000K to 5000K), 120V AC
50/60Hz.

This device uses an incompatible module [WB2S](https://fcc.report/FCC-ID/2ANDL-WB2S/4580213.pdf "FCC") which needs to be
replaced with an ESP module. Besides the module, this process will require heat gun, soldering tools and moderate
soldering skill.

Works with [WT32C3-01N](https://www.alibaba.com/product-detail/WT32C3-01N-4MB-OEM-ESP32-wi_1600348544006.html "Alibaba")
module using the following template, but can work with others as well. This ESP32-C3 chip requires DIO flash mode to
avoid boot loops. If encountering brown out issues with `rst:0xf (BROWNOUT_RST)`, then try using a dedicated 3V3 power
supply with 28 guage or thicker wires (may need to be soldered). All wifi power saving must be disabled with this module
by including `power_save_mode: none`, reducing packet loss and average ping time from >1000ms to around 2-3ms on
average.

Constant Brightness (`constant_brightness`) is set to `true`. The original WB2S balances both white channels to combined
100% duty cycle.
Color Interlock (`color_interlock`) is set to `true` as well. The original WB2S does not enable white and color leds at
the same time.

## Flashing

Flash using ESP Web install and select ESP32-C3 option.

To put ESP32-C3 in flash mode EN needs to be pulled high and GPIO9 need to be pulled low. May take a 2-3 attempts, but
just disconnect and reconnect 3V3 while keeping GPIO9 pulled low and click the retry button again until it works.

The [datasheet](https://templates.blakadder.com/assets/WT32C3-01N_datasheet.pdf) references GPIO8 which needs to be
pulled low during flashing, but I couldn't easily find this on the board. Didn't seem to matter though.

| ESP32 Pin | USB Serial Pin | Comments                                                           |
| --------- | -------------- | ------------------------------------------------------------------ |
| 3V3       | 3V3            | Connect to dedicated 3V3 1A power supply if encountering brown out |
| G         | GND            |                                                                    |
| IO9       | Ground         | Round contact pad on back of board, pull low BEFORE attaching 3V3  |
| IO8       | 3V3            | Could not find this pin, but it didn't seem to be required         |
| TX        | RX             |                                                                    |
| RX        | TX             |                                                                    |
| EN        | 3V3            | Pull high to enable ESP32 (do not leave floating)                  |

## Running

For normal operation connect EN to VCC (pull high) to enable the C3 chip. GPIO9 has an internal pullup and it needs to
be high on power up for the module to boot so try and avoid that pin similar to GPIO0 on ESP8266.

ESP32's are power hungry on boot and the USB to serial adapter might not be able to provide enough power for that. Use a
stable 3.3v power supply that can supply more than 1A.

## GPIO Pinout

PINs matched using Saleae analyzer with the original WB2S module. The original chip uses 1KHz PWM by default, however
the and the ESP32-C3 seem to work better at
[1220Hz](https://www.esphome.io/components/output/ledc/ "ESPHome LEDC Frequencies").

| Pin    | Name | Function                       |
| ------ | ---- | ------------------------------ |
| GPIO3  | PWM1 | red (pwm, default 1KHz)        |
| GPIO10 | PWM2 | green (pwm, default 1KHz)      |
| GPIO6  | PWM3 | blue (pwm, default 1KHz)       |
| GPIO5  | PWM4 | warm white (pwm, default 1KHz) |
| GPIO4  | PWM5 | cold white (pwm, default 1KHz) |
| GPIO1  |      | unused, leave floating or low  |
| EN     |      | chip enable (pull high)        |

NOTE: To pull EN high for normal use, solder a wire between the round 3V3 and EN contact pads on the back of the board.
This must be done manually otherwise the chip won't power on if left floating.

## Basic Configuration

```yaml
# Variables
substitutions:
  number: "01"
  device_name: globe-light-${number}
  friendly_name: Globe Ceiling Light ${number}
  display_name: Globe Ceiling Light
  # Use recommended frequency - 1220Hz has bit_depth=16 and steps=65536
  ledc_frequency: "1200Hz"
  # Set transition time to 0s to eliminate lag
  transition_time: "0s"

# Basic Config
esphome:
  name: ${device_name}
  platformio_options:
    board_build.flash_mode: dio

esp32:
  variant: esp32c3
  framework:
    type: esp-idf

wifi:
  power_save_mode: none
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "ESPHome ${friendly_name}"
    password: !secret wifi_password_backup

logger:
  baud_rate: 115200

# Enable Home Assistant API
ota: { "password": !secret ota_password }
api:
  encryption:
    key: !secret encryption_key

# Enable NTP
time:
  - platform: sntp
    id: my_time

# General Config
text_sensor:
  - platform: version
    name: "${display_name} Version"
  - platform: wifi_info
    ip_address:
      name: "${display_name} IP Address"
    ssid:
      name: "${display_name} SSID"
    bssid:
      name: "${display_name} BSSID"

sensor:
  - platform: wifi_signal
    name: "${display_name} WiFi Signal"
    update_interval: 60s
    filters:
      - delta: 0.01
      - throttle: 300s
  - platform: uptime
    name: "${display_name} Uptime"
    filters:
      - throttle: 300s

switch:
  - platform: restart
    name: "${display_name} Restart"

# Light Config
light:
  - platform: rgbww
    name: "${friendly_name}"
    red: output_pwm1_red
    green: output_pwm2_green
    blue: output_pwm3_blue
    cold_white: output_pwm5_white_cold
    warm_white: output_pwm4_white_warm
    cold_white_color_temperature: 5000 K
    warm_white_color_temperature: 2000 K
    constant_brightness: true
    color_interlock: true
    default_transition_length: ${transition_time}
    restore_mode: RESTORE_AND_OFF

output:
  - platform: ledc
    pin: GPIO3
    frequency: ${ledc_frequency}
    id: output_pwm1_red
  - platform: ledc
    pin: GPIO10
    frequency: ${ledc_frequency}
    id: output_pwm2_green
  - platform: ledc
    pin: GPIO6
    frequency: ${ledc_frequency}
    id: output_pwm3_blue
  - platform: ledc
    pin: GPIO5
    frequency: ${ledc_frequency}
    id: output_pwm4_white_warm
  - platform: ledc
    pin: GPIO4
    frequency: ${ledc_frequency}
    id: output_pwm5_white_cold
```
