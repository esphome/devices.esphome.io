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

| GPIO   | Function         | Notes                                       |
| ------ | ---------------- | ------------------------------------------- |
| GPIO0  | Button           | XTAL_32K_P, ext. pull-up, deep sleep wakeup |
| GPIO1  | I2C SDA          | Shared bus (SHT31 + UC8119), ext. pull-up   |
| GPIO2  | Power Rail ADC   | Reads regulated 3.3V rail, not battery      |
| GPIO3  | I2C SCL          | 100kHz, external pull-up on FPC             |
| GPIO4  | Battery ADC      | Via voltage divider (÷3), GPIO18 enable     |
| GPIO5  | Battery Presence | HIGH when batteries are connected           |
| GPIO6  | UC8119 BUSY_N    | LOW=busy, external pull-up on FPC           |
| GPIO7  | UC8119 RESET_N   | Active LOW, 10ms pulse                      |
| GPIO8  | USB Detect       | HIGH=USB connected, LOW=battery             |
| GPIO10 | UC8119 Enable    | Display power gate, HIGH=on                 |
| GPIO18 | Batt Power En    | Enables power-path for battery ADC          |

## I2C Devices

| Device | Address | Function                |
| ------ | ------- | ----------------------- |
| SHT31  | 0x44    | Temperature & Humidity  |
| UC8119 | 0x50    | E-Paper Segment Display |

## Serial Pinout (PCB Test Pads)

![UART Pinout](PCB_Pinout.png "UART Pinout")

The UART pads are bare test points on the PCB (no header installed).
Use pogo pins, test clips, or solder temporary wires for flashing.

| Pad | Function     |
| --- | ------------ |
| 1   | NC           |
| 2   | RXD          |
| 3   | CHIP_EN      |
| 4   | GND          |
| 5   | TXD          |
| 6   | VCC 3V3      |
| 7   | BOOT / GPIO9 |

## Flashing

The device can be flashed in two ways:

- **OTA from the Shelly stock firmware** using the **ShellyOTA** script (recommended, no soldering).
- **UART** via the PCB test pads (needed for recovery or if OTA is not possible).

### OTA from Shelly Stock Firmware

Requirements:

- Stock firmware **2.0.1** (tested). Other versions are untested.
- Battery level of at least **35 %**, otherwise the update is refused.
- The ESPHome build must use the Shelly **stock partition table**, so the image fits the
  layout on the device. Save the CSV below as `csv/HTG3-stock.csv` next to your YAML.
  The `partitions` and `CONFIG_PARTITION_TABLE_OFFSET` lines are already set in `config.yaml`.
- `allow_partition_access: true` must be set in the `ota:` block
  (see [Network, OTA and time](#network-ota-and-time) below).

```csv
# Shelly H&T Gen3 stock partition table (read from the official 2.0.1 package, partition-table.bin at 0xf000).
# Only used so ESPHome builds against the same layout the device really has; the table in flash stays Shelly's.
# NOTE: the partition table is at 0xf000 here (Plug M Gen3: 0x10000), so use CONFIG_PARTITION_TABLE_OFFSET: "0xf000".
# Name,    Type, SubType, Offset,   Size,     Flags
otadata, data, ota, 0x11000, 0x2000,
nvs, data, nvs, 0x14000, 0xc000,
app_0, app, ota_0, 0x20000, 0x280000,
fs_0, data, spiffs, 0x2a0000, 0x100000,
app_1, app, ota_1, 0x3a0000, 0x280000,
fs_1, data, spiffs, 0x620000, 0x100000,
scratch, data, 0x80, 0x7e0000, 0x10000,
shelly, data, 0x88, 0x7f0000, 0x10000,
```

Build the firmware with `esphome compile`. ESPHome writes two files: `firmware.ota.bin` and `firmware.factory.bin`.
Hand both to **ShellyOTA** (<https://github.com/oxynatOr/free-shelly-ota>), which builds a package from them
(`build ... --esphome-factory firmware.factory.bin`) and sends it to the device. The factory image supplies ESPHome's
bootloader. An OTA binary alone leaves Shelly's bootloader in place; it rolls the update back after three starts and
later ESPHome updates do not take effect. The tool refuses such a package by default. The step-by-step commands are on
the [HTG3 page](https://github.com/oxynatOr/free-shelly-ota/blob/main/docs/devices/HTG3.md) of the tool.

> **Note:** The partition table of the device stays Shelly's. The CSV only makes ESPHome build
> against the same layout. The table sits at `0xf000` on this device (Plug M Gen3: `0x10000`).

After the first ESPHome flash, further updates work through the normal ESPHome OTA. Keep the settings of this page
(partition table, `allow_partition_access: true`) in every later build.

### Flashing via UART

To enter download mode, short **pad 7 (GPIO9)** to **pad 4 (GND)** while powering on the device. Release after boot.

### Backup the Original Firmware

Always back up the original firmware before flashing:

```bash
esptool.py --chip esp32c3 --port /dev/ttyUSB0 --baud 460800 \
  --before no-reset --after no-reset \
  read_flash 0 0x800000 shelly-ht-gen3-backup.bin
```

### Compile and Flash (UART)

```bash
esphome compile shelly-ht-gen3.yaml
esptool.py --chip esp32c3 --port /dev/ttyUSB0 --baud 460800 \
  write_flash 0x0 .esphome/build/shelly-ht-gen3/.pioenvs/shelly-ht-gen3/firmware-factory.bin
```

## Basic Configuration (USB Powered)

```yaml file=config.yaml
```

## Battery Powered Configuration (Deep Sleep)

Add the [network, OTA and time](#network-ota-and-time) settings below to this one as well.

```yaml file=battery-deep-sleep.yaml
```

## Network, OTA and time

The two examples below only describe the hardware. Add this file to get the Home Assistant API, ESPHome OTA updates
(including `allow_partition_access: true`, which the OTA flashing above needs) and the clock from Home Assistant.
Include it with [packages](https://esphome.io/components/packages/) and add your own `wifi:` credentials and API
encryption key:

```yaml file=network-ota-time.yaml
```

```yaml inline
packages:
  network: !include network-ota-time.yaml
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

| Zone         | Digits            | Function                  |
| ------------ | ----------------- | ------------------------- |
| Top left     | T1 T2 : T3 T4     | Clock (HH:MM)             |
| Top right    | Arrow + Battery   | Arrow, 5-segment battery  |
| Center left  | D1 D2 . D3        | Temperature (XX.X)        |
| Center right | UNIT              | °C/°F (small digit + °)   |
| Icon row 1   | ❄ ♨ ❀ ☰ 📅       | Frost, Heat, Vent, ?, Cal |
| Icon row 2   | Signal, BT, Globe | WiFi, Bluetooth, Globe    |
| Bottom right | H1 H2 %           | Humidity (XX%)            |

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

- **OTA from Shelly firmware needs ShellyOTA:** Only tested with stock firmware 2.0.1
  and the battery must be at least 35 %. UART flashing remains available as a fallback.
- **Battery percentage accuracy:** The voltage-to-percentage mapping
  may need calibration for your battery chemistry and temperature.
  Default range (4.0V–6.0V) is for 4× AA alkaline batteries.
