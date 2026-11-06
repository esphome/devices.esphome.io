---
title: Lonsonho 9W E27 RGBWW bulb
date-published: 2019-11-29
type: light
standard: global
board: esp8266
---

This configuration is for the Lonsonho 9W E27 RGBWW bulb which is offered as a kit of 2 on [aliexpress.com]. The bulb
has no special LED drivers built in and uses the ESP's pulse width modulation for dimming.

## GPIO Pinout

| Pin    | Function           |
|--------|--------------------|
| GPIO4  | red channel        |
| GPIO12 | green channel      |
| GPIO14 | blue channel       |
| GPIO13 | warm white channel |
| GPIO5  | cold white channel |

## Getting it up and running

### Tuya Convert

This bulb is a Tuya device, so you'll need to
[use tuya-convert to initially get ESPHome onto it](/devices/tuya-convert).  After that, you can use ESPHome's OTA
functionality to make any changes.

- Put the bulb into "smartconfig" / "autoconfig" / pairing mode by switching the bulb off and on 4 or 5 times in a row
  in quick succession.
- The bulb blinks white rapidly to confirm that it has entered pairing mode.

Remember to make the following changes to the example YAML config below:

- line 6: Give your device a name.
- line 7: Give an ID name, all lower case and change spaces to underscores.
- line 10: Set up the static ip for your device that matches to your environment. Remember this IP must be unique in
  your LAN.
- lines 26, 27 and 28: gateway is the IP of your router, subnet most certainly 255.255.255.0 and dns1 again the IP of
  your router.
- line 31: This is only if a red cross appears here. AP SSIDs can only contain up to 32 symbols. If you've chosen a long
  device name it might exceed. Either shorten the device name or delete right after AP, " (192.168.4.1)".
- line 32: You'll probably don't want to complicate your live with a WiFi password when your bulb enters access point
  mode. Feel free to change from password: '1234abcd' to password: ''.

Once you've completed the tuya-convert process and flashed ESPHome, you can integrate your bulb in Home Assistant using
a lovelace `Light` card.

Enjoy your hard work and impress some people with the magic 8-]

## Basic Configuration

```yaml
# device declaration: Lonsonho-9W-E27-RGBWW-bulb
# buying from: https://www.aliexpress.com/item/33006613923.html

# variables
substitutions:
  name: 'Fancy Device'
  device: 'fancy_device'
  reboot_timeout: 1h
  update_interval: 1min
  static_ip: 10.10.10.88

# core configuration
esphome:
  name: ${device}

esp8266:
  board: esp01_1m

# WiFi + network settings
wifi:
  ssid: 'Name of you homes WiFi'
  password: 'your supersecret wifi password'
  fast_connect: true
  reboot_timeout: ${reboot_timeout}
  manual_ip:
    static_ip: ${static_ip}
    gateway: 10.10.10.1
    subnet: 255.255.255.0
    dns1: 10.10.10.1
    dns2: 1.1.1.1
  ap:
    ssid: '${name} AP (192.168.4.1)'
    password: '1234abcd'         #  wifi password when in access point mode. Leave '' for no password.

# captive portal for access point mode
captive_portal:

# enabling home assistant legacy api
api:
  # uncomment below if needed
  # encryption:
  #  key: !secret encryption_key

# enabling over the air updates
ota:
  # uncomment below if needed
  # password: 'your secret ota password'

# synchronizing time with home assistant
time:
  - platform: homeassistant
    id: homeassistant_time

# Logging
logger:
  level: DEBUG
  # Disable logging to serial
  baud_rate: 0

# Defining the output pins
output:
  - platform: esp8266_pwm
    id: output_red
    pin: GPIO4
  - platform: esp8266_pwm
    id: output_green
    pin: GPIO12
  - platform: esp8266_pwm
    id: output_blue
    pin: GPIO14
  - platform: esp8266_pwm
    id: output_warm_white
    pin: GPIO13
  - platform: esp8266_pwm
    id: output_cold_white
    pin: GPIO5

# here go the light definitions, effects and restore mode
light:
  - platform: rgbww
    name: '${name}'
    id: '${device}'
    red: output_red
    green: output_green
    blue: output_blue
    warm_white: output_warm_white
    cold_white: output_cold_white
    warm_white_color_temperature: 2800 K
    cold_white_color_temperature: 6200 K

    effects:
      - random:
      - random:
          name: 'random slow'
          update_interval: 30s
          transition_length: 7.5s

    # Attempt to restore state and default to ON if the physical switch is actuated.
    restore_mode: RESTORE_DEFAULT_ON
```

   [aliexpress.com]: https://www.aliexpress.com/item/33006613923.html
