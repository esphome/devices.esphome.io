---
title: LEDVANCE SMART+ E27 DIM (AC33916)
date-published: 2026-10-16
type: light
standard: eu
board: bk72xx
difficulty: 2
---

![LEDVANCE SMART+ E27 DIM](ledvance-e27-dim.jpg "Product Image")

LEDVANCE SMART+ Wi-Fi dimmable bulb, E27, one white channel. Product ID AC33916, the same series as the
[LEDVANCE E27 DIM AC33908](../LEDVANCE-E27-DIM/), but on this revision the PWM output is on **P7**, not P9 - with
the AC33908 template the bulb stays dark.

| Parameter     | Value                       |
|---------------|-----------------------------|
| Product ID    | AC33916                     |
| Tuya firmware | 1.1.4                       |
| Module / chip | WB8P / BK7231T              |
| ESPHome board | `generic-bk7231t-qfn32-tuya`|

## Programming

Flashed over the air with [tuya-cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) and ESPHome
Kickstart, then the configuration below over OTA. In cloudcutter choose **LEDVANCE → SmartPlus AC33908 Dimmable Bulb
v1.1.4** (profile `oem-bk7231s-ty-ffc-db-ldv-1.1.4-sdk-1.0.8-40.00`).

Do not update the firmware in the Tuya / LEDVANCE app before flashing - newer versions may close the exploit used by
cloudcutter.

## GPIO Pinout

| Pin | Function                                  |
|-----|-------------------------------------------|
| P7  | PWM brightness (active high, 600 Hz)      |

The pin comes from the original Tuya configuration stored in the cloudcutter profile (`cmod: c`, `c_pin: 7`,
`pwmhz: 600`).

## Configuration

Add your own `wifi`, `api` and `ota` sections.

```yaml file=config.yaml
```

If the bulb starts to glow only above some brightness, add `min_power` (the PWM duty cycle at that point) and
`zero_means_zero: true` to the output.
