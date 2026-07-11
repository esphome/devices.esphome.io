---
title: H801/H802 RGBW LED controller
date-published: 2023-04-11
type: light
standard: global
board: esp8266
---

If you have an H802, read this page, then scroll down to the [H802 section](#h802).

The H801 is pretty affordable and easy to hack and adapt to your needs.
It can be found on [AliExpress](https://s.click.aliexpress.com/e/bbnUDBZW) and other sites.
The board is based on an [ESP8266EX](https://documentation.espressif.com/0a-esp8266ex_datasheet_en.pdf)
chip.

It has 5 seperate PWM outputs (each driven by a DTU35N06
MOSFET rated for 106W max power), and can be used as a [RGB](https://esphome.io/components/light/rgb/) /
[RGBW](https://esphome.io/components/light/rgbw/) / [RGBWW](https://esphome.io/components/light/rgbww/) /
[RGBCT](https://esphome.io/components/light/rgbct/)
controller or configured with any combination of up to five
[individual monochromatic PWM](https://esphome.io/components/light/monochromatic/) lights.

See [A closer look at the H801 LED WiFi
Controller](https://tinkerman.cat/post/closer-look-h801-led-wifi-controller)
for more details on the hardware.

![Product Image](./h801.jpg "Product Image")

## Sample configuration

You can use the [RGBWW](https://esphome.io/components/light/rgbww/) and the
[ESP8266 Software PWM output](https://esphome.io/components/output/esp8266_pwm/) components using below configuration:

```yaml
esphome:
  name: h801light

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:
api:
ota:

output:
  - platform: esp8266_pwm
    pin: 12
    frequency: 1000 Hz
    id: pwm_b
  - platform: esp8266_pwm
    pin: 13
    frequency: 1000 Hz
    id: pwm_g
  - platform: esp8266_pwm
    pin: 15
    frequency: 1000 Hz
    id: pwm_r
  - platform: esp8266_pwm
    pin: 14
    frequency: 1000 Hz
    id: pwm_w1
  - platform: esp8266_pwm
    pin: 4
    frequency: 1000 Hz
    id: pwm_w2
light:
  - platform: rgbww
    name: "H801 Light"
    red: pwm_r
    green: pwm_g
    blue: pwm_b
    cold_white: pwm_w1
    warm_white: pwm_w2
```

For [RGBW](https://esphome.io/components/light/rgbw/)
lights, the `pwm_w2` output is not used (and can be removed):

```yaml
light:
  - platform: rgbw
    name: "H801 Light"
    red: pwm_r
    green: pwm_g
    blue: pwm_b
    white: pwm_w1
```

## Flashing

Make your node in the ESPHome dashboard and compile/upload it. (if it
fails OTA it must be uploaded manually with your favorite ESP flasher,
e.g. `esphome-flasher <esphome-flasher>`

You will need to solder pins to the board inside the H801 (fortunately
it\'s pretty roomy and not a lot of components or stuff in the way apart
from the 2 wires on the back).

3.3V, GND, TX and RX (RX to RX and TX to TX) needs to be connected to
your serial adapter, the two other pins must be shorted throughout the
flashing process by a jumper or a breadboard cable. (Remember to remove
it after flashing)

![Front](./h801-board-front.jpg "Front")

Front side of board with pins soldered on

![Back](./h801-board-back.jpg "Back")

Back side of the board (don\'t melt the blue and red wire when
soldering)

## Add A PIR(Motion) Sensor

It\'s possible to use the header that was soldered on for flashing as an
input. The example below uses the TX pin as a PIR motion sensor input:

![PIR Sensor](./h801-pir_sensor.jpg "PIR Sensor")

H801 shown with PIR connected to header pins

The following can be appended to the YAML file for your H801 to
configure the TX pin as a motion sensor input.

```yaml
binary_sensor:
  - platform: gpio
    pin: GPIO3
    name: "GPIO3-TX Motion"
    device_class: motion
```

## Pinout

| Function       | ESP Pin |
| -------------- | ------- |
| R (PWM1)       | GPIO15  |
| G (PWM2)       | GPIO13  |
| B (PWM3)       | GPIO12  |
| W1 (PWM4)      | GPIO14  |
| W2 (PWM5)      | GPIO4   |
| Jumper J3      | GPIO0   |
| RX             | GPIO2   |
| TX             | GPIO3   |
| LED D1 (red)   | GPIO5   |
| LED D2 (green) | GPIO1   |

## H802

The H802 is a very similar device, with four channels (RGBW) instead of five.

It looks like this:

![H802 case photo](./H802WiFi-1.jpg "H802 case photo")

![H802 board photo with annotations](./h802-board-photo-annotated.jpg "H802 board photo with annotations")

Pinout:

| Function  | ESP Pin |
| --------- | ------- |
| R (PWM1)  | GPIO14  |
| G (PWM2)  | GPIO12  |
| B (PWM3)  | GPIO13  |
| W (PWM4)  | GPIO15  |
| Jumper J3 | GPIO0   |
| RX        | GPIO3   |
| TX        | GPIO2   |

Unlike the H801, the H802 has no LEDs of its own.
Note that the RGBW pinout is reversed compared to the H801.

When flashing, instead of connecting 3V3, you can power the device from its usual power supply.
Connect RX to TX and TX to RX.

Sample configuration:

```yaml
esphome:
  name: h802light

esp8266:
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

logger:
  hardware_uart: UART1
api:
ota:

output:
  - platform: esp8266_pwm
    pin: 13
    frequency: 1000 Hz
    id: pwm_b
  - platform: esp8266_pwm
    pin: 12
    frequency: 1000 Hz
    id: pwm_g
  - platform: esp8266_pwm
    pin: 14
    frequency: 1000 Hz
    id: pwm_r
  - platform: esp8266_pwm
    pin: 15
    frequency: 1000 Hz
    id: pwm_w1
light:
  - platform: rgbw
    name: "H802 Light"
    red: pwm_r
    green: pwm_g
    blue: pwm_b
    white: pwm_w1
```
