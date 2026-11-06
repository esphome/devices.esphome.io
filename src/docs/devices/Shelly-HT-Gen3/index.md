---
title: Shelly H&T Gen3
date-published: 2026-03-15
type: sensor
standard: eu, global
board: esp32
difficulty: 4
---

## Shelly H&T Gen3

![Product Image](product.png "Product Image")

Battery-powered WiFi temperature/humidity sensor with a segment E-Paper display (UC8119 controller).
Uses an ESP32-C3 with 8MB flash, a Sensirion SHT31 sensor, and a UltraChip UC8119
E-Paper segment display with 91 active segments, 10 digits and 13 icons.

*Requires custom ESPHome external components for the UC8119 display and Shelly H&T display layer.*

## GPIO Pinout

| GPIO | Function | Notes |
|--------|----------------|-----------------------------------------------|
| GPIO0 | Button | XTAL_32K_P, ext. pull-up, deep sleep wakeup |
| GPIO1 | I2C SDA | Shared bus (SHT31 + UC8119), ext. pull-up |
| GPIO2 | Power Rail ADC | Reads regulated 3.3V rail, not battery |
| GPIO3 | I2C SCL | 100kHz, external pull-up on FPC |
| GPIO4 | Battery ADC | Via voltage divider (÷3), GPIO18 enable |
| GPIO5 | Battery Presence | HIGH when batteries are connected |
| GPIO6 | UC8119 BUSY_N | LOW=busy, external pull-up on FPC |
| GPIO7 | UC8119 RESET_N | Active LOW, 10ms pulse |
| GPIO8 | USB Detect | HIGH=USB connected, LOW=battery |
| GPIO10 | UC8119 Enable | Display power gate, HIGH=on |
| GPIO18 | Batt Power En | Enables power-path for battery ADC |

## I2C Devices

| Device | Address | Function |
|--------|---------|--------------------------|
| SHT31 | 0x44 | Temperature & Humidity |
| UC8119 | 0x50 | E-Paper Segment Display |

## Serial Pinout (PCB Test Pads)

![UART Pinout](PCB_Pinout.png "UART Pinout")

The UART pads are bare test points on the PCB (no header installed).
Use pogo pins, test clips, or solder temporary wires for flashing.

| Pad | Function       |
|-----|----------------|
| 1   | NC             |
| 2   | RXD            |
| 3   | CHIP_EN        |
| 4   | GND            |
| 5   | TXD            |
| 6   | VCC 3V3        |
| 7   | BOOT / GPIO9   |

## Flashing

> **Note:** OTA flashing from the original Shelly firmware is **not possible**.
> Shelly Gen3 verifies OTA images with an ECDSA signature using their private key.
> The device must be flashed via UART using the PCB test pads.

To enter download mode, short **pad 7 (GPIO9)** to **pad 4 (GND)** while powering on the device. Release after boot.

### Backup the Original Firmware

Always back up the original firmware before flashing:

```bash
esptool.py --chip esp32c3 --port /dev/ttyUSB0 --baud 460800 \
  --before no-reset --after no-reset \
  read_flash 0 0x800000 shelly-ht-gen3-backup.bin
```

### Compile and Flash

```bash
esphome compile shelly-ht-gen3.yaml
esptool.py --chip esp32c3 --port /dev/ttyUSB0 --baud 460800 \
  write_flash 0x0 .esphome/build/shelly-ht-gen3/.pioenvs/shelly-ht-gen3/firmware-factory.bin
```

## Basic Configuration (USB Powered)

