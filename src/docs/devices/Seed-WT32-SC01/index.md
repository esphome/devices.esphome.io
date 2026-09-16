---
title: Seeed Studio WT32-SC01
date-published: 2025-08-12
type: misc
standard: global
board: esp32
difficulty: 2
---

https://www.seeedstudio.com/ESP32-Development-board-WT32-SC01-p-4735.html

![Seeed Studio WT32-SC01 front](https://media-cdn.seeedstudio.com/media/catalog/product/cache/bb49d3ec4ee05b6f018e93f896b8a25d/1/0/102991454_front.png)
![Seeed Studio WT32-SC01 back](https://media-cdn.seeedstudio.com/media/catalog/product/cache/bb49d3ec4ee05b6f018e93f896b8a25d/1/0/102991454_back-06.png)

```
esphome:
  name: test

esp32:
  board: esp-wrover-kit # ~ Seeed WT32-SC01
  framework:
    type: esp-idf

psram:
  mode: quad
  speed: 80MHz

# Enable logging
logger:

# SPI bus for display
spi:
  clk_pin: GPIO14   # TFT_SCLK
  mosi_pin: GPIO13  # TFT_MOSI
  miso_pin: GPIO12  # Optional, set if you need SPI read capability

# I2C bus for touch
i2c:
  sda: GPIO18       # TOUCH_SDA
  scl: GPIO19       # TOUCH_SCL
  frequency: 400kHz # From original code

font:
  - file: "gfonts://Roboto"  # Using Google Fonts Roboto as an example
    id: font20  # This is the ID you'll reference in the display
    size: 20

# Display configuration
display:
  - platform: mipi_spi
    model: ST7796
    id: display_screen
    dimensions:
      width: 480
      height: 320
    dc_pin: GPIO21    # TFT_DC
    cs_pin: GPIO15    # TFT_CS
    reset_pin: GPIO22 # TFT_RST
    rotation: 90      # For landscape mode
    invert_colors: false
    spi_mode: "0"
    auto_clear_enabled: False


# Touch configuration
touchscreen:
  - platform: ft63x6
    id: display_touch
    interrupt_pin: GPIO39
    display: display_screen
    address: 0x38
    transform:
      swap_xy: true
      mirror_y: true
    calibration:
      x_min: 0
      x_max: 480
      y_min: 0
      y_max: 320
    on_touch:
      - lambda: |-
          ESP_LOGI("Touch", "Touch detected at x=%d, y=%d, x_raw=%d, y_raw=%d", touch.x, touch.y, touch.x_raw, touch.y_raw);
          id(x_marker).set_points({ {touch.x, 0}, {touch.x, 320} });
          id(y_marker).set_points({ {0, touch.y}, {480, touch.y} });


lvgl:
  pages:
    - id: debug_page
      bg_color: 0x000000
      scrollbar_mode: "OFF"
      widgets:
        - line:
            id: x_marker
            points:
              - 0, 0
            line_width: 1
            line_color: 0xFFFFFF
            line_rounded: true
        - line:
            id: y_marker
            points:
              - 0, 0
            line_width: 1
            line_color: 0xFFFFFF
            line_rounded: true

output:
  - platform: ledc
    pin: GPIO23
    id: display_backlight_pwm

light:
  - platform: monochromatic
    output: display_backlight_pwm
    id: display_backlight
    restore_mode: ALWAYS_ON
    internal: True
```
