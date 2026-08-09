---
title: "Beok TGP508-WIFI-EP electric underfloor heating thermostat"
date-published: 2026-08-09
type: misc
standard: eu
board: rtl87xx
made-for-esphome: false
difficulty: 4
---

Device Type: **Thermostat**

Electrical Standard: **EU**

Board: **RTL87xx / WBR3**

The Beok TGP508-WIFI-EP is a Wi-Fi underfloor-heating thermostat based on a Tuya
module using a Realtek RTL8720CF.

The module is a **WBR3**, which is supported by LibreTiny. The WBR3 uses an
RTL8720CF and has 2 MiB of flash memory.

## Features

The ESPHome configuration provides:

- Underfloor heating climate control
- Current temperature reporting
- Target temperature control
- Manual, program, and temporary-program modes
- Internal, external, or both temperature sensors
- Display brightness control
- Child lock
- Sound control
- Frost protection
- Inverse output
- Maximum setting temperature
- External sensor temperature limit
- Temperature calibration
- Temperature control switch difference
- Factory-reset datapoint
- Uptime and Wi-Fi diagnostic sensors
- LibreTiny version information

## Hardware

The thermostat contains a Tuya WBR3 Wi-Fi module based on the Realtek RTL8720CF.

The WBR3 has 2 MiB of flash memory and is supported by LibreTiny using the `wbr3`
board definition.

See the [LibreTiny WBR3 documentation][libretiny-wbr3] for flash information.

### Flashing hardware

**The WBR3 module needs to be desoldered from the thermostat in order to flash it
directly.**

The WBR3 download-mode strapping pin is located on the underside of the module,
making direct UART flashing impractical while the module is still soldered to the
thermostat PCB.

After removing the module, a 3.3 V USB-to-UART adapter can be used to access the
programming interface.

> **Warning:** Do not connect the thermostat to mains power while the module is
> being flashed or while connecting a USB-to-UART adapter. Use an appropriate
> isolated 3.3 V power source when working on the module.

## Flashing

### Direct ESPHome flashing

I attempted to flash ESPHome directly using **ltchiptool**, but **direct ESPHome
flashing with ltchiptool did not work for me**.

Because of this, I used OpenBeken as an intermediate firmware and performed the
ESPHome conversion through the OpenBeken web interface using OTA.

This procedure worked successfully for this device.

### 1. Desolder the WBR3

Remove the WBR3 module from the thermostat PCB so that the programming
connections can be accessed.

Refer to the [LibreTiny WBR3 documentation][libretiny-wbr3] for the module pinout
and download-mode information.

### 2. Flash OpenBeken

First flash **OpenBeken** to the WBR3 using the
[BK7231 GUI Flash Tool][bk7231-gui].

Make a backup of the original firmware before replacing it.

The OpenBeken firmware provides a convenient way to subsequently perform an OTA
conversion to ESPHome.

### 3. Configure OpenBeken

After OpenBeken has been flashed, allow the device to boot and connect it to
Wi-Fi.

Open the OpenBeken web interface and verify that the device is operating
correctly.

### 4. Initial ESPHome conversion

For the **initial conversion from OpenBeken to ESPHome**, I used the following
board definition:

```yaml inline
rtl87xx:
  board: "generic-rtl8720cf-2mb-896k"
```

This was used for the first OpenBeken GUI OTA conversion.

In OpenBeken, use the built-in OTA functionality to upload the ESPHome
application image.

**Use the ESPHome `*.bin` Application image, not the `*.uf2` image.**

After the OTA conversion completed successfully, the device was running ESPHome.

The `generic-rtl8720cf-2mb-896k` board definition was based on information
provided by **NonPIayerCharacter** in
[their comment on the OpenBeken WBR3 discussion][openbeken-comment].

### 5. Change to the WBR3 board definition

Once ESPHome was running, the configuration was changed to use the proper WBR3
board definition:

```yaml inline
rtl87xx:
  board: "wbr3"
```

For subsequent ESPHome builds, **`wbr3`** should be used.

The `wbr3` board definition is the appropriate LibreTiny/ESPHome definition for
the WBR3 module.

### Important flashing notes

- **Direct ESPHome flashing using `ltchiptool` did not work for me.**
- The WBR3 module must be **desoldered** for direct flashing/programming.
- **OpenBeken was used as an intermediate firmware.**
- The initial OpenBeken to ESPHome OTA conversion used
  `generic-rtl8720cf-2mb-896k`.
- The final ESPHome configuration uses `wbr3`.
- OpenBeken's GUI OTA requires the ESPHome **Application `.bin`** image.
- **Do not upload the `.uf2` file** through OpenBeken OTA.
- Make a backup of the original firmware before flashing.

## UART

The thermostat communicates with the Tuya controller over UART.

The working configuration uses:

| Function | GPIO |
| --- | --- |
| RX | GPIO13 |
| TX | GPIO14 |
| Baud rate | 9600 |

```yaml inline
uart:
  id: uart_bus
  rx_pin: GPIO13
  tx_pin: GPIO14
  baud_rate: 9600
```

The ESPHome configuration also sets the RTL87xx serial pin definitions:

```yaml
platformio_options:
  build_flags:
    - "-DPIN_SERIAL0_RX=13u"
    - "-DPIN_SERIAL0_TX=14u"
```

## Tuya Datapoints

The thermostat exposes the following Tuya datapoints in the working configuration.

Some datapoints have been identified but are not currently implemented in the
ESPHome configuration.

