---
title: Sonoff BASIC R1
date-published: 2023-04-13
type: relay
standard: global
board: esp8266
---

This is a DIY solution, and you will need to have some knowledge of
electrical wiring and enough capabilities to do this work safely.

The goal is to replace the light switch with one that
can be controlled by home assistant, whilst retaining the ease of use of
a standard light that would also continue to work if the network went
down, or Home Assistant failed etc.

![Product Image](./sonoff_basic.jpg "Product Image")

Use a *retractive* style light switch. That is one that is spring
loaded and so always returns to the ``off`` position. It's effectively
a push button, that looks like a light switch.

If you have a Sonoff BASIC V1 devices GPIO14 is already presented on a
pin header on the PCB next to the programming pins. On the V2 and V3
PCBs, there is a solder pad underneath the PCB that will let you get at
this GPIO.

You have 2 choices when it comes to picking which GPIO to use. GPIO0 or
GPIO14. GPIO0 is used by the push button switch on the the PCB so you
will need to locate the right pin on the switch and solder a wire onto
it if you\'re going to use that one. Whichever one you pick, you will
also need to use the ground or 0V pin for the other side of the switch.
Once you have soldered your wires into place, a handy tip is to add a
drop of glue over the wire, a little way away from the solder joint, so
give some strain relief to the joint.

Now you have a pair of wires from the GPIO and 0V to your retractive
switch lets look at the code.

``` yaml

esp8266:
  board: esp01_1m

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO14
      mode:
        input: true
        pullup: true
      inverted: true
    id: button_1
    on_press:
      then:
        - light.toggle: light_1

  - platform: status
    name: "My LS Status"

output:
  - platform: gpio
    pin: GPIO12
    id: relay_1

light:
  - platform: binary
    name: "My Light"
    id: light_1
    output: relay_1

status_led:
  pin:
    number: GPIO13
    inverted: yes
```

## Note

If you wanted to use a pull cord switch (in a bathroom for instance)
that works like a standard switch and changes state each pull (as
opposed to a retractive switch that you press and let go) then you can
change a single line *on_press:* to *on_state:* which will trigger the
light toggle every time the state of the switch changes.

If you do this it's important that you do not use GPIO0, otherwise if
the device reboots and the switch happens to be in the closed state the
Sonoff will boot into flash mode and not work.
