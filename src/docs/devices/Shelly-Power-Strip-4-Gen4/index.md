---
title: Shelly Power Strip 4 Gen4
date-published: 2026-03-07
type: plug
standard: eu
board: esp32
---

## Shelly Power Strip 4 Gen4

![Product Image](index.png "Product Image")

## GPIO Pinout

| Pin    | Function                        |
| ------ | ------------------------------- |
| GPIO1  | Relay 4 (Outlet 4)              |
| GPIO2  | Relay 2 (Outlet 2)              |
| GPIO3  | Relay 3 (Outlet 3)              |
| GPIO4  | Relay 1 (Outlet 1)              |
| GPIO5  | ADE7953 #0 IRQ (Outlets 4+3)   |
| GPIO6  | ADE7953 #1 IRQ (Outlets 2+1)   |
| GPIO10 | SPI CS1 – ADE7953 #1 (Outlets 2+1) |
| GPIO11 | SPI MOSI                        |
| GPIO12 | SPI MISO                        |
| GPIO13 | SPI SCLK                        |
| GPIO15 | SPI CS0 – ADE7953 #0 (Outlets 4+3) |
| GPIO16 | UART TX (Debug / Flash)         |
| GPIO17 | UART RX (Debug / Flash)         |
| GPIO18 | WS2812B Data (12 LEDs, via R36) |
| GPIO20 | Button 1 (SW1, low-active)      |
| GPIO21 | Button 4 (SW4, low-active)      |
| GPIO22 | Button 2 (SW2, low-active)      |
| GPIO23 | Button 3 (SW3, low-active)      |

## Flashing

> **Note:** OTA flashing from the original Shelly firmware is **not possible**.
> Shelly Gen4 verifies OTA images with an ECDSA signature using their private key.
> The device must be flashed via UART.

### Wiring

Connect a **3.3V** USB-to-serial adapter to the UART pads on the ESP-Shelly-C68F module (J1 connector).
Testpoints are also available on the PCB.

#### J1 Connector Pinout

| Pin | Function |
| --- | -------- |
| 1   | GND      |
| 2   | IO9      |
| 3   | EN       |
| 4   | VCC      |
| 5   | RXD      |
| 6   | TXD      |
| 7   | NC       |

#### PCB Testpoints

The testpoints are labeled on the PCB. When using an ESP-Prog, connect as follows:

| PCB Label | ESP-Prog |
| --------- | -------- |
| 3.3V      | VCC      |
| GND       | GND      |
| RESET     | EN       |
| IO9       | IO0      |
| U0RXD     | RXD0     |
| U0TXD     | TXD0     |

To enter download mode, hold **IO9** low (connect to GND) while powering on the device. Release after boot.

### Backup the original firmware

Always back up the original firmware before flashing:

```bash
esptool.py --chip esp32c6 --port /dev/ttyUSB0 --baud 460800 \
  --before no-reset --after no-reset \
  read_flash 0 0x800000 shelly-powerstrip4-gen4-backup.bin
```

### Compile

```bash
esphome compile shelly-powerstrip4-gen4.yaml
```

The factory binary is located at:

`.esphome/build/shelly-powerstrip4-gen4/build/firmware.factory.bin`

### Flash

```bash
esptool.py --chip esp32c6 --port /dev/ttyUSB0 --baud 460800 \
  write_flash 0x0 firmware-factory.bin
```

## Basic Configuration

> **Note:** Current and power are scaled ×4 with filters instead of
> `current_pga_gain_a/b: 4x`. On tested units, ADE7953 #1 (Outlets 2+1)
> resets itself while the ESP32 boots, which discards any gain setting
> written to it. Channel B on both chips (Outlets 3 and 1) is wired with
> reversed polarity, hence the `-4.0`.

```yaml file=config.yaml
```
