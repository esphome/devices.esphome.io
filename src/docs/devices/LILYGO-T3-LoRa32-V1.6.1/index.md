---
title: LILYGO T3 LoRa32 V1.6.1
date-published: 2025-11-17
type: misc
standard: Global
board: esp32
---

![LILYGO T3 LoRa32 V1.6.1](lilygo-t3-lora32-v1-6-1.webp "LILYGO T3 LoRa32 V1.6.1")

Model reference: T3 LoRa32 V1.6.1

Manufacturer: [LILYGO](https://lilygo.cc/)

## Product Description

The LILYGO T3 LoRa32 V1.6.1 is a development board featuring an ESP32 microcontroller with integrated
WiFi, Bluetooth, and a Semtech SX1276/SX1278 LoRa radio transceiver. It includes a 0.96″ OLED display and is
designed for IoT applications requiring long-range wireless communication.

### Key Features

- [ESP32](https://esphome.io/components/esp32/#esp32)
dual-core 240MHz processor
- 4 MB Flash memory
- [SX1276 (868/915/923 MHz) / SX1278 (433 MHz)](https://esphome.io/components/packet_transport/sx127x)
LoRa radio (+14 dBm TX, 9.9 mA RX)
- [SSD1306](https://esphome.io/components/display/ssd1306/#over-ic)
128x64 0.96″ OLED display
- LEDs:
  - 🔴 Red: USB power
  - 🟢 Green: GPIO-controlled
  - 🔵 Blue: Battery is charging or missing
- LiPo battery connector with TP4054 charging circuit
- CP2104 or CH9102 USB-to-UART bridge
- Micro-USB connector
- microSD card slot
- WiFi 802.11 b/g/n
- Bluetooth Classic and BLE
- Battery switch
- Reset button

## GPIO Pinout

### SX127x radio

| Function | GPIO   |
|----------|--------|
| SPI CLK  | GPIO5  |
| SPI MOSI | GPIO27 |
| SPI MISO | GPIO19 |
| CS       | GPIO18 |
| RST      | GPIO23 |
| DIO0     | GPIO26 |
| DIO1     | GPIO33 |
| DIO2     | GPIO32 |

### OLED display

| Function | GPIO   |
|----------|--------|
| SDA      | GPIO21 |
| SCL      | GPIO22 |

### microSD card slot

| Function | GPIO   |
|----------|--------|
| CS       | GPIO13 |
| MOSI     | GPIO15 |
| MISO     | GPIO2  |
| CLK      | GPIO14 |

### Other

| Function    | GPIO   |
|-------------|--------|
| Battery ADC | GPIO35 |
| Green LED   | GPIO25 |

## Basic Configuration

```yaml file=config.yaml
```

## LoRa Modulation

```yaml file=lora.yaml
```

## FSK Modulation

In packet mode:

```yaml file=fsk.yaml
```

## OOK Modulation with Remote Transmitter/Receiver

In continuous mode using the remote transmitter and receiver components:

```yaml file=ook.yaml
```

## OLED Display

```yaml file=oled.yaml
```

## Battery Monitoring

LiPo battery voltage:

```yaml file=battery.yaml
```

## Status LED

Green LED flashes when ESPHome API disconnected, plus on/off control:

```yaml file=led_status.yaml
```

or just dimmable control:

```yaml file=led_monochromatic.yaml
```

## Links

- [Product Page](https://lilygo.cc/products/lora3)
- [GitHub Repository](https://github.com/Xinyuan-LilyGO/LilyGo-LoRa-Series)
- [Schematic](https://github.com/Xinyuan-LilyGO/LilyGo-LoRa-Series/blob/master/schematic/T3_V1.6.1.pdf)
- [Wiki](https://wiki.lilygo.cc/products/t3-series/t3-lora32)