```yaml
esphome:
  name: shelly-ht-gen3
  friendly_name: "Shelly H&T Gen3"

esp32:
  board: esp32-c3-devkitm-1
  variant: ESP32C3
  flash_size: 8MB
  framework:
    type: esp-idf
    version: recommended
    sdkconfig_options:
      COMPILER_OPTIMIZATION_SIZE: y
    advanced:
      enable_ota_rollback: false

logger:
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
api:
ota:
  - platform: esphome
    on_begin:
      - lambda: id(display).show_ota_begin();
    on_progress:
      - lambda: id(display).show_ota_progress(x);
    on_end:
      - lambda: id(display).show_ota_end();
    on_error:
      - lambda: id(display).show_ota_error();

external_components:
  - source: github://oxynatOr/esphome-shelly_ht_gen3
    components: [shelly_ht_display]
    refresh: 5s
  - source: github://oxynatOr/esphome-uc8119
    components: [uc8119]
    refresh: 5s

i2c:
  sda: GPIO1
  scl: GPIO3
  scan: false
  frequency: 100kHz

sensor:
  - platform: sht3xd
    address: 0x44
    temperature:
      name: "Temperature"
      id: temp_sensor
      accuracy_decimals: 1
    humidity:
      name: "Humidity"
      id: humi_sensor
      accuracy_decimals: 0
    update_interval: 60s

  - platform: wifi_signal
    name: "WiFi Signal"
    id: wifi_rssi
    update_interval: 120s

  - platform: adc
    id: batt_adc
    pin: GPIO4
    attenuation: 12db
    update_interval: never
    internal: true
    samples: 15

time:
  - platform: homeassistant
    id: ha_time

# Layer 1: Generic UC8119 EPD segment display driver
uc8119:
  id: epd
  address: 0x50
  reset_pin: GPIO7
  busy_pin: GPIO6
  enable_pin: GPIO10
  ghost_clear_interval: 8h
  full_update_every: 360

# Layer 2: Shelly-specific display logic
shelly_ht_display:
  id: display
  display_id: epd
  update_interval: 1sec
  wifi_update_every: 20
  font: siekoo
  battery_adc_sensor: batt_adc
  battery_presence_sensor: batt_presence
  battery_power_enable: batt_power_en
  battery_divider: 3
  battery_full_voltage: 6.0
  battery_empty_voltage: 4.0
  battery_update_interval: 15sec
  battery_voltage:
    name: "Battery Voltage"
  battery_percent:
    name: "Battery Percent"
  external_power:
    name: "External Power"
  temperature_sensor: temp_sensor
  humidity_sensor: humi_sensor
  wifi_signal_sensor: wifi_rssi
  time_id: ha_time

output:
  - platform: gpio
    id: batt_power_en
    pin: GPIO18

binary_sensor:
  - platform: gpio
    id: batt_presence
    pin:
      number: GPIO5
      inverted: true
    internal: true

  - platform: gpio
    name: "Button"
    pin:
      number: GPIO0
      mode:
        input: true
        pullup: true
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on_off: 50ms

button:
  - platform: restart
    name: "Restart"
```

## Battery Powered Configuration (Deep Sleep)

```yaml
esphome:
  name: shelly-ht-gen3
  friendly_name: "Shelly H&T Gen3"
  on_boot:
    priority: -200
    then:
      - if:
          condition:
            binary_sensor.is_off: batt_presence
          then:
            - deep_sleep.prevent: deep_sleep_ctrl
  on_shutdown:
    then:
      - lambda: id(epd).power_off();

esp32:
  board: esp32-c3-devkitm-1
  variant: ESP32C3
  flash_size: 8MB
  framework:
    type: esp-idf
    version: recommended
    sdkconfig_options:
      COMPILER_OPTIMIZATION_SIZE: y
    advanced:
      enable_ota_rollback: false

logger:
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
api:
ota:
  - platform: esphome
    on_begin:
      - lambda: id(display).show_ota_begin();
    on_progress:
      - lambda: id(display).show_ota_progress(x);
    on_end:
      - lambda: id(display).show_ota_end();
    on_error:
      - lambda: id(display).show_ota_error();

external_components:
  - source: github://oxynatOr/esphome-shelly_ht_gen3
    components: [shelly_ht_display]
    refresh: 5s
  - source: github://oxynatOr/esphome-uc8119
    components: [uc8119]
    refresh: 5s

deep_sleep:
  id: deep_sleep_ctrl
  run_duration: 20s
  sleep_duration: 1min
  wakeup_pin:
    - pin:
        number: GPIO0
        mode:
          input: true
          pullup: true
        inverted: true
        allow_other_uses: true

i2c:
  sda: GPIO1
  scl: GPIO3
  scan: false
  frequency: 100kHz

sensor:
  - platform: sht3xd
    address: 0x44
    temperature:
      name: "Temperature"
      id: temp_sensor
      accuracy_decimals: 1
    humidity:
      name: "Humidity"
      id: humi_sensor
      accuracy_decimals: 0
    update_interval: 10s

  - platform: wifi_signal
    name: "WiFi Signal"
    id: wifi_rssi
    update_interval: 120s

  - platform: adc
    id: batt_adc
    pin: GPIO4
    attenuation: 12db
    update_interval: never
    internal: true
    samples: 15

time:
  - platform: homeassistant
    id: ha_time

# Layer 1: Generic UC8119 EPD segment display driver
uc8119:
  id: epd
  address: 0x50
  reset_pin: GPIO7
  busy_pin: GPIO6
  enable_pin: GPIO10
  ghost_clear_interval: 8h
  full_update_every: 360

# Layer 2: Shelly-specific display logic
shelly_ht_display:
  id: display
  display_id: epd
  update_interval: 1sec
  wifi_update_every: 20
  font: siekoo
  battery_adc_sensor: batt_adc
  battery_presence_sensor: batt_presence
  battery_power_enable: batt_power_en
  battery_divider: 3
  battery_full_voltage: 6.0
  battery_empty_voltage: 4.0
  battery_update_interval: 15sec
  battery_voltage:
    name: "Battery Voltage"
  battery_percent:
    name: "Battery Percent"
  external_power:
    name: "External Power"
  temperature_sensor: temp_sensor
  humidity_sensor: humi_sensor
  wifi_signal_sensor: wifi_rssi
  time_id: ha_time
  on_ready:
    then:
      - lambda: id(epd).power_off();
      - deep_sleep.enter: deep_sleep_ctrl

output:
  - platform: gpio
    id: batt_power_en
    pin: GPIO18

binary_sensor:
  - platform: gpio
    id: batt_presence
    pin:
      number: GPIO5
      inverted: true
    internal: true

  - platform: gpio
    name: "Button"
    pin:
      number: GPIO0
      mode:
        input: true
        pullup: true
      inverted: true
      allow_other_uses: true
    filters:
      - delayed_on_off: 50ms

button:
  - platform: restart
    name: "Restart"
```

