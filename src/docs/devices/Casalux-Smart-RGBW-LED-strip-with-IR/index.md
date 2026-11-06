---
title: Casalux Smart RGBW LED-strip with IR-remote (47278 + 852592)
date-published: 2026-02-01
type: light
standard: global
board: bk72xx
made-for-esphome: False
difficulty: 4
---


## Casalux Smart RGBW LED-strip with IR-remote (47278 + 852592)

5m 24V RGBW LED strip with 150 LEDS, controller, IR-remote control, and power supply.
The packaging claims 11W power usage and 800lm brightness.

Out of the box supported by Tuya app.

The custom PCB contains a BK7231N, IR receiver, and a push button.

To flash, the device needs to be opened and wires connected to the clearly marked points.
For example, `ltchiptool` seems to work for the task.

### GPIO Pinout

| Pin     | Function                           |
|---------|------------------------------------|
| GPIO06  | PWM Red channel                    |
| GPIO08  | PWM Blue channel                   |
| GPIO09  | PWM White channel                  |
| GPIO20  | Push button                        |
| GPIO24  | PWM Green channel                  |
| GPIO26  | IR receiver                        |

### Basic Config

Config including only hardware bindings.

```yaml
substitutions:
  device_name: casalux-led-strip
  friendly_name: Casalux LED Strip

esphome:
  name: ${device_name}
  friendly_name: ${friendly_name}

# BK7231N chip configuration
bk72xx:
  board: generic-bk7231n-qfn32-tuya

# Enable logging
logger:
  level: WARN
  logs:
    light: WARN
    remote_receiver: WARN

# Enable Home Assistant API
api:
  encryption:
    key: ""

ota:
  - platform: esphome
    password: ""

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${friendly_name} Fallback"
    password: ""

captive_portal:

web_server:
  port: 80

# Physical button on GPIO20
binary_sensor:
  - platform: gpio
    pin:
      number: P20
      mode: INPUT_PULLUP
      inverted: true
    name: "${friendly_name} Button"
    id: physical_button

# IR Receiver on GPIO26
remote_receiver:
  pin:
    number: P26
    inverted: true
    mode: INPUT
  dump: nec
  # Error tolerances 
  tolerance: 
    type: percentage
    value: 40
  idle: 10ms

# PWM outputs for RGBW
output:
  # Red - GPIO6
  - platform: libretiny_pwm
    id: pwm_red
    pin: P6
    frequency: 1000 Hz
    inverted: false

  # Green - GPIO24
  - platform: libretiny_pwm
    id: pwm_green
    pin: P24
    frequency: 1000 Hz
    inverted: false
    
  # Blue - GPIO8
  - platform: libretiny_pwm
    id: pwm_blue
    pin: P8
    frequency: 1000 Hz
    inverted: false

  # White - GPIO9
  - platform: libretiny_pwm
    id: pwm_white
    pin: P9
    frequency: 1000 Hz
    inverted: false

# Main RGBW Light
light:
  - platform: rgbw
    name: "${friendly_name}"
    id: rgbcw_light
    red: pwm_red
    green: pwm_green
    blue: pwm_blue
    white: pwm_white
    
    color_interlock: false  # Allow RGB + white mixing
    default_transition_length: 0s
    restore_mode: RESTORE_DEFAULT_ON
    gamma_correct: 2.8

# Diagnostic sensors
sensor:
  - platform: uptime
    name: "${friendly_name} Uptime"

  - platform: wifi_signal
    name: "${friendly_name} WiFi Signal"
    update_interval: 60s

text_sensor:
  - platform: wifi_info
    ip_address:
      name: "${friendly_name} IP Address"
    ssid:
      name: "${friendly_name} Connected SSID"
```

### Full config

The config below attempts to recreate the full IR remote control functionality, including the scenes.

