---
title:  BRUH Multisensor
date-published: 2023-04-11
type: sensor
standard: global
board: esp8266
---

The BRUH Multisensor is a great introductory project into Home
Automation with an amazing setup tutorial. And fortunately ESPHome has
complete support for all the stuff used by the Multisensor.

[Learn more video](https://www.youtube.com/embed/jpjfVc-9IrQ)

## Configuration example

Thank you very much to [\@jackjohnsonuk](https://github.com/jackjohnsonuk) for providing this configuration file.

``` yaml
sensor:
  - platform: dht
    pin: D7
    temperature:
      name: "Multisensor Temperature"
    humidity:
      name: "Multisensor Humidity"
  - platform: adc
    pin: A0
    name: "Multisensor Brightness"
    unit_of_measurement: lux
    filters:
      - lambda: |-
          return (x / 10000.0) * 2000000.0;

binary_sensor:
  - platform: gpio
    pin: D5
    name: "Multisensor Motion"
    device_class: motion

output:
  - platform: esp8266_pwm
    pin: D1
    id: redgpio
  - platform: esp8266_pwm
    pin: D2
    id: greengpio
  - platform: esp8266_pwm
    pin: D3
    id: bluegpio

light:
  - platform: rgb
    name: "Multisensor Light"
    red: redgpio
    green: greengpio
    blue: bluegpio
```
