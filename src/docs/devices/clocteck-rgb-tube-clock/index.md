---
title: ClocTeck RGB Tube Clock
date-published: 2026-09-13
type: light
standard: global
board: esp8266
difficulty: 4
alias:
  - title: ClocTeck Nixie Clock V4.1
    slug: ClocTeck-Nixie-Clock-V4-1
---

## Overview

The ClocTeck RGB Tube Clock is a desk clock with six "nixie-style" tubes made from
LED strips. The board inside is silkscreened `Nixie Clock V4.1` and
`Powered by: Oiostudio.com`. It runs an ESP8285.

Ten LEDs sit behind each digit, so all six tubes are one 60 LED WS2812 strip on a
single data pin. That gives you per digit colours and animations, which the stock
firmware does not expose.

Converting it means opening the case and attaching a USB-UART adapter to an
unlabelled 6-pad header. The USB-C port carries power
only.

Sold as the ClocTeck RGB Tube Clock, and the same board turns up under the
`Nixie Clock V4.1` name. The stock access point is called
`ClocTeck_<last 4 hex of the MAC>`.

## Why replace the stock firmware

Worth knowing before you connect it to your network:

- `GET /config` and `/wificonf` have no authentication and hand out the Wi-Fi
  passphrase in plain text to anything on the LAN.
- OTA is hardcoded to a bucket in China over plain HTTP, and the clock fetches its
  display code from there at runtime.
- The vendor firmware itself is built on the Arduino core for ESP8266.

Blocking the clock from the internet is worth doing whichever firmware you run.

## Product images

The board with the case open. The J1 programming header is the 6-pad row near the
top, the CR1220 coin cell in the middle is the RTC backup, and the silkscreen reads
`Nixie Clock V4.1` and `Powered by: Oiostudio.com`.

![ClocTeck Nixie Clock V4.1 board](NixieClockV4.1.jpg "Board with the case open")

The same board with the J1 pads labelled. Pin 1 is the square pad and is VBUS, which
you leave alone. The adapter connects to RX, TX and GND only.

![J1 pinout](NixieClockV4.1_PinLayout.jpg "J1 pinout")

## Hardware

| Item        | Detail                                                       |
| ----------- | ------------------------------------------------------------ |
| SoC         | ESP8285N08 (ESP8266 family), QFN-32, 1 MB internal flash      |
| Crystal     | 26 MHz                                                        |
| LEDs        | 60 WS2812, ten per digit, data on GPIO13                      |
| Buttons     | Mode, Time, Up, and Down                                      |
| Buzzer      | Active buzzer on GPIO15                                       |
| RTC         | None. Time comes from NTP, same as the stock firmware.        |
| Power       | USB-C, power only, no USB-UART chip on the board              |

### GPIO pinout

| GPIO     | Function              | Notes                                              |
| -------- | --------------------- | -------------------------------------------------- |
| GPIO13   | LED data, 60 WS2812   |                                                    |
| GPIO0    | Mode button           | Also the download mode strap                        |
| GPIO2    | Time button           |                                                    |
| GPIO16   | Up button             | Active low. No pull-up and no interrupts on ESP8266 |
| GPIO15   | Buzzer                | Active buzzer, driven high                          |
| GPIO1    | UART TX               | Used for flashing                                   |
| GPIO3    | UART RX               | Used for flashing                                   |
| unknown  | Down button           | Not identified, see below                           |

### LED index map

The strip runs right to left, and the numeral order inside a tube differs between
the hour tubes and the rest. To show digit `d`:

| LED block | Digit           | LED index          |
| --------- | --------------- | ------------------ |
| 0-9       | seconds ones    | `9 - d`            |
| 10-19     | seconds tens    | `9 - d`            |
| 20-29     | minutes ones    | `9 - d`            |
| 30-39     | minutes tens    | `9 - d`            |
| 40-49     | hours tens      | `d`                |
| 50-59     | hours ones      | `d`                |

Getting this backwards shows `08` where `19` should be. Measured on hardware.

### Programming header J1

Six unlabelled pads. Pin 1 is the square one, and the `J1` silkscreen sits below
the row.

