---
title: Deta Grid Connect Smart Fan Speed Controller with Touch Light Switch
date-published: 2021-02-02
type: switch
standard: au
board:
  - esp8266
  - bk72xx
---

## General Information

[Deta 6914HA][1] is a smart fan controller with light switch sold in Australia and New Zealand.

[1]: https://detaelectrical.com.au/products/deta-gloss-white-grid-connect-smart-single-fan-speed-controller-with-touch-light-switch

### Series 1

Original version uses ESP8266 controller.

### Series 2

Newer revision uses BK7231T controller on the Tuya WB3S module.

### Series 3

Latest revision uses BK7231N controller on the Tuya [CB3S module](https://developer.tuya.com/en/docs/iot/cb3s?id=Kai94mec0s076)

## GPIO Pinout

### Series 1 - ESP8266 Version

| GPIO # |           Component |
| :----: | ------------------: |
| GPIO00 | Button2 (fan power) |
| GPIO01 |                None |
| GPIO02 |                None |
| GPIO03 |          Status Led |
| GPIO04 |         Fan Relay 3 |
| GPIO05 | Button3 (fan speed) |
| GPIO09 |                None |
| GPIO10 |                None |
| GPIO12 |                None |
| GPIO13 |         Fan Relay 1 |
| GPIO14 |         Light Relay |
| GPIO15 |         Fan Relay 2 |
| GPIO16 |     Button1 (light) |
|  FLAG  |                None |

### Series 2 - BK7231T Version

| Pin # |           Component |
| :---: | ------------------: |
|  P14  |     Button1 (light) |
|   P1  | Button2 (fan power) |
|   P8  | Button3 (fan speed) |
|  P10  |          Status Led |
|  P26  |         Light Relay |
|   P6  |         Fan Relay 1 |
|   P7  |         Fan Relay 2 |
|   P9  |         Fan Relay 3 |

### Series 3 - BK7231N Version

| Pin # |           Component |
| :---: | ------------------: |
|  P14  |     Button1 (light) |
|  P20  | Button2 (fan power) |
|   P7  | Button3 (fan speed) |
|  P22  |          Status Led |
|  P26  |         Light Relay |
|   P6  |         Fan Relay 1 |
|   P9  |         Fan Relay 2 |
|   P8  |         Fan Relay 3 |

Note: Pin numbering differs between series, but physical footprint positions are mostly the same. Only button 2 and
the status LED moved from series 2 to series 3.

The relays control the fan speed by switching the capacitance in series with the fan. The relay circuits are in
parallel: relay 1 feeds the fan through a 2 µF capacitor, relay 2 through a 1 µF capacitor, and relay 3 bypasses the
capacitors.
Speeds: low = relay 1, medium = relays 1+2 (equivalent to 3 µF), high = all three. The fan would run at full speed
with just relay 3, but the same GPIO also controls the LEDs in the speed button.

## Getting it up and running

### Series 1 - Tuya Convert

These switches are Tuya devices, so if you don't want to open them up to flash directly, you can attempt to
[use tuya-convert to initially get ESPHome onto them](/devices/tuya-convert) however recently purchased devices are no
longer Tuya-Convert compatible.  There's a useful guide to disassemble and serial flash similar switches
[on Mike McGuire's blog][2]. After that, you can use ESPHome's OTA functionality to make any further changes.

[2]: https://blog.mikejmcguire.com/2020/05/22/deta-grid-connect-3-and-4-gang-light-switches-and-home-assistant/

- Put the switch into "smartconfig" / "autoconfig" / pairing mode by holding any button for about 5 seconds.
- The status LED (to the side of the button(s)) blinks rapidly to confirm that it has entered pairing mode.

### Series 2 - Cloudcutter

[Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) is a tool designed to simplify the flashing process.
Follow the [official guide](https://github.com/tuya-cloudcutter/tuya-cloudcutter) for instructions.

### Manual Flashing

Series 3 boards need to be flashed manually. You'll need a USB-to-serial adapter. Follow the disassembly steps below:

1. Remove the front plastic face.
2. Unscrew the exposed screws.
3. Remove the clear panel and the small PCB underneath.

## Configuration Examples

### Series 1 (ESP8266)

```yaml file=config.yaml
```

### Series 2 (BK7231T)

```yaml file=series-2-bk7231t.yaml
```

### Series 3 (BK7231N)

```yaml file=series-3-bk7231n.yaml
```
