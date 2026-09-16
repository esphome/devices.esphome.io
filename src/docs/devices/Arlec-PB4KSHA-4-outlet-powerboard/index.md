---
title: Arlec PB4KSHA 4 outlet powerboard
date-published: 2023-12-08
type: plug
standard: au
board: bk72xx
difficulty: 4
---

![Product Image](arlec_PB4KSHA.jpg "Product Image")

The Arlec PB4KSHA power board is part of the [Grid Connect ecosystem](https://grid-connect.com.au/) and is sold at
Bunnings in Australia and New Zealand.
It has four sockets but all are controlled as a group via a single relay.

The controller board is a Tuya WB2S which uses a BK7231T chip.

## BK7231 Pinout

| Pin | Function                |
| ----| ----------------------- |
| P6  | LED (Inverted: true)    |
| P11 | Button                  |
| P26 | Relay 1                 |

## Getting it up and running

### LibreTiny Chip Tool

As Tuya has closed most vulnerabilities, Tuya-Convert cannot be used to flash ESPHome onto these devices.
The LibreTiny Chip Tool ([ltchiptool](https://github.com/libretiny-eu/ltchiptool)) can be used to reflash the board via
its UART pins. You may completely remove the chip from the board to do this or solder wires to the relevant pins
in-place. Reflashing via UART using ltchiptool is covered in this guide on YouTube for
[installing ESPHome on a Tuya Beken BK7231 w/ltchiptool](https://www.youtube.com/watch?v=t0o8nMbqOSA), however we
recommend performing the following steps:

- Open the ESPHome Add-On Dashboard
- Click "New Device" in the bottom-right corner
- Click Continue
- Enter a name for the device and click Next
- Click on any of the device types
- On the next screen, click SKIP.  Do ***not*** click Install
- When the device is listed in the dashboard, click Edit
- Paste in the YAML config from this page
- Click Save
- Click Install
- Select the "Manual Download" option
- Download the UF2 version of the file and Flash using ltchiptool

## Basic Configuration

```yaml file=config.yaml
```
