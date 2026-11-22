---
title: Guition ESP32-S3-4848S040 480*480 Smart Screen
date-published: 2024-06-04
type: misc
standard: global
board: esp32
difficulty: 2
---

![Product image](./guition-esp32-s3-4848s040.jpg "Product image")

## Product specs

| Feature      | Spec                    |
| ------------ | ----------------------- |
| Screen       | st7701s driver 480\*480 |
| Touch screen | gt911                   |
| CPU          | ESP32-S3                |
| Flash        | 16MB                    |
| PSRAM        | 8MB                     |

## Product description

Avalible on [AliExpress](https://www.aliexpress.com/item/1005008214679682.html) at various vendors. Can be purchased
with or without the relay module, which does not fit into a standard EU round 60mm box.

[Documentation .zip](http://pan.jczn1688.com/directlink/1/ESP32%20module/4.0inch_ESP32-4848S040.zip)
(schematics in `5-IO pin distribution`)

![Connector pinout](./guition-esp32-s3-4848s040-connector.jpg "Connector pinout")

## Basic Config

```yaml file=config.yaml
```

## Disable display backlight during OTA update

The display flickers during the OTA update. To prevent this, you can turn off the backlight during the OTA update.

```yaml inline
ota:
  - platform: esphome
    # ...
    on_begin:
      then:
        - light.turn_off:
            id: id_display_backlight
            transition_length: 0s
        - lambda: id(id_display_backlight).loop();

light:
  - platform: monochromatic
    # ...
    restore_mode: ALWAYS_ON
```
