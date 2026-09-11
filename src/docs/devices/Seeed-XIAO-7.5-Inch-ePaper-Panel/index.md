---
title: Seeed XIAO 7.5 Inch ePaper Panel
date-published: 2026-08-19
type: misc
standard: global
board: esp32
difficulty: 2
made-for-esphome: false
project-url: https://github.com/gbroeckling/esphome-devices/tree/main/e-ink-bw
---

![Seeed XIAO 7.5 inch ePaper Panel showing a system view with Home Assistant version, uptime, RSSI and alarm state](xiao-system-view.jpg "Seeed XIAO 7.5 Inch ePaper Panel")

## Description

The Seeed Studio XIAO 7.5" ePaper Panel is an 800&nbsp;×&nbsp;480 black and white e-paper display with a
socketed XIAO ESP32-C3 driving it. It is sold as a finished panel rather than a bare screen, so the driver
board, the panel connector and the battery circuit are already wired together.

- 7.5&nbsp;inch 800&nbsp;×&nbsp;480 monochrome e-paper, `7.50inv2` in ESPHome terms
- Socketed Seeed XIAO ESP32-C3 as the host microcontroller
- SPI on `GPIO8` (clock) and `GPIO10` (data), with CS `GPIO3`, DC `GPIO5`, reset `GPIO2` and busy `GPIO4`
- The busy line is active-low, so it needs `inverted: true`
- Onboard battery connector, intended for long refresh intervals rather than continuous operation

## Setup

1. Seat the XIAO ESP32-C3 in the socket and connect it over USB-C.
2. Create a device in ESPHome Device Builder and merge the hardware configuration
   below into it. The configuration here is the hardware layer only &mdash; your own
   `wifi:` credentials, `api:` and `ota:` come from the node configuration around it,
   which the Device Builder generates for you.
3. Flash over USB, then adopt the device in Home Assistant.

## Configuration

This is the hardware configuration. It brings the panel up and draws once at boot, which is enough to prove
the wiring and the panel model are right before you put a dashboard on it.

```yaml file=config.yaml
```

### Refresh e-paper deliberately, not on a timer

`update_interval` is set to `never` here on purpose. E-paper takes seconds to complete a full refresh and the
panel wears with every one, so redrawing on a fixed interval is the wrong default. Drive
`component.update` from whatever actually changed instead.

### Home Assistant dashboard

Add this on top of the hardware configuration for a clock and a couple of Home Assistant entities. It also
shows the debounce pattern worth copying: a `mode: restart` script with a short delay, so a burst of entity
updates collapses into one redraw rather than one redraw each.

```yaml file=home-assistant.yaml
```

## Notes

- **Put a timestamp on the screen.** E-paper keeps its last rendered image with no power at all, so a
  correct-looking panel proves nothing about whether the device behind it is still alive. A screen showing a
  five-day-old date looks exactly as healthy as a current one. The dashboard example stamps the render time
  for that reason — on e-paper that is a design requirement rather than a nicety.
- **Fonts need explicit glyph lists.** ESPHome's default glyph set does not include `@`, `~` or `&`. Any of
  those in your labels vanish silently rather than erroring.
- Fonts here are pulled from Google Fonts at compile time, so there is no dependency on a local `fonts/`
  directory.
