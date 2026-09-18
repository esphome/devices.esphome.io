---
title: Mirabella Genio Smart Universal IR Controller
date-published: 2019-10-11
type: misc
standard: au
board: esp8266
---

## Programming

The USB connector data pins are connected to the serial pins so one way to program it is to cut up a micro USB cable to
pull out the data pins and connect them to a USB UART like so (Note the colours may vary depening on your cable):

| Micro USB Pin | USB UART Pin |
| ------------- | ------------ |
| 2 (White)     | TXD          |
| 3 (Green)     | RXD          |

To get into the boot loader it is necessary to short IO0 to ground. This requires opening the case which is uses
triangular headed "security" screws. These can be removed with a fine flat-head screw driver or a T7 Torx driver,
however they can be very tight so a right-angled driver handle may be needed to apply sufficient torque to loosen them.
Once open simply
short the two pads "IO0" and "G" in the block of test points while powering the device on, then program with `esphome`.
It would also be possible to solder to the test points, however they are fine pitched so using the cable simplifies
things.

Another method is to use [jumper wires with DuPoint connectors](https://en.wikipedia.org/wiki/Jump_wire) inserted
into the test points, alternating them so that adjacent connectors are inserted from opposite sides.
This gives a tight fit and good electrical connections without any cutting or soldering. As well as the four wires
for the USB UART adapter (V,G,TXD,RXD), also inserting one into IO0 and one into RST assists with entering boot mode.
RST can be shorted to ground (G) instead of powering the device off and on.
Note that the test point diameter and spacing is such that the round style of connectors fit well but the square
profile connectors do not.

## GPIO Pinout

| Pin    | Function           |
| ------ | ------------------ |
| GPIO4  | Red Status LED     |
| GPIO14 | Remote Transmitter |
| GPIO5  | Remote Receiver    |
| GPIO13 | Push Button        |

## Basic Configuration

```yaml
# Basic Config
# https://mirabellagenio.net.au/smart-ir-controller
---
esphome:
  name: esphome_ir1
  on_boot:
    priority: 100 # Highest priority, ensures light turns on without delay.
    then:
      - light.turn_on: light_red_led

esp8266:
  board: esp01_1m
wifi:
  ssid: "ssid"
  password: "wifi_password"
  ap:
    ssid: "apssid"
    password: "ap_password"
  domain: ".mydomain.com"

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

ota:
  password: "ota_password"
web_server:

sensor:
  - platform: wifi_signal
    name: "ESPHome_ir1 Wifi"
    update_interval: 60s

remote_transmitter:
  pin: GPIO14
  carrier_duty_percent: 33%

remote_receiver:
  pin:
    number: GPIO5
    inverted: True
  #dump: jvc

binary_sensor:
  - platform: remote_receiver
    name: "Sony_TV(RF-On)"
    internal: true
    on_press:
      then:
        - switch.template.publish:
            id: sony_tv_power
            state: ON
    sony:
      data: "0x750"
      nbits: 12
  - platform: remote_receiver
    name: "Sony_TV(RF-Off)"
    internal: true
    on_press:
      then:
        - switch.template.publish:
            id: sony_tv_power
            state: OFF
    sony:
      data: "0xF50"
      nbits: 12

  - platform: remote_receiver
    name: "WIZ(RF-ON)"
    internal: true
    jvc:
      data: "0xC03F"
    on_press:
      then:
        - switch.template.publish:
            id: wiz_rf_power
            state: ON

  - platform: remote_receiver
    name: "WIZ(RF-OFF)"
    internal: true
    on_press:
      then:
        - switch.template.publish:
            id: wiz_rf_power
            state: OFF
    jvc:
      data: "0x40BF"

  - platform: remote_receiver
    name: "WIZ(RF-Brightness -)"
    jvc:
      data: "0x906F"

  - platform: remote_receiver
    name: "WIZ(RF-Brightness +)"
    jvc:
      data: "0x10EF"

  - platform: remote_receiver
    name: "WIZ(RF-1)"
    internal: true
    on_press:
      then:
        - switch.template.publish:
            id: wiz_rf_1
            state: ON
        - switch.template.publish:
            id: wiz_rf_2
            state: OFF
        - switch.template.publish:
            id: wiz_rf_3
            state: OFF
        - switch.template.publish:
            id: wiz_rf_4
            state: OFF
    jvc:
      data: "0x20DF"

  - platform: remote_receiver
    name: "WIZ(RF-2)"
    internal: true
    on_press:
      then:
        - switch.template.publish:
            id: wiz_rf_1
            state: OFF
        - switch.template.publish:
            id: wiz_rf_2
            state: ON
        - switch.template.publish:
            id: wiz_rf_3
            state: OFF
        - switch.template.publish:
            id: wiz_rf_4
            state: OFF
    jvc:
      data: "0xA05F"

  - platform: remote_receiver
    name: "WIZ(RF-3)"
    internal: true
    on_press:
      then:
        - switch.template.publish:
            id: wiz_rf_1
            state: OFF
        - switch.template.publish:
            id: wiz_rf_2
            state: OFF
        - switch.template.publish:
            id: wiz_rf_3
            state: ON
        - switch.template.publish:
            id: wiz_rf_4
            state: OFF
    jvc:
      data: "0xE01F"

  - platform: remote_receiver
    name: "WIZ(RF-4)"
    internal: true
    on_press:
      then:
        - switch.template.publish:
            id: wiz_rf_1
            state: OFF
        - switch.template.publish:
            id: wiz_rf_2
            state: OFF
        - switch.template.publish:
            id: wiz_rf_3
            state: OFF
        - switch.template.publish:
            id: wiz_rf_4
            state: ON
    jvc:
      data: "0x609F"

  # This is the physical button on the unit.
  - platform: gpio
    pin:
      number: GPIO13
      mode: INPUT_PULLUP
      inverted: True
    name: "ESPHome_ir1 Button"

switch:
  - platform: restart
    name: "ESPHome_ir1 restart"
  - platform: template
    name: Sony TV Power
    id: sony_tv_power
    optimistic: true
    restore_state: true
    turn_on_action:
      - remote_transmitter.transmit_sony:
          data: "0x750"
          nbits: 12
          repeat:
            times: 3
            wait_time: 40ms
    turn_off_action:
      - remote_transmitter.transmit_sony:
          data: "0xF50"
          nbits: 12
          repeat:
            times: 3
            wait_time: 40ms

  - platform: template
    name: WIZ mode 1
    id: wiz_rf_1
    optimistic: true
    restore_state: true

  - platform: template
    name: WIZ mode 2
    id: wiz_rf_2
    optimistic: true
    restore_state: true

  - platform: template
    name: WIZ mode 3
    id: wiz_rf_3
    optimistic: true

  - platform: template
    name: WIZ mode 4
    id: wiz_rf_4
    optimistic: true
    restore_state: true

  - platform: template
    name: WIZ Remote Power
    id: wiz_rf_power
    optimistic: true
    restore_state: true
    turn_on_action:
      - remote_transmitter.transmit_jvc:
          data: "0xC03F"
    turn_off_action:
      - remote_transmitter.transmit_jvc:
          data: "0x40BF"

output:
  - platform: esp8266_pwm
    id: esphome_ir1_red_led
    pin:
      number: GPIO4
      inverted: True

light:
  - platform: monochromatic
    name: "esphome_ir1 Red LED"
    output: esphome_ir1_red_led
    id: light_red_led
```
