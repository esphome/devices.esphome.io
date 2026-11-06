---
title: BlitzHome BH-AP1
date-published: 2023-07-21
type: misc
standard: eu
board: esp8266
made-for-esphome: False
difficulty: 4
---

## General Notes

These devices run a Tuya TYWE3S module which needs flashing.
Flashing and disassembly instructions can be found
[on the Blakadder template page](https://templates.blakadder.com/blitzhome_BH-AP1).

The BlitzWolf BW-AP1 looks awfully similiar, probably the same device, so it's possible it's compatible as well.

## GPIO Pinout

| Pin   | Function |
| ----- | -------- |
| GPIO1 | UART TX  |
| GPIO3 | UART RX  |

## Configuration

There are two options:

In the first option, the device is presented as a `select` entity, with states `OFF`, `Auto`, `Fan 1`, `Fan 2`, `Sleep`.
Everything is presented in one entity, no dummy output needed. This is more similar to the controls on the device, which
cycles through these options, there isn't a separate control for mode and fan speed.

The second is presenting the device as a `fan` with states `OFF`, `Speed 1`, `Speed 2`. The modes (`Auto`, `Manual`,
`Sleep`) can be accessed by an additional `select`, because right now, Home Assistant does not support custom speed for
fans.
In this mode when modes `Auto` or `Sleep` is selected the `fan` entity will display `Speed 1` which is not necessarily
true. Also for example if you have `Sleep` selected, you cannot change to `Speed 1`, because it is already selected. You
have to change to mode to `Manual` instead, which can make writing automations difficult.
Because there is not a template fan, or template output in esphome, I used a dummy pwm output for the fan on `GPIO4`
which is not used. There is an option to change this by writing a custom output component for this, but it's probalby
not worth the work.

You can choose between the two, I prefer the first method with the `select`, but if you insist to have the device
presented as a `fan` entity, you can do that as well.

### Configuration as select entity

```yaml
substitutions:
  name: air-purifier
  devicename: Air Purifier

esphome:
  name: ${name}
  comment: ${devicename}

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:

captive_portal:

# Enable Home Assistant API
api:
  encryption:
    key: !secret esphome_encryption_key

# Enable OTA updates
ota:
  safe_mode: true
  password: !secret esphome_wifi_pass

esp8266:
  board: esp01_1m

logger:
  baud_rate: 0

uart:
  rx_pin: GPIO3
  tx_pin: GPIO1
  baud_rate: 9600

tuya:
  id: tuyadevice
  on_datapoint_update:
    - sensor_datapoint: 22
      datapoint_type: enum
      then:
        - lambda: |-
            if (x == 0) {
              id(air_quality).publish_state("Excellent");
            } else if (x == 1) {
              id(air_quality).publish_state("Good");
            } else if (x == 2) {
              id(air_quality).publish_state("Poor");
            }
    - sensor_datapoint: 1
      datapoint_type: bool
      then:
        - lambda: |-
            if (!x) {
              id(purifier).publish_state("OFF");
            }
    - sensor_datapoint: 3
      datapoint_type: enum
      then:
        - lambda: |-
            switch (x) {
              case 0:
                id(purifier).publish_state("Sleep");
                break;
              case 1:
                id(purifier).publish_state("Auto");
                break;
              case 2:
                if (id(tuya_fan).state == 0) {
                  id(purifier).publish_state("Fan 1");
                } else if (id(tuya_fan).state == 1) {
                  id(purifier).publish_state("Fan 2");
                }
                break;
            }
    - sensor_datapoint: 4
      datapoint_type: enum
      then:
        - lambda: |-
            if (id(tuya_mode).state == 2) {
              if (x == 0) {
                id(purifier).publish_state("Fan 1");
              } else if (x == 1) {
                id(purifier).publish_state("Fan 2");
              }
            }

sensor:
  - platform: tuya
    name: ${devicename} PM2.5
    sensor_datapoint: 2
    device_class: PM25

  - platform: tuya
    name: ${devicename} Filter Life
    sensor_datapoint: 5
    unit_of_measurement: "%"

text_sensor:
  - platform: template
    name: ${devicename} Air Quality
    id: air_quality

button:
  - platform: template
    name: ${devicename} Filter Reset
    entity_category: config
    on_press:
      - lambda: |-
          id(tuyadevice).set_boolean_datapoint_value(11,1);

select:
  - platform: template
    name: ${devicename}
    id: purifier
    optimistic: true
    options:
      - "OFF"
      - "Auto"
      - "Fan 1"
      - "Fan 2"
      - "Sleep"
    on_value:
      then:
        - lambda: |-
            if (x == "OFF") {
              if (id(tuya_power).state) {
                id(tuyadevice).set_boolean_datapoint_value(1,false);
              }
            } else if (x == "Auto") {
              if (!id(tuya_power).state) {
                id(tuyadevice).set_boolean_datapoint_value(1,true);
                delay(1);
              }
              id(tuyadevice).set_enum_datapoint_value(3,1);
            } else if (x == "Fan 1") {
              if (!id(tuya_power).state) {
                id(tuyadevice).set_boolean_datapoint_value(1,true);
                delay(1);
              }
              if (id(tuya_mode).state != 2) {
                id(tuyadevice).set_enum_datapoint_value(3,2);
                delay(1);
              }
              id(tuyadevice).set_enum_datapoint_value(4,0);
            } else if (x == "Fan 2") {
              if (!id(tuya_power).state) {
                id(tuyadevice).set_boolean_datapoint_value(1,true);
                delay(1);
              }
              if (id(tuya_mode).state != 2) {
                id(tuyadevice).set_enum_datapoint_value(3,2);
                delay(1);
              }
              id(tuyadevice).set_enum_datapoint_value(4,1);
            } else if (x == "Sleep") {
              if (!id(tuya_power).state) {
                id(tuyadevice).set_boolean_datapoint_value(1,true);
                delay(1);
              }
              id(tuyadevice).set_enum_datapoint_value(3,0);
            }
  - platform: tuya
    name: ${devicename} Countdown
    enum_datapoint: 19
    optimistic: true
    options:
      0: "OFF"
      1: "1 hour"
      2: "2 hours"
      3: "4 hours"
      4: "8 hours"

switch:
  - platform: tuya
    id: tuya_power
    switch_datapoint: 1

number:
  - platform: tuya
    id: tuya_mode
    number_datapoint: 3
    min_value: 0
    max_value: 2
    step: 1
  - platform: tuya
    id: tuya_fan
    number_datapoint: 4
    min_value: 0
    max_value: 1
    step: 1
```

### Configuration as fan entity

```yaml
substitutions:
  name: air-purifier
  devicename: Air Purifier

esphome:
  name: ${name}
  comment: ${devicename}

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
captive_portal:

# Enable Home Assistant API
api:
  encryption:
    key: !secret esphome_encryption_key

# Enable OTA updates
ota:
  safe_mode: true
  password: !secret esphome_wifi_pass

esp8266:
  board: esp01_1m

logger:
  baud_rate: 0

uart:
  rx_pin: GPIO3
  tx_pin: GPIO1
  baud_rate: 9600

tuya:
  id: tuyadevice
  on_datapoint_update:
    - sensor_datapoint: 22
      datapoint_type: enum
      then:
        - lambda: |-
            if (x == 0) {
              id(air_quality).publish_state("Excellent");
            } else if (x == 1) {
              id(air_quality).publish_state("Good");
            } else if (x == 2) {
              id(air_quality).publish_state("Poor");
            }
    - sensor_datapoint: 1
      datapoint_type: bool
      then:
        - lambda: |-
            if (x) {
              id(fan1).turn_on().perform();
            } else {
              id(fan1).turn_off().perform();
            }
    - sensor_datapoint: 4
      datapoint_type: enum
      then:
        - lambda: |-
            if (x == 1) {
              if (id(fan1).speed != 2) {
                auto call = id(fan1).turn_on();
                call.set_speed(2);
                call.perform();
              }
            } else if (x == 0) {
              if (id(fan1).speed != 1) {
                auto call = id(fan1).turn_on();
                call.set_speed(1);
                call.perform();
              }
            }

fan:
  - platform: speed
    output: dummy_pwm
    name: ${devicename}
    speed_count: 2
    id: fan1
    on_turn_on:
      - lambda: |-
          id(tuyadevice).set_boolean_datapoint_value(1,true);
    on_turn_off:
      - lambda: |-
          id(tuyadevice).set_boolean_datapoint_value(1,false);
    on_speed_set:
      - lambda: |-
          if (id(fan1).speed == 1) {
            id(tuyadevice).set_enum_datapoint_value(4,0);
          } else if (id(fan1).speed == 2) {
            id(tuyadevice).set_enum_datapoint_value(4,1);
          }

sensor:
  - platform: tuya
    name: ${devicename} PM2.5
    sensor_datapoint: 2
    device_class: PM25

  - platform: tuya
    name: ${devicename} Filter Life
    sensor_datapoint: 5
    unit_of_measurement: "%"

text_sensor:
  - platform: template
    name: ${devicename} Air Quality
    id: air_quality

button:
  - platform: template
    name: ${devicename} Filter Reset
    entity_category: config
    on_press:
      - lambda: |-
          id(tuyadevice).set_boolean_datapoint_value(11,1);

select:
  - platform: tuya
    name: ${devicename} Countdown
    enum_datapoint: 19
    optimistic: true
    options:
      0: "OFF"
      1: "1 hour"
      2: "2 hours"
      3: "4 hours"
      4: "8 hours"

  - platform: tuya
    name: ${devicename} Mode
    enum_datapoint: 3
    optimistic: true
    options:
      0: "Sleep"
      1: "Auto"
      2: "Manual"

output:
  - platform: esp8266_pwm
    pin: GPIO4
    id: dummy_pwm
```
