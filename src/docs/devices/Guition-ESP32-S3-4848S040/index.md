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

Avalible on [AliExpress](https://www.aliexpress.com/item/3256806115962222.html) at various vendors. Can be purchased
with or without the relay module, which does not fit into a standard EU round 60mm box.

![Connector pinout](./guition-esp32-s3-4848s040-connector.jpg "Connector pinout")

## Basic Config

```yaml file=config.yaml
```

## Example configuration: Alarmo alarm keypad

An LVGL touch keypad for the [Alarmo](https://github.com/nielsfaber/alarmo)
custom integration: code entry, arm home / arm away / disarm, and a live
colour-coded armed-state readout.

Add your own `api:`, `ota:` and `wifi:` blocks after adopting, and point the
`alarm_entity` substitution at your Alarmo `alarm_control_panel` entity.

```yaml file=alarmo-keypad.yaml

```

### Build note: check OTA before you mount it

Some of these panels ship with firmware whose `ota:` block is empty, which means
no working OTA at all - port 3232 simply refuses connections and the only way to
update is a physical USB flash. Two of mine were in this state. Confirm port 3232
answers before you put the panel in a wall box, and always flash a real `ota:`
block with a password. After one USB flash to a config with proper OTA, the panel
updates wirelessly from then on.

