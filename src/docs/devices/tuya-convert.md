---
title: Prepare a device with tuya-convert
---

## Introduction

You can use tuya-convert to initially flash a Tuya device, without soldering. This is especially useful for smart bulbs
and other devices which can't readily be opened.

Please read this guide thoroughly before you begin, as there are multiple options available during the process.

Although tuya-convert can be used to flash a precompiled esphome binary directly, it includes a copy of Tasmota, which
can be useful to experiment if the configuration for your device is not yet known / available, as it allows you to
control pins via the web interface. Tasmota's OTA process can also be used to flash ESPHome, though if you're using
Tasmota 8.x (such as is now included with tuya-convert), [see below for additional instructions](#tasmota-v8x-warning).

## Running tuya-convert

In order to run tuya-convert, you'll need a Linux computer with wifi, plus a second wifi device (such as a smartphone).
This page is not a guide to installing and using tuya-convert in general; if you're not familiar with it, you may find
the following helpful:

- The [tuya-convert documentation](https://github.com/ct-Open-Source/tuya-convert#requirements); or
- A [video guide to using tuya-convert on a Raspberry Pi](https://web.archive.org/web/20220523141738/https://www.digiblur.com/2019/11/tuya-convert-2-flash-tuya-smartlife.html)

During the process, don't get nervous - keep calm and be patient.

### Entering Pairing Mode

In order to put your device into "smartconfig" / "autoconfig" / pairing mode, you can try one of the following:

- If your device has a button, try holding it for a few seconds
- If your device is a lightbulb, try switching the bulb on and off 4 or 5 times in quick succession

The device's status LED (or the lightbulb itself) should blink rapidly to confirm that it's in the correct mode. If this
doesn't happen, check your device's manual for any information on entering pairing mode or resetting the device.

### Picking a firmware

The last step in the tuya-convert process is to choose which firmware to flash. You have a few options:

- Install the included Tasmota firmware, bearing in mind that this is now v8.x;
- Download Tasmota 7.2, place it in the `files` directory within tuya-convert and choose this; or
- Build ESPHome ([see below](#esphome)) and copy the compiled `firmware.bin` into the `files` directory within
  tuya-convert and choose this

### Tasmota v8.x Warning

If you choose to install the included Tasmota (or any other v8.x or later build), you may need to do one of the
following in order to flash ESPHome:

- Downgrade Tasmota to 7.2 (via OTA), then "upgrade" to ESPHome
- Run `SetOption78 1` in the Tasmota console, reboot/restart your device, then "upgrade" to ESPHome
  - This option is undocumented, and likely to be removed in some future version of Tasmota
- Use a version of ESPHome which identifies as "compatible" to Tasmota 8.x
  - Fixed in [https://github.com/esphome/esphome/pull/1152](https://github.com/esphome/esphome/pull/1152). Binaries
    compiled with ESPHome higher than 1.15.0 are
    compatible.

## ESPHome

Now it's time to start setting up, creating, compiling and flashing your own firmware. This is where ESPHome comes in.

### If you're using the ESPHome Dashboard (i.e. via the Hass.io add-on)

- Open ESPHome (in the left side menu in Home Assistant, if you're using the Hass.io addon).
- Click in the red plus symbol on the upper right side of the screen.
- Give a sensible name. Names must be lowercase and must not contain spaces (allowed characters: a-z, 0-9 and \_).
- Don't bother about the device type, just confirm default selection. This will be updated later in the code.
- Enter WiFi SSID, WiFi Password and, if you use one, OTA access password.
- **Don't forget to enable OTA, or you won't be able to update your device wirelessly**
- Create your device configuration set by clicking [SUBMIT]
- Ignore the flashing symbol "Select upload port", just scope on your yaml file and start editing by clicking in "EDIT".
  If you see a message like "404 file not found", click in another Home Assistant menu on the left and then back in
  ESPHome and you'll see the code which you can work with.
- Paste in your YAML configuration, taking care to ensure that details such as the following are correct:
  - Device name
  - WiFi credentials (SSID and password)
  - Static IP address, if required
  - OTA enabled (and correct/expected password)
  - Don't forget to hit [SAVE] and [CLOSE]
- Back in the ESPHome dashboard, find your device and check the code by clicking [VALIDATE]
- If you've copied and adapted right it will pass validation with success and you can close this dialog. You are now
  ready to compile your approved firmware.
- On the top right corner you'll find 3 horizontally stacked points. Click there and chose [Compile]. Give it up to 3
  minutes time to do the job the first time until it confirms "INFO Successfully compiled program."
- On the lower right side, click [DOWNLOAD BINARY] and store your firmware on your computer where you'll find it later.
  Don't change the file name.

### If you're using the ESPHome Command-Line Interface (CLI)

- Build your YAML file as above, taking care to set details such as the device name, WiFi and OTA details correctly
- **Don't forget to include the OTA config, or you won't be able to update your device wirelessly**
- Run `esphome your_device.yaml compile` (replacing `your_device.yaml` with the actual file name)
- Once it's finished, find the compiled firmware (i.e. `your_device/.pioenvs/your_device/firmware.bin`)

## Flashing ESPHome

Now that you've compiled your ESPHome firmware, you're ready to upload it to your device. If you chose to flash ESPHome
directly using tuya-convert, simply pick your compiled ESPHome firmware during the tuya-convert process, and you're all
done! Otherwise, you'll need to perform an OTA update by following the instructions below.

### From Tasmota

This is where we can say thanks to the amazing feature set of Theo Arends' Tasmota firmware which allows to upload and
install binary files. This is done only once; after this it'll be much easier uploading newer versions of the firmware
over the air directly from ESPHome.

- Your device will provide an open access point with WiFi name `tasmota`- followed by 4 numbers. Connect to this WiFi
  and let DHCP provide a suitable IP address on your computer automatically.
- Open your browser, enter 192.168.4.1 in the address bar and press enter; a captive portal will appear.
- Enter SSID and WiFi password of your home WiFi and confirm. The bulb will restart and try to access your home WiFi.
- If the access details were right, your bulb will connect to your local network. If not, the bulb restarts as an access
  point with captive portal after 1 minute of unsuccessful connection attempts. If that is the case, redo the procedure
  until it's OK.
- Reconnect your computer to your regular WiFi network, if it doesn't automatically do this.
- Open your router and seek for the IP address that your router has given with DHCP to your bulb. It should appear in
  the attached devices named `tasmota-` followed by 4 numbers (the same as the network you connected to in order to set
  your WiFi details).
- Now open this IP address with your browser, the Tasmota dashboard will appear.
- If you installed Tasmota 8.x, see the [Tasmota 8.x Warning](#tasmota-v8x-warning) above.
- Click [Firmware Upgrade], in the following dialog on the lower part click [Browse] and navigate to the binary file you
  downloaded or compiled above, then hit [Start upgrade] and wait up to 2 minutes.

Upon returning to the ESPHome dashboard (if you're using it), you should see your device coming online with the
indicator changing from red Offline to green Online. Any further changes to the firmware can now be done, compiled and
uploaded over the air directly from here.

Your device should now be available to integrate with Home Assistant - enjoy!
