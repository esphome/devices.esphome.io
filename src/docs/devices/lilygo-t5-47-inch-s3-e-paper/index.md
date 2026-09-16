---
title: "LilyGo T5-4.7 Inch S3 E-Paper"
date-published: 2026-05-11
type: misc
standard: global
board: esp32
project-url: https://github.com/jellybob/lilygo_t5_epaper_esphome_components
difficulty: 2
made-for-esphome: False
---

# LilyGo T5-4.7 Inch S3 E-Paper

LilyGo's [e-paper display](https://lilygo.cc/products/t5-4-7-inch-e-paper-v2-3) with a nice little case. The display isn't natively supported
by ESPHome so I [ported](https://github.com/jellybob/lilygo_t5_epaper_esphome_components) the reference code provided by LilyGo as a custom
component.

The touch screen is [supported](https://esphome.io/components/touchscreen/lilygo_t5_47/) but I've not tried using it so can't speak to how
good it is.

## Basic Configuration

```yaml file=config.yaml
esphome:
  name: lilygo
  # --- Hardware configuration starts ---
  platformio_options:
    # Based on https://github.com/Xinyuan-LilyGO/LilyGo-EPD47/blob/1eb6119fc31fcff7a6bafecb09f4225313859fc5/examples/demo/platformio.ini#L37
    upload_speed: 921600
    monitor_speed: 115200
    board_build.mcu: esp32s3
    board_build.f_cpu: 240000000L
    board_build.flash_size: 16MB
    board_build.flash_mode: qio
    board_build.flash_type: qspi
    board_build.psram_type: opi
    board_build.memory_type: qspi_opi
    board_build.boot_freq: 80m
    build_flags: "-DBOARD_HAS_PSRAM"

esp32:
  variant: esp32s3
  board: esp32-s3-devkitc-1
  flash_size: 16MB

  framework:
    type: esp-idf
    version: recommended
    advanced:
      # Used by the display driver for fast data transforms.
      include_builtin_idf_components: ["esp_driver_rmt"]

psram:
  mode: octal
  speed: 80Mhz
# --- Hardware configuration ends ---

# Pull in the display driver.
external_components:
  - source: github://jellybob/lilygo_t5_epaper_esphome_components

logger:

# The button labelled SENSOR_VN on the board.
binary_sensor:
  - platform: gpio
    id: sensor_vn_button
    pin: 
      number: GPIO21
      inverted: true
    name: "SENSOR_VN"
    on_press:
      - logger.log: Button pressed, updating display
      - component.update: epaper_display

display:
  - platform: ed047tc1
    # Just a name, set it how you want
    id: epaper_display

    # Currently the only supported board type
    board_type: lilygo-screen-4.7-s3-2.4 

    # Don't try to set this to anything silly fast, epaper is slow. 1 second refresh just about works.
    update_interval: 1min
    lambda: |-
      it.fill(COLOR_OFF);
      it.print(it.get_width() / 2, it.get_height() / 2, id(font_large), COLOR_ON, TextAlign::CENTER, "Hello, world!");

font:
  - file: "gfonts://Roboto"
    id: font_large
    size: 250
```
