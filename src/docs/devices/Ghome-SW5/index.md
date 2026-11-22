---
title: GHome SW5
date-published: 2024-09-02
type: switch
standard: US
board: bk72xx
---

![Product Image](ghome-sw5.jpg "Product Image")

## Flashing

As of November 2024, there are two methods of flashing this device, using a serial adapter and ltchiptool, or OTA using
tuya-cloudcutterflash

Attention: Recently purchased units (December, 2024) contain a Lightning Semi LN882H rather than the Beken BK7231N.
These units cannot be flashed with ESPHome.  The newly purchased units also have screw terminals on the switch body for
the wiring.  The older units had four wires coming off of the back of the switch body.

### OTA

CAUTION: either install the device properly in the wall before attempting, or have another way of safely powering the
device. OTA flashing when the device is powered with mains current can be dangerous

Newer versions of this switch use the BK7231N chip, running 1.0.1 firmware. These devices are able to be flashed using
tuya-cloudcutter.

Install Tuya-cloudcutter, following instructions
[in the tuya-cloudcutter repository](https://github.com/tuya-cloudcutter/tuya-cloudcutter/tree/main/custom-firmware)

Once the tool is installed, run it with this command:

```sudo ./tuya-cloudcutter.sh -p gosund-sw5-a-v2.1-smart-switch-bk7231n-v1.0.1 -f ESPHome-Kickstart-v23.08.29_bk7231n_app.ota.ug.bin```

Follow the onscreen instructions to put the device into "slow blink" mode, and then power off/back on when prompted.
This will install the ESPHome Kickstart firmware. From there is is possible to OTA install full ESPHome.

### Serial

The newer versions off amazon US (2024+) of this device came with a Beken BK7231N chip

For newer devices, use a USB to serial adapter, and solder wires onto the pads marked TX, RX, 3.3V and GND.
If you have the stock firmware on the device, you can hold the button for 5 seconds to reset it to get itchiptool to
work.

build the firmware in esphome and flash it using the itchiptool

download the firmware in the uf2 format

Install ltchiptool from [the ltchiptool repository](https://github.com/libretiny-eu/ltchiptool)

figure out the serial port the device is connected to and run the following command
(in my case it was /dev/ttyUSB0 in linux, but in windows it will be a com port)

run the following command to flash the firmware
`ltchiptool flash write -d /dev/ttyUSB0 YOUR_FIRMWARE_FILE.uf2`

you will see an output like this:

```text
I: Detected file type: UF2 - esphome 2023.11.6
I: Connecting to 'Beken 7231N' on /dev/ttyUSB0 @ 115200
I: Connect UART1 of the BK7231 to the USB-TTL adapter:
I:
I:     --------+        +--------------------
I:          PC |        | BK7231
I:     --------+        +--------------------
I:          RX | ------ | TX1 (GPIO11 / P11)
I:          TX | ------ | RX1 (GPIO10 / P10)
I:             |        |
I:         GND | ------ | GND
I:     --------+        +--------------------
I:
I: Using a good, stable 3.3V power supply is crucial. Most flashing issues
I: are caused by either voltage drops during intensive flash operations,
I: or bad/loose wires.
I:
I: The UART adapter's 3.3V power regulator is usually not enough. Instead,
I: a regulated bench power supply, or a linear 1117-type regulator is recommended.
I:
I: To enter download mode, the chip has to be rebooted while the flashing program
I: is trying to establish communication.
I: In order to do that, you need to bridge CEN pin to GND with a wire.
```

Power cycle the device by removing the 3.3v

> Don't disconnect the usb/serial converter just remove 3.3v to the device to power cycle it

When it turns back on it will be in download mode and you should see something similar to this:

```text
I: |-- Success! Chip info: BK7231N
I: Writing 'MY_CUSTOM_FIRMWARE.uf2'
I: |-- esphome 2023.11.6 @ 2023-12-15 07:08:48 -> generic-bk7231n-qfn32-tuya
Writing (0x011000)  [###############################################################-]   99%  00:00:00
W: The current command timeout of 1.0 second(s) is too low for reading 905216 bytes CRC. Increasing to 3 second(s).
Booting firmware  [################################################################]  100%
```

Congrats you are done! You can now disconnect it and wire in the normal switch!

## Hardware Variants & Pinout

There are different variants of this switch, based on when it was manufactured, which determines the micro-controller
within. Some of these different versions have different pins assigned to the various functions (button, switch, LED).
Flashing of the different Beken based chips remains the same as described above.

### Beken BK7231N

This variant was available from Amazon around 2024, and is built on the BK7231N micro-controller. The pin assignments are
listed below and in the example YAML configuration below.

| Pin | Function  |
|-----|-----------|
| P7  | Button    |
| P6  | Green LED |
| P14 | Relay     |
| P16 | Red LED   |

### Beken BK7238

This variant was available from Amazon around November 2026 and is built on the BK7238, and uses a different pinout.
Additionally, the bk72xx board need to be changed to `generic-bk7238-tuya` in the YAML configuration as well. With these
changes, the example YAML configuration can be used on this variant.

| Pin | Function  |
|-----|-----------|
| P7  | Green LED |
| P17 | Red LED   |
| P22 | Relay     |
| P23 | Button    |

## Example YAML Config

```yaml file=config.yaml
```

## Notes/Issues/Troubleshooting

Use an external 3.3v power supply, the onboard regulator is not enough to power the device and flash.

There are at least 2 versions of this device and I found photos with the bk7231t they are not compatible, you need to
build the firmware for the correct chip. I know because I was scratching my head until I actually took a photo and
confirmed the chip on my board

- Here is the amazon link to the device I bought: [Amazon Link](https://www.amazon.com/dp/B09JZ6W1BH)
  - Good as of Sept 2024
- This is an exact teardown of the device (with the other
  controller) [Teardown](https://www.elektroda.com/rtvforum/topic3892160.html)
- I designed and 3d printed a pogo based clip to flash the device here is
  the [Onshape Link][1]
- Amazon link for the pogo pins [Amazon Link](https://www.amazon.com/gp/product/B00TX43QEQ)
  - Labeled on amazon `uxcell 100 Pcs PL75-B1 0.7mm Tip 16mm Spring Test Probes Pin for PCB Board`

## Extra Images For Reference

A Board mounted in the clip
![Board Held By Clip](pogo-mounted.png "POGO Clip Mounted")

A Closeup of fully assembled clip
![Closeup of Clip](pogo-clip.png "POGO Clip Closeup")

Janky flashing setup with a dedicated 3.3v power supply
![Flashing Setup](janky.png "Flashing Setup")

[1]: https://cad.onshape.com/documents/bd911beb7a4a52211fd6ff0a/w/639be8dce01942437b84688a/e/92c75704a7d638fc027182f4?renderMode=0&uiState=66d5ece2b7272918ae9b9502
