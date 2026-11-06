---
title: Geiger counter RadiationD v1.1 (CAJOE)
date-published: 2023-04-11
type: sensor
standard: global
---

With the help of `pulse_counter`and the RadiationD v1.1(CAJOE) you can make your own Geiger
counter, which will give you a more or less precise messurement of the
current radation level. But it should be good enough to warn you about
critical events.

## Assembly

![image](./radiationD-v1-1-cajoe_small.jpg)

The first step is to connect the sensor.

You just need to connect the +5V, the ground and a GPIO pin to the ESP.
In my case I used the pin 34 for the signal. (The print on the PCB is
wrong VIN is the signal.) This setup should give you the pulse of each
messurement or count. For more information check the Video of [Andreas
Spiess](https://www.youtube.com/watch?v=K28Az3-gV7E).

### Housing

I just 3D printed an small housing the avoid touching the high voltage
Geiger Mueller tube. [Counter Tube
Case](https://www.thingiverse.com/thing:5425224) (The tube should not be
in direct sunlight. So maybe you will need another case.)

## Configuration

The block `pulse_counter` will count the radation events per minute. With the found
specs of the tube you will be able to calculate the radiation in μSv/h.

It\'s just the counts per minute (CPM) times the factor of your Geiger
Mueller tube you\'re using. It should be the J305ß, which comes with the
PCB. (To make sure - check your printing on the tube)

μSv/h = (CPM - Tube noise) \* Factor According to the video of [Andreas
Spiess](https://www.youtube.com/watch?v=K28Az3-gV7E) the tube should
have about 12 CPM as background noise.

### Note

The current version of the pack comes with the J305ß Geiger tube which
detectes Beta and Gamma radiation. Specifications: Manufacturer: North
Optic Radiation Detection: β, γ Length: 111mm Diameter: 11mm Recommended
Voltage: 350V Plateau Voltage: 360-440V Sensitivy γ (60Co): 65cps/(μR/s)
Sensitivy γ (equivalent Sievert): 108cpm / (μSv/h) Max cpm: 30000
cps/mR/h: 18 cpm/m/h: 1080 cpm/μSv/h: 123.147092360319 Factor:
0.00812037037037

[Source:
opengeiger.de/LibeliumDoku.pdf](http://www.opengeiger.de/LibeliumDoku.pdf).

``` yaml
sensor:
  - platform: pulse_counter
    pin: 34
    name: "Radiation"
    unit_of_measurement: 'μSv/h'
    count_mode:
     rising_edge: DISABLE
     falling_edge: INCREMENT
    filters:
      - offset: -12.0 # J305ß Geiger Mueller tube background noise 0.2 pulses / sec x 60 sec = 12 CPM (Counts per Minute)
      - multiply: 0.00812037037037 # Factor: 0.00812037037037
```

### Advanced version with every second update including last minute history values

``` yaml
globals:
  - id: pulse_history
    type: int[60]
    restore_value: no
    initial_value: "{0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}"

  - id: pulse_index
    type: int
    restore_value: no
    initial_value: "0"

  - id: pulse_sum
    type: int
    restore_value: no
    initial_value: "0"

sensor:
  - platform: pulse_counter
    id: geiger_cps
    internal: true
    pin:
      number: 34
      inverted: True
      mode:
        input: True
        pullup: False
        pulldown: False
    unit_of_measurement: 'CPS'
    name: 'Ionizing Radiation Power CPS'
    count_mode:
      rising_edge: DISABLE
      falling_edge: INCREMENT
    accuracy_decimals: 0
    update_interval: 1s
    filters:
      delta: 1
    on_raw_value:
      then:
        - lambda: |-
            x=round(x/60); // esphome calculating based on pulses per minute. round required to avoid problem when esphome calc value less than 60 pulses per minute (for example 59.7)
            id(pulse_sum) -= id(pulse_history)[id(pulse_index)]; // remove old value from overall sum
            id(pulse_history)[id(pulse_index)] = x; // 'x' is the raw pulse count
            id(pulse_sum) += x; // add new value to overall sum

            id(pulse_index)++; // change array index where next value will be stores
            if (id(pulse_index) >= 60) id(pulse_index) = 0; // Reset at 60
    on_value:
      then:
        component.update: geiger_cpm

  - platform: template
    id: geiger_cpm
    unit_of_measurement: 'CPM'
    name: 'Ionizing Radiation Power CPM'
    accuracy_decimals: 0
    update_interval: 1s
    state_class: measurement
    lambda: return id(pulse_sum);
    filters:
      delta: 1

  - platform: copy
    source_id: geiger_cpm
    id: ionizing_radiaton_power
    unit_of_measurement: 'µSv/h'
    name: 'Ionizing Radiation Power'
    state_class: measurement
    icon: mdi:radioactive
    accuracy_decimals: 3
    filters:
      - skip_initial: 15
      - sliding_window_moving_average: # 15 measurements moving average (MA5) here
          window_size: 15
          send_every: 1
      - multiply: 0.0057 # 0.0057 original value or 0.00332 for J305 by IoT-devices tube conversion factor of pulses into uSv/Hour
```
