---
title: Shelly 3EM
date-published: 2023-08-14
type: sensor
standard: uk, us, eu
board: esp8266
---

![Shelly 3EM](shelly-3em.webp "Shelly 3EM")

NOTE: In order to power up device it's enough to connect `VA` and `N` terminal.
NOTE: In order to retrieve proper data all live (`VA`/`VB`/`VC`) terminals needs to be connected to live wire, in other
case this integration will report invalid voltage (like `0.12130 V`). Check single phase connection diagram in the
official device manual for more details.

## GPIO Pinout

| Pin    | Function           |
| ------ | ------------------ |
| GPIO02 | LED (lower)        |
| GPIO04 | button (lower LED) |
| GPIO05 | ADE7880 IRQ1       |
| GPIO12 | I2C SDA            |
| GPIO13 | ADE7880 IRQ0       |
| GPIO14 | I2C SCL            |
| GPIO15 | Contactor Control  |
| GPIO16 | ADE7880 RESET      |

Note: The upper LED is not connected to a GPIO (it is connected to the
ADE7880) so it cannot be used as a normal ESPHome output.

## Calibration Data

It is critically important to retrieve the calbration data from the
3EM device before installing ESPHome onto it; without that data, it
will not be possible to get accurate sensor readings. You will need to
power up the device and let it connect to your network using the
preloaded Shelly firmware in order to retrieve this data. If you've
already converted the device to Tasmota and want to switch to ESPHome,
you'll have the calibration data and can skip steps 1-2 of the
instructions below.

1. Ensure that you are able to access the device's web interface
   (`http://<device-ip>`).

1. Download the calibration data file from
   `http://<device-ip>/calib.dat`. The file will look similar
   to this:

```json
{
  "state": 0,
  "rms": {
    "current_a": 3149413,
    "current_b": 3155641,
    "current_c": 3177848,
    "current_n": -1377304018,
    "current_s": 1804948,
    "voltage_a": -746938,
    "voltage_b": -735960,
    "voltage_c": -753583
  },
  "angles": {
    "angle0": 168,
    "angle1": 184,
    "angle2": 176
  },
  "powers": {
    "totactive": {
      "a": -1346104,
      "b": -1347476,
      "c": -1352863
    },
    "apparent": {
      "a": 220798,
      "b": 220791,
      "c": 220791
    }
  },
  "energies": {
    "totactive": {
      "a": 8986,
      "b": 8985,
      "c": 8985
    },
    "apparent": {
      "a": 41655,
      "b": 41660,
      "c": 41676
    }
  }
}
```

1. The `current_X` values from the `rms` section will go into the
   `calibration -> current_gain` entries in your configuration. Use the
   `current_s` value for the `neutral` phase, if you are enabling that
   phase's current sensor.

1. The `voltage_X` values from the `rms` section will go into the
   `calibration -> voltage_gain` entries in your configuration.

1. The `totactive` values from the `powers` section will go into the
   `calibration -> power_gain` entries in your configuration.

1. The `angleN` values from the `angles` section will go into the
   `calibration -> phase_angle` entries in your configuration.
   `angle0` is for `phase A`, `angle1` is for `phase B`, and `angle2`
   is for `phase C`.

## Example Configuration

```yaml file=config.yaml
```
