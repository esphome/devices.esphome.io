---
title: Smart Oil Gauge Duo
date-published: 2026-06-09
type: sensor
standard: us
board: esp8266
difficulty: 3
---

![alt text](Product-Image.jpg "Smart Oil Gauge Duo")

Product Page: [https://www.smartoilgauge.com/shop/product/smart-oil-gauge-duo/](https://www.smartoilgauge.com/shop/product/smart-oil-gauge-duo/)

SKU: CCF-903

## Pinout

| Pin    | Function                                 |
| ------ | ---------------------------------------- |
| GPIO14 | Ultrasonic Power*                        |
| GPIO12 | Control Button (HIGH = off, LOW = on)    |
| GPIO13 | System Timer DONE (TP5111)               |
| GPIO15 | Analog Switch SELECT (SN74LVC1G3157)     |
| GPIO2  | Control Board LED (HIGH = off, LOW = on) |
| GPIO0  | UART download                            |
| GPIO16 | Connected to RST                         |
| A0     | Temperature or Battery Voltage           |
| RST    | Reset, Connected to GPIO16               |
| GPIO5  | Ultrasonic Echo (DYP-A22)                |
| TXD    | UART0_TXD                                |
| RXD    | UART0_RXD                                |
| GPIO4  | Ultrasonic Trigger (DYP-A22)             |

*Both the Duo (CCF-903) and the Original (CCF-901) Smart Oil Gauge can run on the same firmware. On the Original, GPIO14
switches a 5 VDC power supply to the Ultrasonic Sensor.  On the Duo, the Ultrasonic Sensor uses the same 3.3 VDC supply
that powers the ESP8266. As such, on the Duo, GPIO14 has no connection beyond being pulled low with a 10K resistor.

## Flashing

1. Remove the batteries
2. Open the internal electronics module (2 screws)
3. Unplug the distance sensor
4. Remove the control board
5. Locate the contact points required for physically connecting to your device. Use the following photos for reference:
   ![alt text](Connections-Front.jpg "Front Flashing Contact Points")
   ![alt text](Connections-Back.jpg "Back Flashing Contact Points")
6. Solderless connections to the edge contact points can be made using hook test leads such as these:
   [https://www.sparkfun.com/hook-test-lead-set.html](https://www.sparkfun.com/hook-test-lead-set.html)
   ![alt text](Flashing-Front.jpg "Front Flashing Connection")
   ![alt text](Flashing-Edge.jpg "Edge Flashing Connection")
7. Follow the directions as outlined by ESPHome for physically connecting to your device:
  
[https://esphome.io/guides/physical_device_connection/](https://esphome.io/guides/physical_device_connection/)

## Considerations

### Power Supply

It is highly recommended to use an external 6.5 to 7.4 VDC power supply. Running this code will likely deplete the
batteries faster than the stock firmware. Power leads can be soldered onto the battery contacts and pass through a hole
drilled into the top cap.

### Assembly

The oil gauge must be fully reassembled with all gaskets in place for the vapor seal to be maintained.

## Setup and Configuration

### Notes

Be sure to modify the substitution section of the code for your specific setup: `tank_size`, `tank_orientation`,
`oil_depth_offset`, `volume_calc_method`.

#### Oil Depth Offset

(units: inches)\
Used to correct the distance offset between the ultrasonic sensor's zero point and the top of the oil tank.

The removable electronics module design of the Smart Oil Gauge Duo allows for easy access to directly measure the
distance from the bottom of the tank to the surface of the oil using an appropriate measuring stick. To find the
oil_depth_offset, using units of inches, subtract the raw oil depth reported by the
sensor from the directly measured oil depth:\
`oil_depth_offset = (Oil Depth by Stick Measurement) - (Raw Oil Depth reported by the sensor)`

The `Raw Oil Depth` is reported in the debug level of the logger when the controller calculates the `Oil In Tank`

#### Volume Calculation Method (Advanced Configuration Only)

Calculating the oil volume in the tank from the oil depth can be performed either geometrically or using a look-up table.

The Basic Configuration below does not include the option to use a look-up table for the Volume Calculation.

The Geometric Method uses geometry to calculate the volume of oil to fill an oil tank of somewhat standard dimensions up
to the level of the measured oil depth.

The Table Method uses ESPHome's Calibrate Linear Filter to go directly from oil depth to oil volume. If the manufacturer
of your tank provides an oil volume chart, it may be possible to get a more accurate oil volume measurement by inputting
their chart data and using the table method. The Basic Configuration below has chart data as published by
[Fuel Snap](https://www.fuelsnap.com/heating_oil_tank_charts.php) for all configurable tank sizes. There are also links
to other published oil volume charts.

## Operation

The controller wakes every hour by the TPL5111.
While the controller is awake,
it calculates the Time-of-Flight to the oil 7 times (`Samples_Before_Sleep + 1`)
with an interval of 15 seconds per measurement (`throttle_average_duration`).
On the 6th Time-of-Flight measurement (`Samples_Before_Sleep`),
the controller calculates and sends the averaged Volume of Oil in the tank.
After the 7th Time-of-Flight measurement,
the controller powers down for another hour waiting for the TPL5111 to power it back up.

Pressing the control button once will either wake up the controller, or power it back down.

Double pressing the control button while powered on will toggle between allowing and not allowing the automatic power
down. When the controller is on, and the automatic power down is allowed, the LED on the control board will be OFF and
briefly blink ON every second. When the controller is on, and the automatic power down is not allowed, the LED on the
control board will be ON and briefly blink OFF every second. Wait about 15 to 20 seconds after waking the controller
before attempting to disable the automatic power down. Disabling the Automatic power down gives time to flash ESPHome
code updates.

| LED Behavior                 | Controller State (Double Press Control Button to switch states)                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| Short Blink ON every Second  | Controller is awake, after sending 3 oil volume measurements, will power down for 1 hour. (Default State) |
| Short Blink OFF every Second | Controller is awake, will continue to stay awake until restarted. Useful for reprogramming.               |

## Ultrasonic DYP-A22 with PWM Control

Datasheet:
[https://www.dypcn.com/2cm-blind-zone-ip67-high-precision-ultrasonic-sensor-product/](https://www.dypcn.com/2cm-blind-zone-ip67-high-precision-ultrasonic-sensor-product/)

![alt text](Ultrasonic.png "JSN-SR04T Waterproof Ultrasonic Range Finder")

The Ultrasonic sensor seems to be a DYP-A22 with PWM Control. In this configuration, the DYP-A22 operates using trigger
and echo pulses
like an HC-SR04 ultrasonic distance sensor.

## IC References

![alt text](IC-Locations.jpg "IC Locations") \

### TPL5111 - Nano-Power System Timer for Power Gating

SMD Marking: ZFVX \
[https://www.ti.com/lit/ds/symlink/tpl5111.pdf](https://www.ti.com/lit/ds/symlink/tpl5111.pdf)

Power Gating of 3.3VDC to the ESP8266.\
Hardwired to restart the controller every hour.\
Timer will cut 3.3V when DONE pin goes HIGH, will wake after 1hr.

### SN74LVC1G3157 - Single-Pole Double-Throw Analog Switch

SMD Marking: C5J \
Datasheet:
[https://www.ti.com/lit/ds/symlink/sn74lvc1g3157.pdf](https://www.ti.com/lit/ds/symlink/sn74lvc1g3157.pdf)

Switches the connection to A0 (GPIO17)

| SELECT (GPIO15) | A0 (GPIO17)                  |
| --------------- | ---------------------------- |
| LOW             | Battery Voltage\*            |
| HIGH            | Temperature (MCP9700AT-E/TT) |

\*Battery Voltage is measured with a voltage divider circuit using R1= 10MOhm, R2= 1MOhm.

### MCP9700AT-E/TT - Low-Power Linear Active Thermistor IC

SMD Marking: AFST \
Datasheet:
[https://ww1.microchip.com/downloads/aemDocuments/documents/MSLD/ProductDocuments/DataSheets/MCP970X-Family-Data-Sheet-DS20001942.pdf](https://ww1.microchip.com/downloads/aemDocuments/documents/MSLD/ProductDocuments/DataSheets/MCP970X-Family-Data-Sheet-DS20001942.pdf)

## Basic Configuration

The Basic Configuration below will make a basic functioning Smart Oil Gauge.
It will operate as described in the Operation Section.
It will let you monitor the geometrically calculated number of gallons in the tank and the supply voltage.
Add your own `wifi:`, `api:`, and `ota:` sections before flashing.
The example also leaves out passwords and `!secret` references so you can merge it into your own setup
and fill in your local credentials separately.

```yaml file=config.yaml
```

## Advanced Configuration

The Advanced Configuration below adds more calculations and functionality.
This Advanced Configuration would completely replace the Basic Configuration above.
Added template sensors include: `Raw Oil Depth`, `Oil Depth`, `Max Fill`,
Separate `Temperature` and `Battery Voltage`.
Added `Auto Sleep Disable` control.
Multiple additional Diagnostic sensors.
Includes a built-in option to use a look-up table to convert directly from `Oil Depth` to gallons.
Add your own `wifi:`, `api:`, and `ota:` sections before flashing.
The example also leaves out passwords and `!secret` references so you can merge it into your own setup
and fill in your local credentials separately.

```yaml file=advanced.yaml
```
