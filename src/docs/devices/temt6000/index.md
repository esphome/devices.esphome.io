---
title: TEMT6000
date-published: 2023-04-11
type: sensor
standard: global
---

The TEMT6000 is a simple and cheap ambient light sensor. The sensor
itself changes its resistance based on how much light hits the sensor.
In order for us to read this resistance the breakout boards you can buy
these chips on often have a small constant value resistor and three
pins: `GND`, `VCC` and `SIG`. Connect `VCC` to `3.3V`, `GND` to `GND`
and `SIG` to any available analog pin.

![image](./temt6000-header.jpg)

To get the brightness the sensor measures, we then simply have to
measure the voltage on the `SIG` (also called `OUT`) pin using `adc` and convert those
voltage measurements to illuminance values in lux using a formula:

``` yaml
sensor:
  - platform: adc
    pin: A0
    name: "TEMT6000 Illuminance"
    device_class: illuminance
    unit_of_measurement: lx
    filters:
      - lambda: |-
          return (x / 10000.0) * 2000000.0;
```

![image](./temt6000-pins.jpg)

Pins on the TEMT6000. Connect `OUT` to an ADC
pin, `GND` to `GND`, and `VCC` to `3.3V`.

## Formula Explanation

To get the illuminance in lux, we first need to convert the measured
voltage to the current flowing across the TEMT6000 sensor. This current
is also equal to the current flowing across the 10kΩ resistor in the
voltage divider circuit, which is `I = adc_value/10000kΩ`.

The [datasheet for the
TEMT6000](https://www.sparkfun.com/datasheets/Sensors/Imaging/TEMT6000.pdf)
specifies a proportional correlation between current and illuminance:
Every 2 µA of current correlates to 1 lx in the illuminance.

### Note

The default voltage range of the ADC for the ESP8266 and ESP32 are from
0 to 1.0V. So you won\'t be able to measure any value above 200 lx using
the default setup.

For the ESP32, you have the option of setting a Voltage Attenuation (`adc-esp32_attenuation`)
(note that the formula doesn\'t need to be adjusted if you
set an attenuation, as the value `x` is automatically converted to
volts).

For the ESP8266, you unfortunately need to tinker with the hardware a
bit to decrease the voltage a bit. So one option would be to create
another voltage divider on the `SIG` pin to divide the analog voltage by
a constant value.

## See Also

- [TEMT6000 datasheet](https://www.sparkfun.com/datasheets/Sensors/Imaging/TEMT6000.pdf)
