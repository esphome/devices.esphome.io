---
title: Nerdiy's SelfIY Ring
date-published: 2025-01-27
type: light
standard: global
board: esp32
project-url: https://github.com/Nerdiyde/ESPHomeSnippets/blob/main/Snippets/selfIY_ring/nerdiys-selfiy-ring.yaml
made-for-esphome: true
difficulty: 1
---

## General Notes

Nerdiy's **SelfIY Ring** is a selfie ring that can be manufactured using a 3D printer.

In addition to the 3D-printed components, it is based on a **WS2812** (or similar) LED strip and a
**[Seeed Studio XIAO ESP32-S3](https://www.seeedstudio.com/XIAO-ESP32S3-p-5627.html)**. The SelfIY Ring is powered via a
**USB-C connection** and can be integrated and controlled through HomeAssistant thanks to the ESPHome-based firmware.
The color and brightness of the LEDs can be adjusted either through HomeAssistant or via the integrated web server.
Additionally, the brightness can be controlled using the two built-in sensor buttons.

The SelfIY Ring can be mounted on a **standard tripod thread (1/4″)**. Furthermore, cameras can also be attached to the
ring using a tripod thread (1/4″).

## Files for 3D print

More info and the housing STLs are available here:
[Nerdiy.de](https://nerdiy.de/produkt/selfiy-ring-bauteile-3d-druckbarer-selfie-ring-stl-dateien/)

## GPIO Pinout

| Pin    | Function             |
| ------ | -------------------- |
| GPIO07 | Touch Button "Plus"  |
| GPIO08 | Touch Button "Minus" |
| GPIO05 | LED-Strip            |

## Configuration

```yaml url=https://github.com/Nerdiyde/ESPHomeSnippets/blob/main/Snippets/selfIY_ring/nerdiys-selfiy-ring.yaml
```

## Dimensions

![Dimensions of Nerdiy's SelfIY Ring](https://github.com/user-attachments/assets/7f20643c-5917-4b85-baeb-477cd56573cc "Dimensions of Nerdiy's SelfIY Ring")

## Pictures

![Picture of Nerdiy's SelfIY Ring](https://github.com/user-attachments/assets/d72761bc-1bd8-4ec6-9727-7397421df8e5 "Picture of Nerdiy's SelfIY Ring")
![Picture of Nerdiy's SelfIY Ring](https://github.com/user-attachments/assets/62f4b4c0-85a3-4471-91cd-310581c0fece "Picture of Nerdiy's SelfIY Ring")
![Picture of Nerdiy's SelfIY Ring](https://github.com/user-attachments/assets/3e70e8e5-5687-4137-a344-1417c2f54e8b "Picture of Nerdiy's SelfIY Ring")
![Picture of Nerdiy's SelfIY Ring](https://github.com/user-attachments/assets/be768555-6cee-4f4e-8017-faa1e013143b "Picture of Nerdiy's SelfIY Ring")
![Picture of Nerdiy's SelfIY Ring](https://github.com/user-attachments/assets/d2696e70-967d-4435-b77c-75b85cf97fa6 "Picture of Nerdiy's SelfIY Ring")
![Picture of Nerdiy's SelfIY Ring](https://github.com/user-attachments/assets/35ae8ded-0420-402f-bbc3-332dfa3b72b7 "Picture of Nerdiy's SelfIY Ring")
![Picture of Nerdiy's SelfIY Ring](https://github.com/user-attachments/assets/29642802-ea2b-4a69-a193-226355fc1a3d "Picture of Nerdiy's SelfIY Ring")
![Picture of Nerdiy's SelfIY Ring](https://github.com/user-attachments/assets/652084c1-6081-4312-96c8-fd8d925f7486 "Picture of Nerdiy's SelfIY Ring")
![Picture of Nerdiy's SelfIY Ring](https://github.com/user-attachments/assets/4afa3017-47d0-4f40-9051-62f5193b9dd1 "Picture of Nerdiy's SelfIY Ring")
![Picture of Nerdiy's SelfIY Ring](https://github.com/user-attachments/assets/8db09341-7e1a-4247-ba48-4897c898ec66 "Picture of Nerdiy's SelfIY Ring")
