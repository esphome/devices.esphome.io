---
title: "Nous A6T"
date-published: 2026-06-09
type: plug
standard: eu
board: esp32
---

<!-- Describe the device here. See the front-matter table on the contributing page for valid options. -->

## GPIO Pinout

[see pinout](https://nous.technology/product/manual?slug=a6t&alias=EN+-+User+Manual)

## Partitioning Caveat

You may need to repartition your device after conversion to ESPhome to regain OTA capability.

For this to work **YOU MUST INCLUDE THE `allow_partition_access` option in the `ota:` block**.

- See [Updating the partition table](https://esphome.io/components/ota/esphome/#updating-the-partition-table-on-esp32).
- Follow the [tasmota migration guide](https://esphome.io/guides/migrate_sonoff_tasmota/).

Note: The required `ota:` block is not part of the basic configuration below.
Refer to the documentation above when adding it.

## Basic Configuration

This configuration is adopted from the Nous A1T and A8T device examples, with updates for esp32 and adjusted GPIOs.

```yaml file=config.yaml
```
