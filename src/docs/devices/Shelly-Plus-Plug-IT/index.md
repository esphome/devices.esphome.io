---
title: Shelly Plus Plug IT
date-published: 2026-10-22
type: plug
standard: eu
board: esp32
difficulty: 2
---

Italian version of the Shelly Plus Plug (Italian/Schuko 10 A socket), model **SNPL-00110IT**.
ESP32-U4WDH (single core) with 4 MB flash, BL0937 power meter.

The pinout is **not** the same as the [Shelly Plus Plug S](/devices/shelly-plus-plug-s/).
The pins below were read from the stock 2.0.1 firmware and checked on the hardware.

## GPIO Pinout

| Pin    | Function                       |
| ------ | ------------------------------ |
| GPIO4  | Relay (active high)            |
| GPIO26 | Button (active low)            |
| GPIO32 | LED 1 (active low)             |
| GPIO33 | LED 2 (active low)             |
| GPIO27 | BL0937 CF                      |
| GPIO14 | BL0937 CF1                     |
| GPIO12 | BL0937 SEL (inverted)          |
| GPIO34 | NTC (10k at 25 °C, B 3950)     |

GPIO16 and GPIO17 are used by the internal flash: do not use them.

## Flashing

### Over the air with free-shelly-ota (no UART)

Tested on a unit with stock firmware 2.0.1, with
[free-shelly-ota](https://github.com/oxynatOr/free-shelly-ota) 0.4.0:

1. Create the profile from the official 2.0.1 package:
   `python ota.py add-device <official.zip>` and
   `python ota.py partition-csv PlusPlugIT --official <official.zip> -o PlusPlugIT-stock.csv`.
2. Build the config below with the stock partition table, so the image matches the layout in flash.
   Replace the `esp32:` block with this one and put `PlusPlugIT-stock.csv` next to your yaml:

   ```yaml inline
   esp32:
     variant: esp32
     board: esp32dev
     flash_size: 4MB
     partitions: PlusPlugIT-stock.csv
     framework:
       type: esp-idf
       sdkconfig_options:
         CONFIG_FREERTOS_UNICORE: y
         # Shelly's bootloader header says 80 MHz: without this `build` refuses
         CONFIG_ESPTOOLPY_FLASHFREQ_80M: "y"
       advanced:
         enable_ota_rollback: false
   ```

   and add `allow_partition_access: true` to your `ota:` entry.
3. Download both the factory and the OTA image from ESPHome, then
   `python ota.py build PlusPlugIT <ota.bin> --esphome-factory <factory.bin> --boot-min-version 1.0.9`,
   `python ota.py send PlusPlugIT <zip> --ip <plug IP> --dry-run` (must report target slot 0) and the same
   command without `--dry-run`.

The stock 2.0.1 partition table produced by `partition-csv`:

```text
nvs, data, nvs, 0x9000, 0x4000,
otadata, data, ota, 0xd000, 0x2000,
app_0, app, ota_0, 0x10000, 0x190000,
fs_0, data, spiffs, 0x1a0000, 0x60000,
app_1, app, ota_1, 0x200000, 0x190000,
fs_1, data, spiffs, 0x390000, 0x60000,
aux, 0x55, 0x0, 0x3f0000, 0xc000,
shelly, data, 0x88, 0x3fc000, 0x4000,
```

The package replaces Shelly's bootloader with ESPHome's, so later ESPHome OTA updates work normally.
During the update the Shelly installer burns an eFuse (`FW signatures: want 07 got 00`, `BURN BLOCK3`):
the plug may not accept Shelly firmware again. If something goes wrong, only UART can recover it.

### Via Tasmota (old stock firmware)

A unit with factory firmware 0.11.99 was converted with the `PlusPlugIT` zip of
[mgos32-to-tasmota32](https://github.com/tasmota/mgos32-to-tasmota32), then switched to ESPHome by uploading the
ESPHome OTA image from Tasmota's firmware upgrade page, keeping Shelly's two-slot partition table.
This route does not work from stock firmware 1.5 or newer.

## Calibration

With `current_resistor: 0.001 ohm` and `voltage_divider: 770` the raw readings are far off, so the config uses
multipliers. They were measured on one unit against a reference meter; a second unit differed by about 3-4 %, so
check yours with a known load.

## Configuration

```yaml file=config.yaml
```