| Datapoint | Function |
| --- | --- |
| 1 | Heating power |
| 2 | Target temperature |
| 3 | Current temperature |
| 4 | Operating mode |
| 5 | Active/heating state |
| 9 | Child lock |
| 11 | **Bitmask - unidentified** |
| 15 | Maximum setting temperature |
| 19 | Temperature calibration |
| 101 | Temperature control switch difference |
| 102 | External sensor temperature limit |
| 103 | Frost protection |
| 104 | Factory reset |
| 105 | **Schedule settings - not implemented in ESPHome configuration** |
| 106 | Display brightness |
| 107 | Working day settings |
| 108 | Inverse output |
| 109 | Sound |
| 110 | Temperature sensor selection |

### Datapoint 11

**Datapoint 11** is known to be a bitmask, but the individual bits and their
functions have not yet been identified.

It is therefore not currently exposed as an ESPHome entity.

### Datapoint 105

**Datapoint 105** contains the thermostat's schedule settings.

The datapoint has been identified, but schedule handling has **not yet been
implemented in the ESPHome configuration**.

Datapoint 107 controls the type of working-day schedule:

- `0` - Off
- `1` - 5+2
- `2` - 6+1
- `3` - 7 days

The actual schedule data stored in datapoint 105 is not currently exposed
through ESPHome.

### Temperature scaling

The thermostat reports temperatures using a value scaled by a factor of 10.

The ESPHome configuration therefore uses a multiplier of `0.1` for both the
current and target temperature:

```yaml inline
target_temperature_multiplier: 0.1
current_temperature_multiplier: 0.1
```

For example, a Tuya value of `215` represents **21.5 °C**.

### Temperature calibration

**Datapoint 19 - Temperature calibration** also uses a value scaled by a factor
of 10.

The value needs to be **divided by 10 in the Home Assistant frontend** to obtain
the actual temperature calibration value.

For example:

| Tuya/ESPHome value | Actual value |
| ---: | ---: |
| `10` | `1.0 °C` |
| `-25` | `-2.5 °C` |
| `50` | `5.0 °C` |

### Temperature control switch difference

**Datapoint 101 - Temperature control switch difference** uses the same scaling.

The value needs to be **divided by 10 in the Home Assistant frontend** to obtain
the actual temperature difference.

For example:

| Tuya/ESPHome value | Actual value |
| ---: | ---: |
| `10` | `1.0 °C` |
| `25` | `2.5 °C` |
| `50` | `5.0 °C` |
| `100` | `10.0 °C` |

The current ESPHome configuration uses the raw Tuya datapoint values, so the
Home Assistant frontend should account for this factor of 10 when displaying
these two settings.

## ESPHome Entities

The configuration exposes the thermostat as an ESPHome climate entity:

- **Office underfloor heating**
- Current temperature
- Target temperature
- Heating state
- Manual mode
- Program mode
- Temporary program mode

Additional controls include:

- Power
- Child lock
- Sound
- Inverse output
- Frost protection
- Factory reset
- Display brightness
- Temperature sensor selection
- Working day settings
- External sensor temperature limit
- Maximum setting temperature
- Temperature control switch difference
- Temperature calibration

## Configuration Notes

The thermostat uses the Tuya protocol over a 9600 baud UART connection.

The relevant ESPHome configuration is:

```yaml inline
tuya:
  id: "tuya_device"
  uart_id: uart_bus
```

The device configuration also uses the Home Assistant time source for thermostat
time-dependent operation.

The configuration intentionally uses:

```yaml inline
preferences:
  flash_write_interval: never
```

This avoids unnecessary flash writes from ESPHome preferences.

## Limitations

The following items are currently known limitations:

- Direct ESPHome flashing using `ltchiptool` did not work for me.
- The WBR3 must be removed from the thermostat PCB for direct flashing.
- Datapoint 11 is not yet decoded.
- Datapoint 105 schedule data has not yet been implemented in the ESPHome
  configuration.
- The thermostat's complete weekly scheduling functionality is therefore not
  currently exposed through ESPHome.
- The initial OpenBeken to ESPHome conversion used
  `generic-rtl8720cf-2mb-896k`; subsequent ESPHome builds use `wbr3`.
- Temperature calibration (DP19) and temperature control switch difference
  (DP101) use values scaled by 10 and require division by 10 when interpreting
  the values in the Home Assistant frontend.

## Credits and References

- [LibreTiny WBR3 documentation][libretiny-wbr3]
- [BK7231 GUI Flash Tool][bk7231-gui]
- [OpenBeken WBR3 discussion - Issue #241][openbeken-comment]
- **NonPIayerCharacter** - for the `generic-rtl8720cf-2mb-896k` board definition
  information used during the initial OpenBeken to ESPHome conversion, documented
  in [their comment on the OpenBeken WBR3 discussion][openbeken-comment].
- [ESPHome Devices - Adding Devices][esphome-adding-devices]

The OpenBeken discussion is particularly relevant to the WBR3-based Beok
thermostat and the initial board definition used for the OpenBeken to ESPHome
conversion.

[libretiny-wbr3]: https://docs.libretiny.eu/boards/wbr3/

[bk7231-gui]: https://github.com/openshwprojects/BK7231GUIFlashTool

[openbeken-comment]: https://github.com/openshwprojects/OpenBK7231T_App/issues/241#issuecomment-5090766533

[esphome-adding-devices]: https://devices.esphome.io/devices/adding-devices/

## Basic Configuration

```yaml file=config.yaml
```