```yaml
substitutions:
  device_name: casalux-led-strip
  friendly_name: Casalux LED Strip

esphome:
  name: ${device_name}
  friendly_name: ${friendly_name}

# BK7231N chip configuration
bk72xx:
  board: generic-bk7231n-qfn32-tuya

# Enable logging
logger:
  level: WARN
  logs:
    light: WARN
    remote_receiver: WARN

# Enable Home Assistant API
api:
  encryption:
    key: ""

ota:
  - platform: esphome
    password: ""

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "${friendly_name} Fallback"
    password: ""

captive_portal:

web_server:
  port: 80

# Globals for state management
globals:
  # Track effect speed
  - id: effect_speed
    type: int
    restore_value: yes
    initial_value: '100'
  
  # Track current scene
  - id: current_scene
    type: int
    restore_value: yes
    initial_value: '0'

# Physical button on GPIO20
binary_sensor:
  - platform: gpio
    pin:
      number: P20
      mode: INPUT_PULLUP
      inverted: true
    name: "${friendly_name} Button"
    id: physical_button
    filters:
      - delayed_on: 10ms  # debounce
    on_click:
      # Short press - toggle light
      - min_length: 50ms
        max_length: 1s
        then:
          - light.toggle: rgbcw_light
          - logger.log: "Button: Toggle light"

      # Long press 5 seconds - factory reset
      - min_length: 5s
        max_length: 10s
        then:
          - logger.log: "Button: Factory reset to defaults"
          - lambda: |-
              // Reset to defaults
              auto call = id(rgbcw_light).make_call();
              call.set_state(true);
              call.set_brightness(0.50);
              call.set_white(1.0);
              call.set_rgb(0.0, 0.0, 0.0);
              call.perform();
              
              // Reset effect speed to default
              id(effect_speed) = 100;
              id(effect_speed_control).publish_state(100);

# IR Receiver on GPIO26
remote_receiver:
  pin:
    number: P26
    inverted: true
    mode: INPUT
  dump: nec
  # Error tolerances 
  tolerance: 
    type: percentage
    value: 40
  idle: 10ms

  # Handle NEC protocol with customcode: 239 (0xEF)
  on_nec:
    then:
      - lambda: |-
          // NEC address is 0xEF00 (customcode 239 in high byte)
          if (x.address == 0xEF00) {
            id(handle_ir_command).execute(x.command);
          } else {
            ESP_LOGD("IR", "Ignoring NEC code from address 0x%02X", x.address);
          }

# PWM outputs for RGBW
output:
  # Red - GPIO6
  - platform: libretiny_pwm
    id: pwm_red
    pin: P6
    frequency: 1000 Hz
    inverted: false

  # Green - GPIO24
  - platform: libretiny_pwm
    id: pwm_green
    pin: P24
    frequency: 1000 Hz
    inverted: false

  # Blue - GPIO8
  - platform: libretiny_pwm
    id: pwm_blue
    pin: P8
    frequency: 1000 Hz
    inverted: false

  # White - GPIO9
  - platform: libretiny_pwm
    id: pwm_white
    pin: P9
    frequency: 1000 Hz
    inverted: false

# Main RGBW Light
light:
  - platform: rgbw
    name: "${friendly_name}"
    id: rgbcw_light
    red: pwm_red
    green: pwm_green
    blue: pwm_blue
    white: pwm_white

    color_interlock: false  # Allow RGB + white mixing
    default_transition_length: 0s
    restore_mode: RESTORE_DEFAULT_ON
    gamma_correct: 2.8

    effects:     
      # Flash effect
      - lambda:
          name: "Flash"
          update_interval: 50ms
          lambda: |-
            static bool flash_bright = false;
            static uint32_t last_toggle = 0;
            uint32_t now = millis();
            uint32_t interval = 500 * (100.0 / id(effect_speed));

            if (now - last_toggle >= interval) {
              auto call = id(rgbcw_light).make_call();
              flash_bright = !flash_bright;

              // Don't turn off state - just change brightness!
              if (flash_bright) {
                call.set_brightness(0.85);
              } else {
                call.set_brightness(0.10);  // dim, not off
              }

              call.perform();
              last_toggle = now;
            }

      # Strobe effect
      - lambda:
          name: "Strobe"
          update_interval: 20ms
          lambda: |-
            static bool strobe_bright = false;
            static uint32_t last_toggle = 0;
            uint32_t now = millis();
            uint32_t interval = 100 * (100.0 / id(effect_speed));

            if (now - last_toggle >= interval) {
              auto call = id(rgbcw_light).make_call();
              strobe_bright = !strobe_bright;

              // Don't turn off state - just change brightness!
              if (strobe_bright) {
                call.set_brightness(1.0);  // Full bright
              } else {
                call.set_brightness(0.10);  // dim, not off
              }

              call.perform();
              last_toggle = now;
            }

      # Fade effect
      - lambda:
          name: "Fade"
          update_interval: 50ms
          lambda: |-
            static float brightness = 0.1;
            static bool up = true;

            auto call = id(rgbcw_light).make_call();

            brightness += up ? 0.01 : -0.01;
            if (brightness >= 0.85) up = false;
            if (brightness <= 0.1) up = true;

            call.set_brightness(brightness);
            call.set_white(0.0);

            call.perform();

      # Smooth effect
      - lambda:
          name: "Smooth"
          update_interval: 50ms
          lambda: |-
            static int pos = 0;
            static uint32_t last_update = 0;
            uint32_t now = millis();
            uint32_t interval = 50 * (100.0 / id(effect_speed));
            
            if (now - last_update < interval) {
              return;
            }
            last_update = now;
            
            auto call = id(rgbcw_light).make_call();
            pos = (pos + 1) % 360;
            float brightness = 0.85;
            float hue = pos / 360.0;
            float r, g, b;

            if (hue < 1.0/6.0) {
              r = brightness;
              g = brightness * (hue * 6.0);
              b = 0;
            } else if (hue < 2.0/6.0) {
              r = brightness * (1 - (hue - 1.0/6.0) * 6.0);
              g = brightness;
              b = 0;
            } else if (hue < 3.0/6.0) {
              r = 0;
              g = brightness;
              b = brightness * ((hue - 2.0/6.0) * 6.0);
            } else if (hue < 4.0/6.0) {
              r = 0;
              g = brightness * (1 - (hue - 3.0/6.0) * 6.0);
              b = brightness;
            } else if (hue < 5.0/6.0) {
              r = brightness * ((hue - 4.0/6.0) * 6.0);
              g = 0;
              b = brightness;
            } else {
              r = brightness;
              g = 0;
              b = brightness * (1 - (hue - 5.0/6.0) * 6.0);
            }

            call.set_rgb(r, g, b);
            // Turn off white for color effects
            call.set_white(0.0);
            call.perform();

# Number inputs for user control
number:
  # Effect speed control
  - platform: template
    name: "${friendly_name} Effect Speed"
    id: effect_speed_control
    min_value: 20
    max_value: 200
    step: 5
    mode: slider
    optimistic: true
    initial_value: 100
    on_value:
      - globals.set:
          id: effect_speed
          value: !lambda 'return (int)x;'

# Select for effect/mode control
select:
  # Current effect selector
  - platform: template
    name: "${friendly_name} Effect"
    id: effect_selector
    options:
      - "None"
      - "Flash"
      - "Strobe"
      - "Fade"
      - "Smooth"
    initial_option: "None"
    optimistic: true
    on_value:
      - lambda: |-
          auto call = id(rgbcw_light).make_call();
          std::string effect = x;
          
          if (effect == "None") {
            call.set_effect("None");
          } else {
            call.set_effect(effect);
          }
          call.perform();

script:
  # IR Remote command handler
  - id: handle_ir_command
    mode: restart
    parameters:
      code: int
    then:
      - lambda: |-
          ESP_LOGD("IR", "Received NEC code: 0x%02X (%d)", code, code);

          auto call = id(rgbcw_light).make_call();
          auto current = id(rgbcw_light).current_values;
          float brightness = current.get_brightness();

          // Helper: set color
          auto set_color = [&](float r, float g, float b, const char* name) {
            call.set_state(true);
            call.set_rgb(r, g, b);
            call.set_white(0.0);
            call.set_effect("None");
            ESP_LOGD("IR", "%s", name);
          };

          // IR key mapping
          switch(code) {
            // Power
            case 0xFC03:  // ON
              call.set_state(true);
              ESP_LOGD("IR", "Power ON");
              break;
              
            case 0xFD02:  // OFF
              call.set_state(false);
              ESP_LOGD("IR", "Power OFF");
              break;

            // Brightness
            case 0xFF00:  // Brightness UP
              brightness = min(1.0f, brightness + 0.05f);
              call.set_brightness(brightness);
              ESP_LOGD("IR", "Brightness UP: %.0f%%", brightness * 100);
              break;

            case 0xFE01:  // Brightness DOWN
              brightness = max(0.10f, brightness - 0.05f);
              call.set_brightness(brightness);
              ESP_LOGD("IR", "Brightness DOWN: %.0f%%", brightness * 100);
              break;

            // Pure colors
            case 0xFB04:  // Red 100%
              set_color(1.0, 0.0, 0.0, "Red 100%");
              break;

            case 0xFA05:  // Green 100%
              set_color(0.0, 1.0, 0.0, "Green 100%");
              break;

            case 0xF906:  // Blue 100%
              set_color(0.0, 0.0, 1.0, "Blue 100%");
              break;

            case 0xF807:  // White 100%
              call.set_state(true);
              call.set_rgb(0.0, 0.0, 0.0);  // Always turn off RGB for white
              call.set_white(1.0);
              call.set_effect("None");
              ESP_LOGD("IR", "White 100%%");
              break;

            // Red-Yellow gradient
            case 0xF708:  // Yellow 25% + Red 75%
              set_color(1.0, 0.25, 0.0, "Red 75% + Yellow 25%");
              break;

            case 0xF30C:  // Yellow 50% + Red 50%
              set_color(1.0, 0.5, 0.0, "Red 50% + Yellow 50%");
              break;

            case 0xEF10:  // Yellow 75% + Red 25%
              set_color(1.0, 0.75, 0.0, "Red 25% + Yellow 75%");
              break;

            case 0xEB14:  // Yellow 100%
              set_color(1.0, 1.0, 0.0, "Yellow 100%");
              break;

            // Green-Cyan gradient
            case 0xF609:  // Cyan 25% + Green 75%
              set_color(0.0, 1.0, 0.25, "Green 75% + Cyan 25%");
              break;

            case 0xF20D:  // Cyan 50% + Green 50%
              set_color(0.0, 1.0, 0.5, "Green 50% + Cyan 50%");
              break;

            case 0xEE11:  // Cyan 75% + Green 25%
              set_color(0.0, 1.0, 0.75, "Green 25% + Cyan 75%");
              break;

            case 0xEA15:  // Cyan 100%
              set_color(0.0, 1.0, 1.0, "Cyan 100%");
              break;

            // Blue-Magenta gradient
            case 0xF50A:  // Magenta 25% + Blue 75%
              set_color(0.25, 0.0, 1.0, "Blue 75% + Magenta 25%");
              break;

            case 0xF10E:  // Magenta 50% + Blue 50%
              set_color(0.5, 0.0, 1.0, "Blue 50% + Magenta 50%");
              break;

            case 0xED12:  // Magenta 75% + Blue 25%
              set_color(0.75, 0.0, 1.0, "Blue 25% + Magenta 75%");
              break;

            case 0xE916:  // Magenta 100%
              set_color(1.0, 0.0, 1.0, "Magenta 100%");
              break;

            // Effects
            case 0xF40B:  // Flash effect
              call.set_state(true);
              call.set_effect("Flash");
              id(effect_selector).publish_state("Flash");
              ESP_LOGD("IR", "Effect: Flash");
              break;

            case 0xF00F:  // Strobe effect
              call.set_state(true);
              call.set_effect("Strobe");
              id(effect_selector).publish_state("Strobe");
              ESP_LOGD("IR", "Effect: Strobe");
              break;

            case 0xEC13:  // Fade effect
              call.set_state(true);
              call.set_effect("Fade");
              id(effect_selector).publish_state("Fade");
              ESP_LOGD("IR", "Effect: Fade");
              break;

            case 0xE817:  // Smooth effect
              call.set_state(true);
              call.set_effect("Smooth");
              id(effect_selector).publish_state("Smooth");
              ESP_LOGD("IR", "Effect: Smooth");
              break;

            default:
              ESP_LOGW("IR", "Unknown IR code: 0x%02X", code);
              return;
          }

          call.perform();

# Diagnostic sensors
sensor:
  - platform: uptime
    name: "${friendly_name} Uptime"

  - platform: wifi_signal
    name: "${friendly_name} WiFi Signal"
    update_interval: 60s

text_sensor:
  - platform: wifi_info
    ip_address:
      name: "${friendly_name} IP Address"
    ssid:
      name: "${friendly_name} Connected SSID"
```
