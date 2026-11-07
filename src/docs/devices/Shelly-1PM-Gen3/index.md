---
title: Shelly 1PM Gen3
date-published: 2025-03-01
type: relay
standard: uk, us, eu, au, nz
board: esp32
difficulty: 2
---

![Shelly 1PM Gen3 product photo](shelly-1pm-gen3.jpg "Shelly 1PM Gen3 product photo")

Product image: [Shelly 1PM Gen3](https://www.shelly.com/products/shelly-1pm-gen3).

This is the third generation of the Shelly 1PM.  It sports a single 16A
relay, power monitoring, and uses the ESP-Shelly-C38F, a derivative of
the ESP32-C3 with 8MB flash.

This device includes the Belling BL0942 Energy Monitor that is supported
by ESPHome.

## Flashing

Shelly's own OTA updater will install ESPHome over the network: no case-opening, no UART.
[free-shelly-ota](https://github.com/oxynatOr/free-shelly-ota) is the public tool that builds and sends the package.
One 1PM Gen3 (`S3SW-001P16EU`) has been converted this way from Shelly firmware 2.0.1, with scripts outside
free-shelly-ota that build the same kind of package. The tool's
[1PM Gen3 page](https://github.com/oxynatOr/free-shelly-ota/blob/main/docs/devices/S1PMG3.md) lists the partition
table and `esp32:`/`ota:` settings your config needs before it will build, and marks this model as only partly checked
with the tool itself.

Flash a config that has your own `wifi:` credentials, `api:` and `ota:` (see Basic Configuration below): the update
wipes Shelly's Wi-Fi settings, and `config.yaml` on its own has none of those. Keep the serial header below as your
way back: once ESPHome's bootloader is on the device, only serial gets you back to Shelly firmware. Later updates go
over ESPHome's own OTA, same as any ESPHome device.

## Serial Pinout

The Shelly 1PM Gen3 includes the six-pin "proprietary serial interface"
1.27mm header broken out on the back that can be used for flashing.  An
inexpensive 1.27mm to 2.54mm pitch changer board can make flashing these
devices easier than they already are.

The serial pinout is:

| Pin | Label        | Description | GPIO   |
|-----|--------------|-------------|--------|
| 1   | ESP_DBG_UART |             | GPIO19 |
| 2   | U0TXD        | UART0 RX    | GPIO20 |
| 3   | U0RXD        | UART0 TX    | GPIO21 |
| 4   | +3.3_ESP     | 3.3v        |        |
| 5   | _n/c_          | _unused_      |        |
| 6   | GPIO0        | BootSEL     | GPIO0  |
| 7   | GND          | Ground      |        |

![image](https://github.com/user-attachments/assets/04db7e3a-67f6-45ed-a30a-b6e2e9965c0b)

## GPIO Pinout

| Pin    | Function     |
|--------|--------------|
| GPIO0  | LED          |
| GPIO1  | Button       |
| GPIO3  | NTC sensor   |
| GPIO4  | Relay        |
| GPIO6  | BL0942 TX    |
| GPIO7  | BL0942 RX    |
| GPIO10 | Switch       |
| GPIO19 | ESP_DBG_UART |

## Basic Configuration

Add your own `api:` and `ota:` sections before flashing, and fill in `wifi:` with your own network credentials (a
`captive_portal:` helps too) — the example below leaves those out so it can be merged into your own setup.

```yaml file=config.yaml
```

## Additional Considerations

### BL0942 Energy Monitor

The default update interval for the BL0942 energy monitor is 60 seconds,
which may be too slow for some applications (especially safety shutdown,
if implemented; see below). Add `update_interval: 1s` to the bl0942 sensor
if desired.

The calibration of values reported by the BL0942 is left to software. The
component has default calibration values but they may not be accurate for
every device. Add in new calibration values based on measurements with a
quality digital multimeter and a simple resistive load.

_See [ESPHome Documentation](https://esphome.io/components/sensor/bl0942/) for more details._

### Safety Shutdown Option

On manufacturer firmware, Shelly products provide automatic shutdown of
the relay output(s) on overcurrent and overtemperature conditions.

Following is a configuration snippet to restore this functionality
with manual reset required for both faults. Add it on top of the basic
configuration: it switches the relay output from `config.yaml` through a
guarded `Relay` switch and sets the BL0942 to poll every second, which this
function needs. Calibrate `current_reference` first, or the overcurrent trip
point will be off.

```yaml file=safety-shutdown.yaml
```

## Application-specific Configuration

Following is an application-specific configuration of the Shelly 1PM
Gen3 for shutting off power to an attached clothes washer in the event
of a frozen drain line. It is a complete config on its own, not an add-on;
fill in `wifi:` with your own network credentials before flashing it.

```yaml file=washer-drain-protection.yaml
```
