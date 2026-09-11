---
title: "DrĂˇtek ESP32S3 480x480px"
date: 2026-07-31
description: "Configuration for DrĂˇtek ESP32S3 480x480px smart touch display with ST7701S RGB display driver and GT911 touch"
tags:
  - display
  - touch
  - esp32s3
---

# DrĂˇtek ESP32S3 480x480px Smart Display

Smart touch display board featuring a 4.0 inch 480x480 IPS screen (ST7701S RGB display driver), GT911 capacitive touch, ESP32-S3 microcontroller with 16MB Flash and 8MB Octal PSRAM, 3 onboard relays, and backlight control.

## Hardware Specifications
* **MCU**: ESP32-S3 (16MB Flash, 8MB Octal PSRAM)
* **Display**: 4.0 inch IPS 480x480 ST7701S (RGB interface)
* **Touch Controller**: GT911 (I2C interface)
* **Backlight**: PWM LEDC on GPIO38
* **Relays**: GPIO40, GPIO2, GPIO1

## ESPHome Configuration

```yaml
# Board: Guition ESP32-S3-4848S040 480*480 Smart Screen
# Definition: definitions/boards/guition_esp32_s3_4848s040/manifest.yaml

esphome:
  name: esp-480480-displej
  friendly_name: ESP 480*480 displej

esp32:
  variant: esp32s3
  framework:
    type: esp-idf

logger:
  level: INFO

# Nutné pro stahování snímků z URL (online_image)
http_request:
  timeout: 5s
  verify_ssl: false

api:
  encryption:
    key: "GeUirNFkLTRdQ/2Cn33sDWl2oGADasGgLNt9x6yi4f4="

ota:
  - platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: ESP 480*480 dis Fallback Hotspot
    password: "at13PkbTRuGq"

captive_portal:

output:
  - platform: ledc
    frequency: 150Hz
    id: backlight_output
    min_power: 0.01
    pin: 38
    zero_means_zero: true

light:
  - platform: monochromatic
    default_transition_length: 1s
    id: display_backlight
    name: Backlight
    output: backlight_output
    restore_mode: ALWAYS_ON

psram:
  mode: octal
  speed: 80MHz

spi:
  - clk_pin: 48
    id: lcd_spi
    mosi_pin: 47

i2c:
  - id: touchscreen_bus
    scl:
      ignore_strapping_warning: true
      number: 45
    sda: 19

display:
  - platform: st7701s
    auto_clear_enabled: false
    color_order: RGB
    cs_pin: 39
    data_pins:
      blue: [4, 5, 6, 7, 15]
      green: [8, 20, 3, 46, 9, 10]
      red: [11, 12, 13, 14, 0]
    data_rate: 2MHz
    de_pin: 18
    dimensions:
      height: 480
      width: 480
    hsync_back_porch: 20
    hsync_front_porch: 10
    hsync_pin: 16
    hsync_pulse_width: 8
    id: tft_display
    init_sequence: [1, [255, 119, 1, 0, 0, 16], [205, 0]]
    invert_colors: false
    pclk_frequency: 12MHz
    pclk_inverted: false
    pclk_pin: 21
    spi_mode: MODE3
    update_interval: never
    vsync_back_porch: 10
    vsync_front_porch: 10
    vsync_pin: 17
    vsync_pulse_width: 8

touchscreen:
  - platform: gt911
    display: tft_display
    id: tft_touch

switch:
  - platform: gpio
    id: switch_gpio_1
    name: Relay 1
    pin:
      inverted: true
      number: 40
  - platform: gpio
    id: switch_gpio_2
    name: Relay 2
    pin:
      inverted: true
      number: 2
  - platform: gpio
    id: switch_gpio_3
    name: Relay 3
    pin:
      inverted: true
      number: 1

# Stahování snímku ze snapshot endpointu kamery (port 8081, cesta /snapshot)
image:
  - platform: online_image
    id: kamera_stream
    url: "http://192.168.1.193:8081/snapshot"
    format: JPEG
    type: RGB565
    resize: 480x480
    update_interval: 1s

lvgl:
  displays:
    - tft_display
  touchscreens:
    - tft_touch
  pages:
    - id: main_page
      widgets:
        # Zobrazení stahovaného obrázku přes celou plochu 480x480
        - image:
            src: kamera_stream
            width: 480
            height: 480
            align: center
        # Textový nadpis nahoře
        - label:
            text: "Kamera Obyvak"
            align: top_mid
            y: 15
            text_font: "montserrat_28"

```