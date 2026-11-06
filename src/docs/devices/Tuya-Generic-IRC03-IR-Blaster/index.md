---
title: Tuya Generic IRC03 IR Blaster
date-published: 2025-01-04
type: misc
standard: global
board: bk72xx
difficulty: 2
---

## General Notes

There's detailed teardown info at [Elektroda](https://www.elektroda.com/rtvforum/topic4012905.html).

Despite appearing outwardly identical to the
[Tuya Generic IR Remote Control](/devices/Tuya-Generic-WiFi-IR-Remote-Control), the IRC03 has a custom PCB with the
BK7231N directly integrated into it as opposed to using the CB3S module. The pinouts between the two devices differ as a
result.

![IRC03](IRC03.jpg)

## GPIO Pinout

| Pin | Function       |
| --- | -------------- |
| P7  | IR Transmitter |
| P8  | IR Receiver    |
| P9  | Button         |
| P24 | LED            |

## Flashing

I used `ltchiptool` to backup the original firmware and flash an esphome uf2 binary to it.
The pads are all nicely labeled.

As of May 2025, these devices are also vulnerable to `tuya-cloudcutter` (and likely `tuya-convert`), allowing for
disassembly-free flashing. I've had success using the generic 2.1.5 BK7231N template as well as a 2.1.5 CB3S template to
flash ESPHome Kickstart to the device, from which I uploaded a proper UF2 binary compiled from ESPHome.

## Configuration

```yaml
bk72xx:
  board: generic-bk7231n-qfn32-tuya

output:
  - platform: libretiny_pwm
    id: led
    pin: 24

light:
  - platform: monochromatic
    name: LED
    output: led

binary_sensor:
  - platform: gpio
    id: btn
    pin:
      number: 9
      mode:
        input: true
        pullup: true
      inverted: true

remote_transmitter:
  pin: 7
  carrier_duty_percent: 50%

remote_receiver:
  pin:
    number: 8
    inverted: true
    mode:
      input: true
      pullup: true
  tolerance: 55%
```

If you're attempting to use this with raw IR commands with an integration such as SmartIR, make sure that you set the
carrier frequency accordingly. Not setting this may result in otherwise valid codes not working with your device as
anticipated or at all. Valid frequencies typically range betweeen 33-40 kHz or 50-60 kHz, with the most common protocol,
the NEC protocol, using a frequency of 38 kHz.

```yaml
api:
  encryption:
    key: "xxxxxxx"
  services:
    - service: send_raw_command
      variables:
        command: int[]
      then:
        - remote_transmitter.transmit_raw:
            code: !lambda "return command;"
            carrier_frequency: !lambda "return 38000.0;"
```

If you don't know the carrier frequency, and the NEC default of 38 kHz doesn't work, you can find out what your device's
frequency is by dumping a code from your existing remote. First, modify the `remote_receiver` definition in the ESPHome
configuration to dump the codes in Pronto form. These include the carrier frequency embedded in them.

```yaml
remote_receiver:
  pin:
    number: 8
    inverted: true
    mode:
      input: true
      pullup: true
  tolerance: 55%
  dump: pronto
```

Once you flash the firmware, keep the device logs open within ESPHome Device Builder. Take the remote for your device,
point it at the IR blaster, and press any button to send a command. You should see a code printed out in the device
logs. This may be spread across multiple lines depending on length; combine all lines into one.

Next, [open up an IR code converter such as the Sensus IR/RF Code Converter](https://pasthev.github.io/sensus/). Paste
the Pronto code into the box labeled "Pronto data" and hit Convert; this may take a few moments to analyze. Once done,
the Hz box on the left should be filled with a number. This is your carrier frequency.

Go back to the ESPHome device configuration, remove the `dump: pronto` line, and under the `transmit_raw` services
section replace `38000.0` with the value you retrieved. If you are controlling multiple devices that require different
carrier frequencies, as might be the case within SmartIR, duplicate the `send_raw_command` service in its entirety,
rename it to indicate it's not the 38 kHz frequency command, and replace the carrier frequency in the lambda
appropriately.
