---
title: Antsig Smart Wi-Fi IR Universal Remote (HUBIR01HA)
date-published: 2024-09-03
type: misc
standard: global
board: bk72xx
---

![Product Image](Antsig-Grid-Connect-Smart-IR-Universal-Remote.jpg "Product Image")

Sold at Bunnings in Australia. Model number HUBIR01HA. Based on the CB3S module, natively runs Tuya.

This configuration provides climate control but the device is a generic IR blaster that can control a wide range of IR
devices.

Flashing can be achieved by popping off the top cover and soldering to easily accessible pads for UART, or OTA by using
tuya-cloudcutter.

## GPIO Pinout

| Pin | Function                  |
| --- | ------------------------- |
| P6  | Reset button (active low) |
| P7  | IR Receiver               |
| P8  | Status LED                |
| P26 | IR Blaster Output         |

## Flashing via UART

- Open the blaster by prising off the translucent top - it's not glued or welded but does have a fair few clips holding
  it together
- Solder wires to the pads for 3V3, RST, TX, RX, and GND
- Connect 3V3, TX, RX, and GND to your USB UART adapter, and RST to GND (temporarily)
  - Note that if you have trouble flashing you may need to source a reliable 3.3V supply from some other place
- Generate a UF2 firmware file with ESPHome and flash using
  [https://docs.libretiny.eu/docs/flashing/tools/ltchiptool/](https://docs.libretiny.eu/docs/flashing/tools/ltchiptool/)
  once you've clicked Start, disconnect RST from GND. This can take a few goes sometimes.
- Once flashed, disconnect the wires and power from USB - any further updates you need to make can be done OTA (which is
  usually much faster)
- Take care when replacing the top - the clips aren't evenly spaced so you'll need to line them up right for it to go
  back together

## Alternative using tuya-cloudcutter

[Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) is a tool designed to simplify the process of
flashing Tuya-based devices. It allows you to bypass the need for physically opening the device and swapping out chips.
By leveraging the cloud APIs, Cloudcutter enables you to flash the firmware remotely, making it a convenient and less
intrusive option.

After cloning the tuya-cloudcutter git repository, run the tuya-cloudcutter script and once the docker image has
successfully been built, make the following selections:

- When prompted with "Select your desired operation" enter "2" for "Flash 3rd Party Firmware"
- When prompted with "How do you want to choose the device?", choose "device-profiles (i.e. custom profile)"
- When prompted with "Select device profile", choose "tuya-generic-universal-ir-remote-control-cb3s-v2.0.0"
- Cloudcutter will then make a few checks on ports in use on your host and may prompt you to stop some running services
  to release them for it to use. You will have to accept (press "y") to proceed with the OTA exploit
- Once you are prompted with "Select your custom firmware file for BK7231N chip", choose the "ESPHome-Kickstart" option.
  Don't worry if it is not the latest version, this firmware is generic and will only be used to flash your custom
  ESPHome firmware later
- From here, Cloudcutter will prompt you to put the device into AP mode, indicated by the slow blinking LED. To do so,
  power up the hub and press and hold the "reset" button underneath for 5-10s and then release it. The LED should blink
  slowly, staying on for more than a second each time. If it is blinking fast, approximately 8 times every 5 seconds
  according to the manual, just press and hold the reset button for another 5-10s and release and it should switch to
  the slow blinking AP mode.
- As soon as the device enters AP mode, Cloudcutter should find the "GRID-xxxx" AP name and begin running the exploit
- It will then ask you to powercycle the device and enter AP mode again. Follow the instructions exactly
- This time, Cloudcutter will find the new AP name "A-xxxx" and proceed to connect and flash the ESPHome Kickstart
  firmware
- Once complete, the device will reboot once more and Cloudcutter will terminate.
- Build and download your custom firmware as a UF2 package.
- Search for and connect to the new "Kickstart-xxxx" access point
- Point your favourite browser to the ".1" IP address of the wifi subnet, ie 192.168.4.1, and use the OTA update to load
  your custom UTF2 firmware

## Example Configuration

```yaml
esphome:
  name: antsig-ir-hub
  friendly_name: Antsig IR Hub

bk72xx:
  board: cb3s

logger:

api:

ota:
  - platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

light:
  - platform: status_led
    name: "Status"
    pin: P8

remote_transmitter:
  pin: P26
  carrier_duty_percent: 50%

# Receiver allows the original remote to be used and HA to follow along
remote_receiver:
  id: rcvr
  pin:
    number: P7
    inverted: true
    mode:
      input: true
      pullup: true
  tolerance: 55%
```
