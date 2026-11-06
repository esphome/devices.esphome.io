---
title: Rotary Encoder Volume Control
date-published: 2019-10-14
type: misc
standard: global
board: esp8266
---

## General Notes

This works with a typical rotary encoder hardware, and simply sets the volume on a Home Assistant media_player via
automations.yaml. This does present some problems, for example if the esp device is restarted, the volume mutes to 0.0.
I haven't bothered to fix this, but of course contributions welcome :)

These devices usually have a built in momentary switch which you activate by pressing on the control knob. You could use
this, for example, to change the device that is being controlled. That would require some more HA automation.

You can also use this to control, for example, smart bulbs.

## Wemos Pinout

| Pin | Function                      |
| --- | ----------------------------- |
| D7  | Push Button on rotary encoder |
| D6  | Rotary Encoder pin_b          |
| D5  | Rotary Encoder pin_a          |

## Basic Configuration for esp8266 (I used a wemos)

```yaml
esphome:
  name: wemos

esp8266:
  board: d1_mini

wifi:
  ssid: "ssid"
  password: "wifi_password"

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: !secret encryption_key

ota:
  password: "ota_password"

binary_sensor:
  - platform: gpio
    pin:
      number: D7
      mode: INPUT_PULLUP
      inverted: true
    name: "Volume Switch Button"

sensor:
  - platform: rotary_encoder
    name: "Rotary Encoder"
    pin_b:
      number: D6
      mode: INPUT
    pin_a:
      number: D5
      mode: INPUT
    max_value: 100
    min_value: 0
    resolution: 4
```

## Home Assistant automations.yaml

```yaml
- id: Adjust Volume on Rotary Encoder Move
  alias: Rotary Volume Change
  trigger:
    - platform: state
      entity_id: sensor.rotary_encoder
  action:
    - service: media_player.volume_set
      entity_id: media_player.kitchen
      data_template:
        volume_level: "{{ states.sensor.rotary_encoder.state | float / 100 }}"
```
