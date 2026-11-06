---
title: M5Stack CoreS3
date-published: 2025-12-05
type: misc
standard: global
board: esp32
project-url: https://docs.m5stack.com/en/core/CoreS3
made-for-esphome: false
difficulty: 2
---

ESP32-S3 based Core series device with 2.0" 320x240 IPS display, capacitive touch, AXP2101 PMU, AW9523 I/O
expander, internal BMI270 IMU, ES7210 microphone codec, speaker amp, microSD slot, and multiple Grove/M-Bus ports.

## Product Images

![M5Stack CoreS3](./M5Stack-CoreS3.png "M5Stack CoreS3")

## GPIO Pinout

| Pin    | Function                                  |
| ------ | ----------------------------------------- |
| GPIO3  | Display CS                                |
| GPIO35 | Display MISO / D-C (3-wire)               |
| GPIO36 | Display/SPI SCLK                          |
| GPIO37 | Display/SPI MOSI                          |
| GPIO4  | microSD CS (shares SPI bus)               |
| GPIO21 | Touchscreen IRQ                           |
| GPIO12 | Internal I2C SDA (PMU, touch, IMU, AW9523) |
| GPIO11 | Internal I2C SCL                          |
| GPIO2  | Grove Port A SDA                          |
| GPIO1  | Grove Port A SCL                          |
| GPIO9  | Port B                                    |
| GPIO8  | Port B                                    |
| GPIO18 | Port C                                    |
| GPIO17 | Port C                                    |
| GPIO0  | I2S MCLK (microphone codec)               |
| GPIO14 | I2S DATA IN (microphone codec)            |
| GPIO13 | I2S DATA OUT (speaker)                    |
| GPIO33 | I2S LRCK (mic + speaker)                  |
| GPIO34 | I2S BCLK (mic + speaker)                  |

Notes: LCD reset and backlight are driven by the AW9523 I/O expander, so no direct GPIO is exposed. Power rails and
battery telemetry are handled by the AXP2101 PMU on the internal I2C bus.

## External Components

[ESPHome AXP2101 Component by stefanthoss](https://github.com/stefanthoss/esphome-axp2101)

This component exposes battery voltage/level/charging state and lets you manage the CoreS3 power rails controlled by
the AXP2101 PMU.

## Example Configuration

Hardware-only starter configuration for the CoreS3 display, touch panel, and buses. Backlight and reset are managed by
the AXP2101/AW9523, so the display uses `-1` pins for those signals.

```yaml
substitutions:
  devicename: m5cores3
  upper_devicename: M5Stack CoreS3

esphome:
  name: ${devicename}
  friendly_name: ${upper_devicename}

esp32:
  board: esp32-s3-devkitc-1
  flash_size: 16MB
  framework:
    type: esp-idf
    ## Note: Disable these configurations if you face the boot loop issue.
    sdkconfig_options:
        CONFIG_ESP32S3_DATA_CACHE_64KB: "y"
        CONFIG_ESP32S3_DATA_CACHE_LINE_64B: "y"
        CONFIG_ESP32S3_INSTRUCTION_CACHE_32KB: "y"
        # Moves instructions and read only data from flash into PSRAM on boot.
        # Both enabled allows instructions to execute while a flash operation is in progress without needing to be placed in IRAM.
        # Considerably speeds up mWW at the cost of using more PSRAM.
        CONFIG_SPIRAM_RODATA: "y"
        CONFIG_SPIRAM_FETCH_INSTRUCTIONS: "y"

psram:
  mode: quad
  speed: 80MHz

logger:
  level: DEBUG

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  ap:
    ssid: ${upper_devicename} Fallback
    password: !secret wifi_password

captive_portal:

api:

ota:
  - platform: esphome

external_components:
  - source: github://m5stack/esphome-yaml/components
    components: [axp2101, aw88298, aw9523b ]

i2c:
  - id: bus_internal
    sda: GPIO12
    scl: GPIO11

spi:
  - id: spi_bus
    clk_pin: GPIO36
    mosi_pin: GPIO37

axp2101:
  id: axp2101_pmu
  i2c_id: bus_internal

# IO Expander
aw9523b:
  - id: aw9523b_hub
    i2c_id: bus_internal

output:
  - platform: axp2101
    type: range
    channel: DLDO1
    id: lcd_backlight_output
    min_voltage: 2600
    max_voltage: 3300

  - platform: axp2101
    channel: ALDO1
    voltage: 1800

  - platform: axp2101
    channel: ALDO2
    voltage: 3300

  - platform: axp2101
    channel: BLDO1
    voltage: 2800

  - platform: axp2101
    channel: BLDO2
    voltage: 1500
```

## Display

```yaml
touchscreen:
  - platform: ft63x6
    id: touch
    reset_pin:
      aw9523b: aw9523b_hub
      number: 0
    calibration:
      x_min: 0
      x_max: 320
      y_min: 0
      y_max: 240

display:
  - platform: mipi_spi
    model: M5CORE
    dc_pin: GPIO35
    reset_pin:
      aw9523b: aw9523b_hub
      number: 9
    cs_pin: GPIO3
    data_rate: 40MHz
    invert_colors: true
    id: m5cores3_lcd
    show_test_card: true

light:
  - platform: monochromatic
    id: lcd_backlight
    name: "LCD Backlight"
    icon: "mdi:television"
    entity_category: config
    output: lcd_backlight_output
    restore_mode: RESTORE_DEFAULT_ON
    default_transition_length: 250ms
```

## RTC

[BM8563 Time Source](https://esphome.io/components/time/bm8563/)

```yaml
# First block - component definition only
esphome:
  min_version: 2025.12.0

time:
  - platform: bm8563
    i2c_id: bus_internal
    # repeated synchronization is not necessary unless the external RTC
    # is much more accurate than the internal clock
    update_interval: never
```

```yaml
# Second block - more complex example with on_boot
esphome:
  on_boot:
    then:
      bm8563.read_time:
time:
  - platform: bm8563
    i2c_id: bus_internal
    update_interval: never
  - platform: homeassistant
    on_time_sync:
      then:
        bm8563.write_time:
```

## Notes

- **Power**: Use the AXP2101 external component to read battery status and enable rails like LCD/backlight if they are
  disabled by default.
- **Audio**: The ES7210 microphone and speaker amp share the I2S bus on GPIO0/13/14/33/34 if you want to add
  `i2s_audio` components.
- **Storage**: The microSD slot shares the LCD SPI bus with CS on GPIO4.
- **Expansion**: Grove Port A exposes I2C on GPIO2/1; Ports B (GPIO9/8) and C (GPIO18/17) are free GPIOs on the M-Bus.
- **Touchscreen**: The FT63X6 capacitive touch controller requires a reset pin driven by the AW9523B expander (pin 0).
  The calibration values ensure proper coordinate mapping for the 320x240 display.
- **IO Expander (AW9523B)**: This component manages LCD reset (pin 9), touchscreen reset (pin 0),
  and other peripheral power switches. It must be properly configured for the display and touch to function.
- **IMU (BMI270)**: The built-in BMI270 6-axis IMU is not yet supported in ESPHome.  
  It is available on the internal I2C bus at address 0x68.
- **RTC (BM8563)**: ESPHome component exists for version >=2025.12.0.
