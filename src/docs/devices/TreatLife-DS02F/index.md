---
title: TreatLife DS02F Ceiling Fan Controller
date-published: 2024-06-06
type: switch
standard: us
board: bk72xx
---

Treatlife DS02F Switch![image](treatlife_DS02F.jpg)

[Amazon Link](https://www.amazon.com/dp/B08P5D3ZKW)

## Notes

The Treatlife DS02F is similar to the DS03, but lacking the control for the light. This device comes with a Tuya WB3S
chip and there are now two methods to make this device compatible with ESPHome:

1. **Use [Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) to flash the device.**
2. **Swap out the chip with a compatible one.**

### Using Cloudcutter

[Cloudcutter](https://github.com/tuya-cloudcutter/tuya-cloudcutter) is a tool designed to simplify the process of
flashing Tuya-based devices. It allows you to bypass the need for physically opening the device and swapping out chips.
By leveraging the cloud APIs, Cloudcutter enables you to flash the firmware remotely, making it a convenient and less
intrusive option. Follow the instructions on the
[Cloudcutter GitHub repository](https://github.com/tuya-cloudcutter/tuya-cloudcutter) to use this method for flashing
your DS02F device.

### Swap chip

The main board has the appropriate footprint for an ESP-12F. Further instructions can be found
[in the Home Assistant community][1]. When desoldering the WB3S chip, take care if you use a heat gun near the black
foam light guards around the speed LEDs and main switch LED. When overheated, the foam shrinks to less than half its
original size. With a little patience, it is instead possible to peel the foam and adhesive off the PCB, set them to
the side, and replace them after swapping out the WB3S.

[1]: https://community.home-assistant.io/t/treatlife-dual-outlet-indoor-dimmer-plug-wb3s-to-esp-12-transplant/256798

Like the Treatlife DS03, the Tuya MCU UART runs at a baud rate of 115200. You may see a warning like
`Invalid baud_rate: Integration requested baud_rate 9600 but you have 115200!` logged, but it is safe to ignore.

## GPIO Pinout

### ESP-Based Pinout

| Pin   | Function |
| ----- | -------- |
| GPIO1 | Tuya Tx  |
| GPIO3 | Tuya Rx  |

### BK72XX-Based Pinout

| Pin | Function |
| --- | -------- |
| RX1 | Tuya Rx  |
| TX1 | Tuya Tx  |

### ESP32-C3F Pinout

| Pin    | Function |
| ------ | -------- |
| GPIO20 | Tuya Rx  |
| GPIO21 | Tuya Tx  |

## Basic Configuration

```yaml
esphome:
  name: ds02f

# ESP-Based Board
#esp8266:
#  board: esp01_1m

# BK72XX-Based Board
bk72xx:
  board: wb3s

# Enable logging
logger:

# Enable Home Assistant API
api:

ota:

wifi:
  ssid: "ssid"
  password: "PASSWORD"

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "DS02F Fallback Hotspot"
    password: "ul57sDUAqbcl"

captive_portal:

uart:
  rx_pin: RX1
  tx_pin: TX1
  baud_rate: 115200

tuya:
  id: tuyamcu
  on_datapoint_update:
    - sensor_datapoint: 101
      datapoint_type: int
      then:
        - lambda: |-
            id(inverted_light_mode).publish_state(x == 1);

fan:
  - platform: "tuya"
    name: Treatlife DS02F Speed
    switch_datapoint: 1
    speed_datapoint: 3
    speed_count: 4

# The "Light Mode" controls the white status led ring on the button.
# Normal Mode (0): Led ON when fan power OFF, Led OFF when fan power ON
# Inverted Mode (1): Led OFF when fan power OFF, Led ON when fan power ON
switch:
  - platform: template
    id: inverted_light_mode
    name: Inverted Light Mode
    turn_on_action:
      - lambda: |-
          id(tuyamcu).set_integer_datapoint_value(101,1);
    turn_off_action:
      - lambda: |-
          id(tuyamcu).set_integer_datapoint_value(101,0);
```