| Pin | Shape  | Measured | Signal                        |
| --- | ------ | -------- | ----------------------------- |
| 1   | square | 5.22 V   | VBUS, do not connect          |
| 2   | round  | 3.2 V    | RX, GPIO3                     |
| 3   | round  | 3.6 V    | TX, GPIO1                     |
| 4   | round  | 3.6 V    | not UART                      |
| 5   | round  | ~3 V     | RST / EN                      |
| 6   | round  | 0 V      | GND, connect this one first   |

A 3.2 V reading does not mean a pin is 3V3. Pin 2 reads 3.2 V and is actually RX
held high by a pull-up. A multimeter cannot tell a supply rail from an idle UART
input, since both sit at about 3.3 V. Only an esptool sync settles it.

## Flashing

Wire a CH340 or CP2102 adapter, jumpered to 3.3 V. The I/O rail measures 3.6 V,
which is the ESP8266 absolute maximum, so do not use the 5 V setting.

```text
adapter GND -> J1 pin 6   (connect first)
adapter RX  -> J1 pin 3   (TX)
adapter TX  -> J1 pin 2   (RX)
```

Power the clock from its own USB-C. Do not feed 3V3 back into the board.

### Enter download mode without a wire

Hold the Mode button while you plug in the USB-C power. Mode is GPIO0, which is the
download strap. The tubes show `00 00 00` once you are in the bootloader.

The flip side is that holding Mode at power-on stops the clock from starting. That
is expected, not a fault.

### Back up first

The stock firmware is MAC bound, so a dump from someone else will not restore your
unit. Your own dump is the only way back.

```bash
python -m esptool --port COM3 --before no-reset --after no-reset -b 74880 \
  read_flash 0x0 0x100000 clocteck-stock-1MB.bin
python -m esptool --port COM3 --before no-reset --after no-reset -b 74880 \
  verify-flash 0x0 clocteck-stock-1MB.bin
```

### Flash it

```bash
python -m esptool --port COM3 --before no-reset --after no-reset -b 74880 \
  write_flash 0x0 clocteck-factory.bin
```

`--before no-reset --after no-reset` stops esptool toggling DTR and RTS, which would
knock the chip back out of download mode. 74880 is the rate that proved reliable on
this chip.

After flashing, remove the Mode jumper and power cycle normally. The clock boots a
`ClocTeck-Setup` hotspot. Join it, pick your network, and it shows up in Home
Assistant.

## Configuration

This is the hardware manifest. Add your own `wifi`, `api` and `ota` sections the way
you normally would, or build it in the ESPHome Device Builder.

```yaml file=config.yaml
```

## Features

| Control | Type | Notes |
|---|---|---|
| Display | switch | display on/off |
| Effect | select | 7 effects: Clock, Rainbow sweep, Fire, Breathe, Sunset, Colour (sliders), Alarm red |
| Brightness | number | 10–100 % |
| Colour R / G / B | numbers | the colour used by the two "Colour" effects |
| Next Effect | button | cycle effects |
| Mode / Time / Up | buttons on the case | next effect · back to Clock · brightness +10 % |
| Buzzer | switch | buzzer on/off |
| Restart | button | reboot |

## Notes if you build on this

- In `addressable_set`, `range_to` is **inclusive**. One LED is
  `range_from: N, range_to: N`.
- Colour lambdas must return **0 to 1**. Returning 0 to 255 logs
  `Lambda for parameter red ... should return values in range 0-1` and scales the
  output wrong.
- `Color(r, g, b)` takes **0 to 255**, so `Color(1.0f, 0.25f, 0.0f)` is
  essentially **black**. Use `ESPHSVColor::to_rgb()` when you want a real colour.
- `gamma_correct` defaults to **2.8** and applies to the light's own brightness
  rather than to `color_brightness`. Pinning the light at 100 percent and dimming
  with `color_brightness` keeps the full range available.
- `esp8266_uart` and `esp8266_dma` only work on **GPIO2**. The data pin here is
  GPIO13, so **`bit_bang` is required** — there is no DMA path on this pin.