## Display Layout

The UC8119 segment display has the following layout (all segments shown):

```text
+--------------------------------------------+
|                                            |
|  88:88            Arrow  Battery           |
|  T1 T2 : T3 T4     ^    [||||]             |
|                                            |
|  88.8              [8] °                   |
|  D1 D2 . D3       UNIT (C/F)               |
|  Temperature                               |
|                                            |
|  Frost Heat Vent  ?  Calendar              |
|   *     ~    @    =    #                   |
|                                            |
|  Signal  BT  Globe      88 %               |
|  ||||    *    @         H1 H2              |
|                         Humidity           |
|                                            |
+--------------------------------------------+
```

**Zones:**

| Zone | Digits | Function |
|------|--------|----------|
| Top left | T1 T2 : T3 T4 | Clock (HH:MM) |
| Top right | Arrow + Battery | Arrow, 5-segment battery |
| Center left | D1 D2 . D3 | Temperature (XX.X) |
| Center right | UNIT | °C/°F (small digit + °) |
| Icon row 1 | ❄ ♨ ❀ ☰ 📅 | Frost, Heat, Vent, ?, Cal |
| Icon row 2 | Signal, BT, Globe | WiFi, Bluetooth, Globe |
| Bottom right | H1 H2 % | Humidity (XX%) |

## Battery Measurement

The battery voltage is measured via GPIO4 (ADC1) through a voltage
divider (÷3). The measurement circuit requires GPIO18 to be set HIGH
to enable the power path before reading. The component handles this
automatically via the `battery_power_enable` output.

- **4× AA (LR6):** 4.0V (empty) to 6.4V (fresh)
- **ADC range:** ~1.33V to ~2.13V after divider
- **GPIO5:** Battery presence (HIGH when connected)
- **GPIO8:** USB detection (HIGH when USB connected)

## Deep Sleep Behavior

The component auto-detects deep sleep mode from the YAML config:

- **WiFi wake** (every Nth cycle): Full boot, HA time sync (~5s)
- **Non-WiFi wake** (other cycles): No WiFi, RTC time, fast (~1.5s)
- **USB connected:** Deep sleep prevented, always-on mode
- **Button press (GPIO0):** Wakes device from deep sleep

The `on_ready` trigger fires after non-WiFi display updates, allowing
the YAML to control when to enter deep sleep. The `on_shutdown` handler
saves the framebuffer to RTC memory, enabling partial refresh on the
next wake (no white flash).

## Known Limitations

- **OTA from Shelly firmware not possible:** ECDSA signature
  verification prevents flashing ESPHome OTA from stock firmware.
  UART flashing required.
- **Battery percentage accuracy:** The voltage-to-percentage mapping
  may need calibration for your battery chemistry and temperature.
  Default range (4.0V–6.0V) is for 4× AA alkaline batteries.
