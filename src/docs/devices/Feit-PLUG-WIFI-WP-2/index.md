---
title: Feit Electric PLUG/WIFI/WP/2
date-published: 2025-10-26
type: plug
standard: us
board: bk72xx
difficulty: 4
---

This is a variant of the plug that has 2 outlets, instead of the 3 outlets in the PLUG3 variant.
It is marked FCC ID: `SYW-PLUGWFWP` and the IC is labeled: `SYCZB-MW-AK`.
This was heavily based on the great work alread done on other variants here:
[IC 2046-PLUG3WIFIN](/devices/Feit-PLUG3-WIFI-WP-2-N/)
and here [IC: 20416-PLUG3WIFI](/devices/Feit-PLUG3-WIFI-WP-2/).

Some versions of this 2 outlet versions shipped with ESP8266 boards, but this one had a
bk72xx, as discussed
[here](https://community.home-assistant.io/t/costco-feit-dual-outlet-outdoor-smart-plug/167786).

Follow the steps in the great PLUG3 variant docs [here](/devices/Feit-PLUG3-WIFI-WP-2/)
to flash your board via UART (the TX, RX, GND, and 3v3 pins are
all clearly silk screened on the board in this variant) using ltchiptool.
I lightly tack soldered to the pads,
but don't be like me and break a pad and have to dig up a trace to solder to :)

After building the device in ESPHOME and downloading the uf2 file,
the command to flash will be similar to this:
`ltchiptool flash write -d /dev/cu.usbserial-210 -b 115200 ./outdoor-switch1.uf2`

After flashing with ESPHome build, I found the pins in the
PLUG3 variant were not working and by trial and error found
the following ESPHome config / GPIO pins to work for this variant:

## GPIO Pinout

| Pin | Function          |
| --- | ----------------- |
| P15 | Relay             |
| P17 | Blue LED          |
| P23 | WiFi Power - why you might want this I don't know - maybe just to avoid it so you don't have to reflash thru UART!?! |
| P24 | Red LED           |
| P26 | Button            |

``` yaml
substitutions:
  project_name: outdoor-plug-1
  friendly_name: "Outdoor Plug 1"

esphome:
  name: outdoor-switch1
  friendly_name: outdoor-switch1

bk72xx:
  board: generic-bk7231n-qfn32-tuya

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: "asdf"

ota:
  - platform: esphome
    password: "asdf"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "Outdoor-Switch1 Fallback Hotspot"
    password: "asdf"

captive_portal:

## DEVICE SPECIFIC CONFIG BEGIN HERE

# Note: UART config is optional
# uart:
#   rx_pin: P10 #RX1
#   tx_pin: P11 #TX1
#   baud_rate: 115200



# Other pins tried with unknown function: p6, p7, p8, p9, p14, p16, p20, p24

output:
  - platform: gpio
    pin: P15
    id: 'relay'

binary_sensor:
  - platform: gpio
    id: button_physical
    name: 'Button pressed'
    internal: false  # optional if you'd like the button state in HA, change to true
    pin:
      number: P26
      inverted: true
      mode: INPUT_PULLUP
    on_press:
      - switch.toggle: rly_sw

light:
  - platform: status_led
    id: led_status
    pin:
      number: P24
      inverted: true
# - platform: binary
#   id: lights
#   name: ${friendly_name} lights
#   output: rly_sw
#   on_turn_on:
#     - light.turn_on: led_status
#   on_turn_off:
#     - light.turn_off: led_status

# Note: If you only have lights plugged into the SmartPlug, you could use
# and light component instead of a switch. The automations included below
# mimic the operation of the device with factory firmware.

switch:
  - platform: output
    id: rly_sw
    name: ${friendly_name}
    output: relay
    on_turn_on:
      - light.turn_on: led_status
    on_turn_off:
      - light.turn_off: led_status
```