### Compute the frame once, not per tube

The obvious way to write this is one `addressable_set` per tube, each with three
`!lambda` blocks. That duplicates the whole mode switch **18 times** (6 tubes x
RGB) when only the LED block differs, and produces a ~47 KB, 1178-line config.

Instead the config fills array globals once per frame and the per-tube blocks just
read their slot. ESPHome passes a `globals` `type` straight through to C++, so
arrays work:

```yaml
globals:
  - id: idx_of
    type: int[6]
    restore_value: false
    initial_value: '{0,0,0,0,0,0}'
  - id: r_of
    type: float[6]
    restore_value: false
    initial_value: '{0,0,0,0,0,0}'
```

```yaml
      # one lambda computes all six tubes
      - lambda: |-
          {
            const int dig[6] = {
              id(cur_s) % 10, id(cur_s) / 10,
              id(cur_m) % 10, id(cur_m) / 10,
              id(cur_h) / 10, id(cur_h) % 10
            };
            const int blk[6]     = { 0, 10, 20, 30, 40, 50 };
            const bool invert[6] = { true, true, true, true, false, false };
            for (int i = 0; i < 6; i++) {
              id(idx_of)[i] = blk[i] + (invert[i] ? (9 - dig[i]) : dig[i]);
              /* ...mode maths using i... */
              id(r_of)[i] = r; id(g_of)[i] = g; id(b_of)[i] = b;
            }
          }

      # each tube then just reads its slot
      - light.addressable_set:
          id: tubes
          range_from: !lambda 'return id(idx_of)[2];'
          range_to:   !lambda 'return id(idx_of)[2];'
          color_brightness: !lambda 'return id(display_on) ? id(bright_pct) / 100.0f : 0.0f;'
          red:   !lambda 'return id(r_of)[2];'
          green: !lambda 'return id(g_of)[2];'
          blue:  !lambda 'return id(b_of)[2];'
```

That is **71 percent smaller** (47 KB to 13 KB, 1178 to 363 lines) with the mode
logic in one place. A lambda must be its own list item — putting the compute block
inside the preceding `addressable_set` mapping corrupts the YAML.

### Effects use palettes

| # | Effect | Source | Motion |
| --- | --- | --- | --- |
| 0 | Clock | fixed colours | static, nixie orange + teal seconds |
| 1 | Rainbow sweep | `RainbowColors_gc22` (16 stops) | the band travels left, 24 s loop |
| 2 | Fire | your slider colour | per-tube random crackle over a slow swell |
| 3 | Breathe | your slider colour | 10 s raised-cosine pulse |
| 4 | Sunset | `Sunset_Real_gp` (7 stops) | per-tube offset, slow |
| 5 | Colour (sliders) | user R/G/B | steady |
| 6 | Alarm red | - | static red, Home Assistant only |

### The frame rate: keep it at 1 Hz

NeoPixelBus' `bit_bang` method wraps every strip send in `noInterrupts()` /
`interrupts()`. One 60-LED WS2812 frame is 1440 bits x 1.65 us ~= **2.4 ms with
every interrupt disabled**. That budget is the whole story:

| Rate | Interrupts blocked | Spare frames per second | Result |
| --- | --- | --- | --- |
| **1 Hz** | ~2.4 ms/s | 0 | **in use** — 624 s, 0 skips |
| 2 Hz | ~4.8 ms/s | 1 | the fallback if skips return |
| 3 Hz | ~7 ms/s | 2 | safe, but no visual gain |
| 10 Hz | ~24 ms/s | 9 | **hardware watchdog reboot**, `wDev_ProcessFiq` |

**The rate does not make the effects smoother.** They are driven by `ts` (seconds
since midnight), not by the frame counter, so at 3 Hz three of every four frames are
byte-identical to the previous one. The extra budget buys the same picture.

There is a second consideration: **a frame rate of exactly 1 Hz has no redundancy.** A
late frame means that second is never drawn, and the display can skip a number (44,
then 46). That is why the time read and the render must live in **one** interval — two
independent 1 s timers drift apart and cause exactly this. With them merged, 1 Hz has
rendered 624 consecutive seconds with zero skips.

