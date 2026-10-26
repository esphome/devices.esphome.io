---
title: Shelly 2 PM Gen3
date-published: 2025-09-30
type: relay
standard: uk, us, eu
board: esp32
made-for-esphome: False
difficulty: 2
---

Generation 3 of Shelly 2. With Powermeter. \
Generation 3 configurations are not compatible with earlier Shelly 2 generation hardware. \
General hardware info, including serial pinout is on the
[Shelly Knowledgebase](https://kb.shelly.cloud/knowledge-base/shelly-2pm-gen3).

## GPIO Pinout

| Pin    | Function     |
| ------ | ------------ |
| GPIO0  | ASE7953 RST  |
| GPIO1  | ADE7953 IRQ  |
| GPIO2  | LedLink_i    |
| GPIO3  | Relay 1      |
| GPIO4  | ADC Temp     |
| GPIO5  | Relay 2      |
| GPIO6  | I2C SDA      |
| GPIO7  | I2C SCL      |
| GPIO10 | Switch 1     |
| GPIO18 | Switch 2     |
| GPIO19 | Reset Button |

![Shelly 2 PM Gen3](../Shelly-2-PM-Gen3/shelly_2_pm_gen3_pcb.jpeg "Shelly 2 PM Gen3")

## Flashing

No need to crack the case open. Shelly's own OTA updater will install ESPHome straight over the
network — confirmed on two deployed 2 PM Gen3 units, no UART touched. Use
[free-shelly-ota](https://github.com/oxynatOr/free-shelly-ota) to build and push the image, it
handles the signature/checksum repackaging. OTA upgrades after that (ESPHome Web or
`esphome upload`) work fine, same as any ESPHome device.

## Basic Configuration

This will appear in Home Assistant as two relays linked to the switch inputs. This includes power and temperature
monitoring of the I2C interfaces. Add your own `api:` and `ota:` sections before flashing, and fill in `wifi:` with
your own network credentials — the example below leaves those out so it can be merged into your own setup.

Most of this configuration was taken from [this Home Assistant Community thread][1], and the work to figure out the GPIO
pins is thanks to [the Tasmota community.][2]

[1]: https://community.home-assistant.io/t/do-you-have-a-working-esphome-config-for-shelly-3gen-2pm/833575/3
[2]: https://github.com/arendst/Tasmota/discussions/22526#discussioncomment-11407244

```yaml file=config.yaml
```

Add a captive portal on top if you want one for initial WiFi setup — not required, just convenient:

```yaml file=captive-portal.yaml
```
