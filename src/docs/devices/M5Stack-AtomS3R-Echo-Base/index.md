---
title: M5Stack AtomS3R + Atomic Echo Base
date-published: 2026-08-12
type: misc
standard: global
board: esp32
difficulty: 2
made-for-esphome: false
project-url: https://github.com/gbroeckling/esphome-devices/tree/main/stack5echo-voice-assist
---

## Description

The M5Stack AtomS3R is a 24&nbsp;mm ESP32-S3 module that stacks onto M5Stack's Atomic bases. Seated on the
**Atomic Echo Base** it becomes a compact voice satellite that both hears and speaks from one board.

- ESP32-S3 with 8&nbsp;MB flash and 8&nbsp;MB octal PSRAM
- Atomic Echo Base carrying an ES8311 audio codec, an analog microphone and an NS4150B amplifier
- PI4IOE5V6408 GPIO expander on the base at I²C `0x43` — the amplifier enable line hangs off this, not off a
  native pin
- Two separate I²C buses: the AtomS3R's own peripherals on one, the Echo Base on the other
- LP5562 RGB LED and a BMI270 IMU on the AtomS3R itself
- Programmable button on `GPIO41`, USB-C for power and flashing

## Setup

1. Seat the AtomS3R on the Atomic Echo Base and connect it over USB-C.
2. Flash the configuration below.
3. Adopt the device in Home Assistant and add it to a voice assistant pipeline.

## Configuration

Hardware only — the two I²C buses, the GPIO expander, the I²S bus, the ES8311 codec, microphone, speaker and
media player. The ES8311 codec and the PI4IOE5V6408 expander are both supported natively, so this needs no
external components.

```yaml file=config.yaml
```

### Voice assistant

```yaml file=voice-assistant.yaml
```

## Notes

- **Build on ESPHome 2026.7.3 or newer.** The tflite runtime in some earlier releases cannot load current
  microWakeWord models. It fails at boot with `Failed to allocate tensors for the streaming model`, the wake
  engine stops, and nothing else reports a problem — the device connects, logs normally and answers the API, it
  simply never hears you. Older versions flash and run perfectly happily, which is what makes this easy to miss;
  mine sat in that state for months before I worked out what it was.
- **Don't put a Bluetooth tracker or proxy on this board alongside the voice assistant.** BLE scanning starves
  the audio pipeline. Removing it was half the fix when I was chasing the problem above.
- The amplifier is disabled at boot until the **Speaker Enable** switch is turned on, which is why the
  configuration sets `restore_mode: RESTORE_DEFAULT_ON`.
- The onboard RGB LED is an LP5562, which is not a core ESPHome component. If you want it, M5Stack publish one at
  `github://m5stack/esphome-yaml/components@main`. It is left out here so the configuration has no external
  dependencies.
- If you are reflashing a device that already carries a non-standard partition table, remember that OTA cannot
  rewrite one — a layout change needs a USB flash.
