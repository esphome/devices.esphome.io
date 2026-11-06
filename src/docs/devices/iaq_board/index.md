---
title: IAQ (Indoor Air Quality) Board
date-published: 2023-04-11
type: sensor
standard: global
---

![image](./iaq_board2.jpg)

IAQ Board is a DIY device for measuring internal air quality running
with esphome. It's quite small and is based on a custom PCB where part
of the components are soldered and connected.

Here is what it can measure:

- Temperature / Humidity / Pressure
- Air particles PM1, PM2.5, PM10
- Carbon Dioxide with NDIR sensor
- Air Quality Index by EPA, based on 24h average PM2.5 particles
- Ambient light
- Total VOC (volatile organic compound)
- equivalent CO2 (not very correct compared with the NDIR sensor, but it\'s provided by the VOC sensor)

On top of that:

- At least one OLED display to show the data (can have one more on the top of the MCU board)
- three RGB wide angle LEDs with auto brightness. LED1 indicates PM2.5, LED2 - Air quality index, LED3 - CO2.
- auto night dimming of the displays and LEDs (can be disabled)
- MIN/MAX values of Temperature, PM2.5 and CO2, and 24h average PM2.5 value.
- multi function button for selection of the data to show on the display

## ESPHome Configuration (basic)

```yaml
uart:
  - rx_pin: GPIO1
    baud_rate: 9600
    id: pms
  
  - rx_pin: GPIO18
    tx_pin: GPIO19
    baud_rate: 9600
    id: mh

i2c:
  scl: GPIO22
  sda: GPIO21
  frequency: 100kHz

sensor:
    - platform: pmsx003
      type: PMSX003
      uart_id: pms
      pm_1_0:
        name: "PM 1 Concentration"
        id: pm1
      pm_2_5:
        name: "PM 2.5 Concentration"
        id: pm2_5
      pm_10_0:
        name: "PM 10 Concentration"
        id: pm10

    - platform: bme280
      temperature:
        name: "Temperature"
        oversampling: 1x
        id: temp
        filters:
          - offset: -1.5

      pressure:
        name: "Pressure"
        oversampling: 1x
        id: press
      humidity:
        name: "Humidity"
        oversampling: 1x
        id: hum
      address: 0x76
      update_interval: 10s

    - platform: mhz19
      co2:
        name: "CO2"
        id: co2
      temperature:
        name: "MH-Z19 Temperature"
      update_interval: 10s
      automatic_baseline_calibration: false
      uart_id: mh
      id: mh_sensor

    - platform: tsl2561
      name: "Ambient Light"
      update_interval: 3s
      id: light_sens

    - platform: sgp30
      eco2:
        name: "eCO2"
        accuracy_decimals: 1
        id: eco2
      tvoc:
        name: "TVOC"
        accuracy_decimals: 1
        id: tvoc
      update_interval: 1s
      compensation:
         temperature_source: temp
         humidity_source: hum

    - platform: template
      name: "PM2.5 24h average"
      id: pm2_5_avg
      icon: mdi:chemical-weapon
      unit_of_measurement: µg/m³
      lambda: |-
        return id(pm2_5).state;
      update_interval: 60s
      filters:
        - sliding_window_moving_average:
            window_size: 1440
            send_every: 1

# This is a "helper" template sensor which is doing 30 sec moving average of PM2.5
# I use it for sensing in automations controlling purifiers (with Home Assistant),
# in order to remove the outlier values and making the control more smooth
    - platform: template
      name: "PM2.5 median"
      id: pm2_5_median
      icon: mdi:chemical-weapon
      unit_of_measurement: µg/m³
      lambda: |-
        return id(pm2_5).state;
      update_interval: 1s
      filters:
        - median:
            window_size: 30
            send_every: 30
            send_first_at: 15

light:
  - platform: esp32_rmt_led_strip
    chipset: ws2812
    num_leds: 3
    pin: GPIO16
    name: "RGB strip"
    id: rgb_led
    default_transition_length: 0s

switch:
  - platform: gpio
    name: "PMS7003_SET"
    pin:
      number: GPIO26
      mode: OUTPUT
    restore_mode: ALWAYS_ON
    id: pms_set

  - platform: template
    name: "CO2 Sensor Zero Calibration"
    turn_on_action:
      - mhz19.calibrate_zero: mh_sensor
      - switch.turn_off: co2_cal
    id: co2_cal

display:
  - platform: ssd1306_i2c
    model: "SSD1306 128x64"
    address: 0x3C
    brightness: 100%
    rotation: 180
    id: display1
    lambda: |-
      // enter lambda here

  - platform: ssd1306_i2c
    model: "SSD1306 64x48"
    address: 0x3D
    brightness: 100%
    rotation: 270
    id: display2
    lambda: |-
      // enter lambda here
```

Full YAML configuration: [iaq_board.yaml](https://github.com/nkitanov/iaq_board/blob/master/firmware/iaq_board.yaml)

Full documentation: [PCB, Schematic, esphome yaml config](https://github.com/nkitanov/iaq_board), [Video](https://www.youtube.com/embed/X75OGs2TTT8)

![image](./iaq_board1.jpg)
