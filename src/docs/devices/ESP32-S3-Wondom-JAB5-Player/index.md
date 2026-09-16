---
title: ESP32-S3 + Wondom JAB5 Sendspin Network Audio Player
date-published: 2026-08-26
type: misc
standard: global
board: esp32
---

This project combines an ESP32-S3-N16R8 development board with a Wondom JAB5 amplifier to create a network audio
player. ESPHome receives synchronized audio through Sendspin and sends it to the JAB5's ADAU1701 over I²S.

The configuration was validated with 48 kHz stereo audio using Philips I²S, 32-bit physical slots, and an MCLK
multiple of 256. The ADAU1701 uses up to 24 significant audio bits in each 32-bit slot. The included Sendspin
pipeline produces 16-bit PCM, which ESPHome expands and left-aligns in the 32-bit slots.

## Required hardware

- ESP32-S3-DevKitC-1-compatible N16R8 development board with 16 MB flash and 8 MB octal PSRAM
- Wondom JAB5 amplifier board with ADAU1701 and the J6 and J15 connectors described below
- Power supply suitable for the JAB5, connected to its J15 power input
- Five signal wires for MCLK, BCLK, LRCLK, DATA1, and ground
- Speakers suitable for the amplifier and power supply

The exact PCB revision of the tested JAB5 was not recorded. The pinout below was validated only on the unit whose
connectors are labelled J6 and J15 as described. Before wiring another unit, identify its PCB revision and compare the
connector labels with the documentation supplied with the board or available from the
[Wondom official shop](https://store.sure-electronics.com/).

## Wiring

| ESP32-S3 | JAB5 J6 | Function             |
| -------- | ------- | -------------------- |
| GPIO10   | MCLK    | Master clock         |
| GPIO11   | BCLK    | Bit clock            |
| GPIO13   | LRCLK   | Left/right clock     |
| GPIO12   | DATA1   | I²S audio data       |
| GND      | GND     | Common signal ground |

Set the JAB5 SW1 switch to `S` (Slave), so the ESP32-S3 supplies the I²S clocks.

> [!CAUTION]
> Check the documentation for your JAB5 revision before selecting its J15 supply or speakers. Power the ESP32-S3
> separately through its own USB or supported power input, and power the JAB5 through J15. Leave the `+5V` pin on J6
> disconnected; only the signal ground is shared between the boards. Disconnect power before changing wiring, and do
> not connect speakers or power wiring while the amplifier is energized. Set the amplifier volume low before the first
> power-on and playback test.

The diagnostic test started the ESP32-S3 I²S clocks before power-cycling only the JAB5. If the first playback is silent,
leave the ESP32-S3 running and power-cycle the JAB5 so that it starts while the clocks are present.

## I²S format

| Setting | Value |
| ------- | ----- |
| Sample rate | 48 kHz |
| Channels | Stereo |
| Communication format | Philips I²S |
| Physical slot width | 32 bits |
| Significant receiver resolution | Up to 24 bits |
| MCLK | 12.288 MHz (256 × sample rate) |
| BCLK | 3.072 MHz (64 × sample rate) |

With `expand_to_slot_width: true`, a 16-bit sample such as `0x1234` is transmitted in a 32-bit slot as
`0x12340000`. A 24-bit sample such as `0x123456` is transmitted as `0x12345600`.

## Configuration

> [!IMPORTANT]
> This device entry depends on [esphome/esphome#18806](https://github.com/esphome/esphome/pull/18806). Until that PR
> is included in an ESPHome release, this draft requires an ESPHome 2026.9 development build and `config.yaml` pins
> the exact external component commit validated on the hardware. Remove the `external_components` block and set
> `min_version` to the first release containing the feature before publishing this entry.

For draft review, both YAML files were schema-validated with the ESPHome CLI checked out at commit
`618e26c2be6137c01addc2488451f82ec0bac677`, the same commit pinned by `external_components`. The audio output was also
validated on the physical assembly using that PR.

The base configuration defines the ESP32-S3, PSRAM, I²S bus, and physical JAB5 output. Add the normal network, API,
OTA, and fallback access point configuration when adopting it in your own ESPHome device.

```yaml file=config.yaml
```

### Sendspin player

The optional configuration below imports the base hardware configuration and adds the mixer, resampler, Sendspin
source, and media players. It declares ESPHome's transport-neutral `network` component to satisfy Sendspin's dependency;
add your own Wi-Fi or Ethernet configuration before using it:

```yaml file=sendspin.yaml
```

The mixer keeps a reserved second input because it requires two sources; the active input converts negotiated Sendspin
audio to the stereo stream expected by the JAB5. The configuration leaves `fixed_delay` at its default of zero because
the amplifier delay was not measured. Calibrate `initial_static_delay` empirically for your installation.

A [Sendspin](https://esphome.io/components/sendspin/) server must be available on the same network. Allow mDNS traffic
and TCP port 8928 between the device and server. The Sendspin protocol and ESPHome component are experimental and may
receive breaking changes in future releases.
