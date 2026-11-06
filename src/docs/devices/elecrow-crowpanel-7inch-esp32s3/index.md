---
title: Elecrow CrowPanel ESP32-S3 7.0" HMI Display (DIS08070H)
date-published: 2026-03-18
type: misc
standard: global
board: esp32
difficulty: 2
---

![Elecrow CrowPanel ESP32-S3 7-inch](elecrow-crowpanel-7inch-esp32s3.jpg "Elecrow CrowPanel ESP32-S3 7-inch")

## Product Specs

| Feature | Spec |
|---------|------|
| Screen | EK9716BD3 driver, 800x480, RGB parallel interface |
| Touch | GT911 capacitive, 5-point multi-touch |
| CPU | ESP32-S3-WROOM-1-N4R8 |
| Flash | 4MB |
| PSRAM | 8MB (Octal) |
| I/O Expander | PCA9557 at I2C 0x18 |
| Backlight | PWM on GPIO 2 |
| USB | USB-C via a CH340 USB-serial chip on UART0 (flashing and logs) |
| Power | 5V via USB-C or JST connector |

Product page:
[Elecrow CrowPanel 7.0" ESP32-S3 HMI](https://www.elecrow.com/esp32-display-7-inch-hmi-display-rgb-tft-lcd-touch-screen-support-lvgl.html)

## Important Notes

### I2C Fix Required for GPIO 19/20 (USB_SERIAL_JTAG Pins)

GPIO19 and GPIO20 are shared with the ESP32-S3 USB_SERIAL_JTAG peripheral. The USB PHY pad holds these pins even after
the I2C driver tries to release them, causing continuous `I2C software timeout` errors. This affects ESPHome 2026.3.0
and later (ESP-IDF 5.5.3 and later). As of November 2026, the upstream issue is still open.

The fix requires a C header file (`usb_disable.h`) that disables the USB PHY pad before the I2C driver initializes.
Create this file in your ESPHome config directory alongside your YAML:

**usb_disable.h:**

```c
#pragma once

#include "soc/usb_serial_jtag_reg.h"
#include "soc/io_mux_reg.h"
#include "hal/usb_serial_jtag_ll.h"

static __attribute__((constructor(101))) void disable_usb_serial_jtag_phy() {
    usb_serial_jtag_ll_phy_enable_pad(false);
    CLEAR_PERI_REG_MASK(USB_SERIAL_JTAG_CONF0_REG, USB_SERIAL_JTAG_USB_PAD_ENABLE);
    CLEAR_PERI_REG_MASK(USB_SERIAL_JTAG_CONF0_REG, USB_SERIAL_JTAG_DP_PULLUP);
    PIN_FUNC_SELECT(IO_MUX_GPIO19_REG, PIN_FUNC_GPIO);
    PIN_FUNC_SELECT(IO_MUX_GPIO20_REG, PIN_FUNC_GPIO);
    PIN_INPUT_ENABLE(IO_MUX_GPIO19_REG);
    PIN_INPUT_ENABLE(IO_MUX_GPIO20_REG);
    REG_SET_BIT(IO_MUX_GPIO19_REG, FUN_PU);
    REG_SET_BIT(IO_MUX_GPIO20_REG, FUN_PU);
    REG_CLR_BIT(IO_MUX_GPIO19_REG, FUN_PD);
    REG_CLR_BIT(IO_MUX_GPIO20_REG, FUN_PD);
}
```

Then list it under `esphome:` `includes:` in your YAML, as the basic configuration below does.

See [#15356](https://github.com/esphome/esphome/issues/15356) for details.

### Flash Size is 4MB, Not 16MB

The ESP32-S3-WROOM-1-**N4**R8 has 4MB flash. The "N4" = 4MB flash, "R8" = 8MB PSRAM. Setting `flash_size: 16MB` causes a
`rst:0x3` boot loop with no log output. This is easy to get wrong because many online examples and even some Elecrow
documentation reference 16MB.

With 4 MB of flash, each of the two OTA slots holds about 1.75 MB. A full LVGL interface with several large fonts used
roughly 91-95 % of that in my builds, so it is worth keeping the number and size of fonts modest.

### Do NOT Touch the PCA9557

The CrowPanel V3.0 has a PCA9557 I/O expander (I2C 0x18) that is connected to the GT911 reset and interrupt lines.
Many people try to use it to reset the GT911 during boot. **This breaks touch every time.**

Here's why it works without PCA9557 manipulation:

1. PCA9557 powers up with all pins as inputs (high-impedance)
2. A pull-up resistor on the GT911 RST line brings it HIGH automatically
3. GT911 exits reset and boots on its own before ESPHome firmware starts
4. By the time ESPHome's GT911 driver calls `setup()`, the GT911 is already ready

### GT911 Address Varies Between Units

The GT911 I2C address is set by the state of GPIO38 during power-on:

- **GPIO38 LOW** -> address **0x5D** (most common)
- **GPIO38 HIGH** -> address **0x14**

This varies between individual units due to internal pull-up/pull-down differences. If touch doesn't work, try the other
address.

On at least one reported unit, the GT911 came up at 0x14 and still failed with `Calibration error`. Because the address
is latched at power-on, no configuration change can override it. A hardware pull-down on GPIO38 may be needed, but this
has not been confirmed.

### I2C Scan Breaks GT911

Setting `scan: true` on the I2C bus can interfere with GT911 communication. Always use `scan: false`.

## Pin Configuration

| Function | Pin(s) |
|----------|--------|
| I2C SDA (Touch) | GPIO 19 |
| I2C SCL (Touch) | GPIO 20 |
| Touch INT | GPIO 38 |
| Backlight PWM | GPIO 2 |
| Display DE | GPIO 41 |
| Display HSYNC | GPIO 39 |
| Display VSYNC | GPIO 40 |
| Display PCLK | GPIO 0 |
| Red data | GPIO 14, 21, 47, 48, 45 |
| Green data | GPIO 9, 46, 3, 8, 16, 1 |
| Blue data | GPIO 15, 7, 6, 5, 4 |

## Common Pitfalls

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `flash_size: 16MB` | Boot loop, no logging | Change to `4MB` |
| `i2c: scan: true` | GT911 fails | Set `scan: false` |
| Missing `invert_colors: true` | Wrong colors | Add it |
| Missing `pclk_inverted: true` | Garbled display | Add it |
| PCA9557 writes in `on_boot` | Touch stops working | Remove all PCA9557 code |
| Adding `interrupt_pin: 38` | Touch intermittent | Remove it, use polling |
| Adding `calibration:` to touchscreen | "Communication failed" | Remove it |
| Missing `usb_disable.h` | `I2C software timeout` | Add the header file (see notes above) |
| Logger not on UART0 | No logs over the USB-C port | Add `logger: hardware_uart: UART0` |

## Basic Configuration

Minimal working config with display, touch, and backlight -- no LVGL. Requires `usb_disable.h` (see Important Notes
above).

```yaml file=config.yaml
```

## LVGL Configuration

Add LVGL with touch, swipe gestures, and styled pages:

```yaml file=lvgl.yaml
```
