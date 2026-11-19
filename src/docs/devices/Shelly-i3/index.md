---
title: Shelly i3
date-published: 2021-01-28
type: sensor
standard: global
---

## Device Specific Config

```yaml
esphome:
  name: example-device
  friendly_name: Example Device
      
# OTA flashing
ota:
  - platform: esphome

wifi: # Your Wifi network details
  
# Enable fallback hotspot in case wifi connection fails  
  ap:

# Enabling the logging component
logger:

# Enable Home Assistant API
api:

# Enable the captive portal
captive_portal:

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO12
      mode: INPUT
    name: 'Switch 1'
    id: sensorid1
    filters:
      - delayed_on_off: 50ms
  - platform: gpio
    pin:
      number: GPIO13
      mode: INPUT
    name: 'Switch 2'
    id: sensorid2
    filters:
      - delayed_on_off: 50ms
  - platform: gpio
    pin:
      number: GPIO14
      mode: INPUT
    name: 'Switch 3'
    id: sensorid3
    filters:
      - delayed_on_off: 50ms
```
