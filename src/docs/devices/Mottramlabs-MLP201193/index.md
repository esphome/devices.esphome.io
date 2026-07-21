---
title: MottramLabs MLP201193 ESP32 4-Channel Mains Power Sensor
date-published: 2026-07-18
type: sensor
standard: uk
board: esp32
project-url: https://github.com/Mottramlabs/4-Channel-Mains-Current-Sensor
difficulty: 4
made-for-esphome: false
---

![MLP201193](mottramlabs-mlp201193.jpg "MottramLabs MLP201193 ESP32 4-Channel Mains Power Sensor")

A 4-channel mains power sensor board using an ESP32
(NodeMCU 38-Pin ESP32) from
[MottramLabs](https://www.mottramlabs.com/ct_products.html).

- [Product page](https://www.mottramlabs.com/ct_products.html)
  (last item on the page)
- [Schematic (V2)](https://www.mottramlabs.com/pdf/SCH201193.pdf)
- [eBay listing](https://www.ebay.co.uk/itm/134575710584)

## Hardware

- **MCU:** ESP32-WROOM-32 (rev 3.1, dual-core, 4MB flash)
- **USB bridge:** CP2102
- **ADC channels:** All on ADC1 (WiFi-compatible, input-only GPIOs)

### GPIO Mapping (from SCH201193 V2)

| Channel | Jack | GPIO | ADC Channel |
|---------|------|------|-------------|
| CH1     | J1   | GPIO34 (D34) | ADC1_CH6 |
| CH2     | J2   | GPIO35 (D35) | ADC1_CH7 |
| CH3     | J3   | GPIO36 (D36) | ADC1_CH0 |
| CH4     | J4   | GPIO39 (D39) | ADC1_CH3 |

**Note:** GPIO34/35/36/39 are input-only pins with no internal
pull-up/pull-down. This is fine for ADC use.

### CT Clamp Selection

The board has solder jumpers to select between:

- **mA (current-type) CT clamps** — e.g. SCT-013-000 (100A/50mA)
  with onboard burden resistor
- **1V (voltage-type) CT clamps** — e.g. SCT-013-030 (100A/1V)
  with burden resistor bypassed

Ensure the jumpers match your CT clamp type before use.

## Calibration

The `calibrate_linear` filter maps raw ADC voltage to actual
current (Amps). You need at least two datapoints: one for zero
(idle) and one for a known load.

1. Connect a known load (e.g. a kettle, heater) and measure
   actual current with a multimeter.
2. Update the `calibrate_linear` datapoints in the config.
3. Adjust the voltage multiplier (`240`) in the `on_value` lambda
   if your mains voltage differs (e.g. `120` for US).

The `max(x, 0.0f)` lambda prevents negative readings from noise.

## Configuration

```yaml file=config.yaml
```

### Power and Energy Sensors (optional)

This additional configuration adds power (Watts) and daily energy
(kWh) sensors derived from the CT clamp current readings. The
power calculation uses `Amps x 240V` for UK mains. Adjust the
voltage multiplier for your region.

```yaml file=power.yaml
```