If skipping ever returns, **2 Hz (500 ms)** is the insurance: ~4.8 ms/s, about a fifth
of the 24 ms/s that breaks the device, with a spare frame per second. It costs twice
the interrupt budget, so it is not the default.

If the motion itself ever looks too coarse, the lever is the effects' own cycle
lengths, never the frame rate.

### Drive animations in seconds, not milliseconds

The renderer runs once per second, so any animation must complete its visible cycle
in whole seconds or it aliases into visible jitter. The original effects used
millisecond periods (`sinf(ms / 830.0f)`) that were *shorter than one frame*, which
is why they looked wrong:

| Effect | Old | Problem |
| --- | --- | --- |
| Fire | `sin(ms/2600)` + `sin(ms/830)` | 830 ms period < 1 frame — aliases badly |
| Breathe | `sin(ms/900)` | 900 ms period < 1 frame — aliases |
| Colour fade (now Sunset) | `sin(ms/2400)` | 2.4 s period, only 2-3 frames per cycle |

All of them are now driven by `ts` (seconds since midnight), which is stable at any
render rate. Anything that animates per-LED should use a similar
seconds-based index, e.g. `(ts * RATE + i * OFFSET) % 256` into a palette.

### Do not push the strip too often

`bit_bang` wraps every frame in `noInterrupts()` / `interrupts()`. A 60-LED WS2812
frame is 1440 bits at 1.65 us, so **each push holds every interrupt off for about
2.4 ms**:

| Render rate | Interrupts off per second |
| ----------- | ------------------------- |
| 10 Hz | ~24 ms |
| 3 Hz | ~7 ms |
| **1 Hz** | **~2.4 ms** |

On this ESP8266, pushing at 10 Hz starved the Wi-Fi driver until the hardware
watchdog fired:

```text
[E][esp8266:171]: *** CRASH DETECTED ON PREVIOUS BOOT ***
[E][esp8266:186]:   Reason: Hardware WDT - Level1Int (exccause=4)
[E][esp8266:191]:   PC: 0x40103525
WARNING Decoded 0x40103525: wDev_ProcessFiq
```

At **1 Hz** the same hardware has run for multiple days without a reset. A nixie
clock does not need a high frame rate, so 1 Hz is the shipped setting. Anything
that blocks the Wi-Fi "sys" context for too long can trigger this — the watchdog
reports the fault at `wDev_ProcessFiq` because that is where the blocked context
was.

`wifi: power_save_mode: none` is also set, since modem sleep is a known
co-trigger.

## Known issues

- The Down button does not work. It is not on any externally reachable GPIO. Every
  remaining pin was scanned with both pull-up and inverted binding on a clean high
  baseline and no press produced an edge. The likely answer is that Down shares the
  Up pin through a resistor divider and the stock firmware reads it as a voltage
  rather than as a logic level. The stock application image never touches the ADC,
  which points at the ADC read living in the display code it downloads at runtime.
  Down's original jobs were brightness down and the 12/24 hour toggle, and the
  brightness slider and Up button cover both.
- No RTC, so after a power cut the clock cannot know the time until it reaches
  Wi-Fi. The stock firmware has the same limitation.
- The buzzer is on GPIO15, which is also a boot strap. It needs
  `restore_mode: ALWAYS_OFF`.

## Needed work

- **A flashable image that can be installed *without* a USB-UART adapter would be a
  big win.** Every unit is flashed at the factory over the 6-pad J1 header, and the
  USB-C port carries power only, so today the conversion needs soldering or pogo
  pins. Since the stock firmware has an **unauthenticated plain-HTTP OTA endpoint**,
  it may be possible to build an image that the **stock firmware itself will accept
  over OTA** — letting people convert with only a browser. Contributions very
  welcome.
- **Identifying the `Down` button.** If you have a scope, the useful measurement is
  the voltage on the Up pin while pressing Up vs Down; a distinct non-zero reading
  would confirm a resistor divider and allow an ADC threshold.
