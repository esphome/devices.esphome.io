---
title: NX-SP201
date-published: 2020-07-06
type: plug
standard: us
board: esp8266
---

Dual outlet, dual relay socket with single channel power monitoring. Flashable via tuya-convert.

Multiple versions of this socket exist. The module the 'blue ESP' pinout came from was
[purchased from this Amazon link](https://www.amazon.com/dp/B074YGV2NK),
but no guarantees that one purchased from that link is the same.
Even more versions of the NX-SP201 outlet also exist, based on pinouts listed on other sites.

Flashing the wrong pinout can brick the device! Enabling GPIO9 bricked the 'blue ESP' version of the plug (though GPIO10
also gave a warning, but did not brick the device). Though it is recoverable with UART/GPIO0 flashing, desoldering the
module to access the ESP module's pins can damage it. Only enable pins that give the 'pin might already be used by the
flash interface' warning (GPIO6-11) once you're sure that's the correct pin.

## GPIO Pinout

| Pin (Blue ESP)    | Pin (Green ESP) | Function   |
| ----------------- | --------------- | ---------- |
| GPIO0             | GPIO9           | Blue LED   |
| GPIO3             | GPIO2           | HLW Select |
| GPIO4 (inverted)  | GPIO14          | Button 1   |
| GPIO5             | GPIO4           | HLW CF     |
| GPIO12            | GPIO10          | Relay 1    |
| GPI013 (inverted) | GPIO12          | Button 2   |
| GPI014            | GPIO5           | HLW CF1    |
| GPI015            | GPIO13          | Relay 2    |

## Pictures

![alt text](./IMG_0642.JPG "Closed Front View")
![alt text](./IMG_0643.JPG "Opened Full View")
![alt text](./IMG_0644.JPG "Opened Top 8266 Chip")
![alt text](./IMG_0645.JPG "Opened Bottom 8266 Chip")
![alt text](./nx-sp201-blue.jpg "Opened, Blue ESP module")

## Basic Configuration

```yaml
substitutions:
  # Higher value gives lower watt readout
  current_res: "0.002452"
  # Lower value gives lower voltage readout
  voltage_div: "814"
  device_name: nx-sp201
  friendly_name: Dilisens Outlet
  relay1_name: Outlet 1
  relay2_name: Outlet 2

# Basic Config
esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m

# Enter you WIFI credentials
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

# Enable Logging.
logger:

# Enable Home Assistant API.
api:

# Enable over-the-air updates.
ota:

# Enable WEB server for status and updates.
web_server:
  port: 80

captive_portal:

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO14
      inverted: False
    internal: false # set to true to hide from hub
    name: "${friendly_name} Button 1"
    on_press:
      - switch.toggle: relay1

  - platform: gpio
    pin:
      number: GPIO12
      inverted: False
    internal: false # set to true to hide from hub
    name: "${friendly_name} Button 2"
    on_press:
      - switch.toggle: relay2

# Status LED for blue light
# Enabling GPIO9 can brick certain versions of this plug!
#status_led:
#    pin:
#      number: GPIO09
#      inverted: true

switch:
  # Main relays
  - platform: gpio
    name: ${relay1_name}
    id: relay1
    pin: GPIO10

  - platform: gpio
    name: ${relay2_name}
    id: relay2
    pin: GPIO13

sensor:
  # Energy Monitoring
  - platform: hlw8012
    sel_pin:
      number: GPIO02
      inverted: True
    cf_pin: GPIO04
    cf1_pin: GPIO05
    #current_resistor: ${current_res}
    voltage_divider: ${voltage_div}
    change_mode_every: 3
    update_interval: 3s
    current:
      name: "${device_name}_amperage"
      unit_of_measurement: A
      accuracy_decimals: 3
      filters:
        - calibrate_linear:
            - 0.000 -> 0.0
            - 5.069 -> 6.69
        # Make everything below 0.01A appear as just 0A.
        # Furthermore it corrects 0.013A for the power usage of the plug.
        - lambda: if (x < (0.01 - 0.013)) return 0; else return (x - 0.013);
    voltage:
      name: "${device_name}_voltage"
      unit_of_measurement: V
      accuracy_decimals: 1
    power:
      name: "${device_name}_wattage"
      unit_of_measurement: W
      id: "${device_name}_wattage"
      accuracy_decimals: 0
```

## Split Configuration

If you have multiple of these sockets (some come in packs), you may want to keep the shared code in one file and only
put device specific information in files for each relay.

nx-sp201-common.yaml:

```yaml
# Basic Config
esphome:
  name: ${device_name}

esp8266:
  board: esp01_1m

# Enter you WIFI credentials
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

# Enable Logging.
logger:

# Enable Home Assistant API.
api:

# Enable over-the-air updates.
ota:

# Enable WEB server for status and updates.
web_server:
  port: 80

captive_portal:

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO14
      inverted: False
    internal: false # set to true to hide from hub
    name: "${friendly_name} Button 1"
    on_press:
      - switch.toggle: relay1

  - platform: gpio
    pin:
      number: GPIO12
      inverted: False
    internal: false # set to true to hide from hub
    name: "${friendly_name} Button 2"
    on_press:
      - switch.toggle: relay2

# Status LED for blue light
# Enabling GPIO9 can brick certain versions of this plug!
#status_led:
#    pin:
#      number: GPIO09
#      inverted: true

switch:
  # Main relays
  - platform: gpio
    name: ${relay1_name}
    id: relay1
    pin: GPIO10

  - platform: gpio
    name: ${relay2_name}
    id: relay2
    pin: GPIO13

sensor:
  # Energy Monitoring
  - platform: hlw8012
    sel_pin:
      number: GPIO02
      inverted: True
    cf_pin: GPIO04
    cf1_pin: GPIO05
    #current_resistor: ${current_res}
    voltage_divider: ${voltage_div}
    change_mode_every: 3
    update_interval: 3s
    current:
      name: "${device_name}_amperage"
      unit_of_measurement: A
      accuracy_decimals: 3
      filters:
        - calibrate_linear:
            - 0.000 -> 0.0
            - 5.069 -> 6.69
        # Make everything below 0.01A appear as just 0A.
        # Furthermore it corrects 0.013A for the power usage of the plug.
        - lambda: if (x < (0.01 - 0.013)) return 0; else return (x - 0.013);
    voltage:
      name: "${device_name}_voltage"
      unit_of_measurement: V
      accuracy_decimals: 1
    power:
      name: "${device_name}_wattage"
      unit_of_measurement: W
      id: "${device_name}_wattage"
      accuracy_decimals: 0
```

And for each device's yaml:

```yaml
substitutions:
  # Higher value gives lower watt readout
  current_res: "0.002452"
  # Lower value gives lower voltage readout
  voltage_div: "814"
  device_name: nx-sp201
  friendly_name: Dilisens Outlet
  relay1_name: Outlet 1
  relay2_name: Outlet 2

<<: !include nx-sp201-common.yaml
```
