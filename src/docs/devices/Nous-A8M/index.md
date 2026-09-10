---
title: Nous A8M Smart Matter Socket 16A
date-published: 2026-04-07
type: plug
standard: eu
board: bk72xx
difficulty: 4
project-url: https://nous.technology/product/a8m.html
---

![Nous A8M Smart Matter Socket 16A](A8M.jpg "Nous A8M Smart Matter Socket 16A")

## Product Description

The Nous A8M is a 16A EU smart socket with energy monitoring, a physical button, and an LED status indicator.
It is based on the BK7231N chip and ships with Matter support.

**Specifications:**

- Operating Voltage: 220–240 V AC
- Maximum Load: 16 A (3840 W)
- Standby Power: 1.3 W
- Connectivity: 2.4 GHz Wi-Fi (802.11 b/g/n)
- Dimensions: 45 × 45 × 73 mm
- Protection: IP20

## Flashing

### Important: Bootloader Mismatch (Matter variant)

Nous A8M plugs with Matter support ship with a **Tuya bootloader v3.0.0** instead of v1.0.1.
This causes two issues during conversion:

- OTA updates appear to succeed but are never applied — the v3.0 bootloader layout is incompatible
  with what the v1.0.1-based flow expects, so the partition swap does not occur.
- Devices flashed without accounting for the different layout show an incorrect MAC address
  (e.g. `C8:47:8C:00:00:00`) because calibration/userdata TLVs are read from the wrong offsets.

**Solution:** Flash the bkboot 1.0.1 bootloader before flashing ESPHome firmware:

```bash
ltchiptool write <port> bk7231n 0x0 bk7231n-1.0.1-encrypted-tuya.bin --length 0x11000
```

The `board_flash.calibration` platformio option in the configuration below is also required to read
calibration data from the correct offset.

### Flashing Steps

Use `ltchiptool` to flash the device over UART. You will need to open the device and connect to the
UART pads on the BK7231N chip (TX, RX, GND, and briefly bridge CEN to GND to enter flash mode).

1. Flash the bkboot 1.0.1 bootloader as shown above.
2. Flash the ESPHome firmware using `ltchiptool` or the ESPHome OTA mechanism.

## GPIO Pinout

| Pin | Function              |
| --- | --------------------- |
| P6  | Relay                 |
| P7  | Button (inverted)     |
| P8  | LED (inverted)        |
| P14 | BL0937 SEL (inverted) |
| P24 | BL0937 CF             |
| P26 | BL0937 CF1            |

## Basic Configuration

```yaml
substitutions:
  name: nous-a8m
  friendly_name: Nous A8M
  # Higher value gives lower current readout — calibrate for accuracy
  current_res: "0.00112"
  # Lower value gives lower voltage readout — calibrate for accuracy
  voltage_div: "768"

esphome:
  name: ${name}
  friendly_name: ${friendly_name}
  name_add_mac_suffix: false
  project:
    name: "NOUS.Smart-Wifi-Socket"
    version: "A8M"
  platformio_options:
    board_flash.calibration: "0x1E3000+0x1000"
  on_boot:
    priority: 200
    then:
      - if:
          condition:
            switch.is_on: relay
          then:
            - light.turn_on: led
          else:
            - light.turn_off: led

bk72xx:
  board: generic-bk7231n-qfn32-tuya

logger:

api:

ota:
  - platform: esphome

improv_serial:

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap: {}

captive_portal:

time:
  - platform: homeassistant
    id: my_time

light:
  - platform: status_led
    name: "Switch State LED"
    id: led
    internal: true
    pin:
      number: P8
      inverted: true

binary_sensor:
  - platform: gpio
    name: "Button"
    id: push_button
    internal: true
    pin:
      number: P7
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      - switch.toggle: relay

switch:
  - platform: gpio
    pin: P6
    id: relay
    name: "Relay"
    restore_mode: RESTORE_DEFAULT_OFF
    icon: mdi:power
    on_turn_on:
      - light.turn_on: led
    on_turn_off:
      - light.turn_off: led

sensor:
  - platform: hlw8012
    model: BL0937
    current_resistor: ${current_res}
    voltage_divider: ${voltage_div}
    sel_pin:
      number: P14
      inverted: true
    cf_pin:
      number: P24
      inverted: true
    cf1_pin:
      number: P26
      inverted: true
    current:
      name: "Current"
    voltage:
      name: "Voltage"
    power:
      name: "Power"
    energy:
      name: "Energy"
    update_interval: 10s
```
