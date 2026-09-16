esphome:
  name: cyd-test

esp32:
  board: esp32dev
  framework:
    type: arduino

logger:

api:

ota:
  - platform: esphome

wifi:
  ssid: "Ganenko_house"
  password: "Sergh03&Mariya"

spi:
  clk_pin: GPIO14
  mosi_pin: GPIO13
  miso_pin: GPIO12

font:
  - file: "gfonts://Roboto"
    id: font1
    size: 20

display:
  - platform: mipi_spi
    model: ST7789V
    cs_pin: GPIO15
    dc_pin: GPIO2
    rotation: 90

    lambda: |-
      it.fill(Color::BLACK);
      it.print(20, 20, id(font1), Color::WHITE, "DISPLAY OK");
