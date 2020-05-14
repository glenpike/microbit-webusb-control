# Introduction

Experiment using a micro:bit to control things in the browser with it's inputs and sensors like compass, button A, etc.

You will need at least one micro:bit and WebUSB enabled browser (Chrome) as well as NodeJS v10.14.1 or higher.

# Setup

## micro:bit setup
- Update your micro:bit [firmware](https://microbit.org/get-started/user-guide/firmware/) to allow WebUSB pairing
- head over to the [micro:bit editor](https://makecode.microbit.org/#editor) choose 'JavaScript'
- copy/paste the code from the [microbit-src/serial-tx.js](./microbit-src/serial-tx.js) into this editor
- Download it to your micro:bit
- Check the display matches the LED setup below (when it's running it will toggle some others on/off too)
```
# . # . #
. # # # .
# . # . #
. . # . .
. . # . .
```
- disconnect the micro:bit when this is working
- reconnect it (otherwise it remains paired with the micro:bit editor and you can't use it in another tab)

## code setup

- Run `npm install` in this directory to install all your packages.
- Run `npm run dev` to fire up the development environment
- visit http://localhost:8080 in your browser
- Click 'Go' and wiggle the micro:bit around - currently the 'pitch' axis plays some notes on a ToneJS synth

# Ideas

- [ ] Make this relay to MIDI using WebMIDI (it seems a bit 'laggy' currently though)
- [ ] Control visuals instead / as well as music
- [ ] Send data to micro:bits to make them light up LEDs and things
- [ ] Create a separate synth in ToneJS and make this configurable
- [ ] Allow mapping of micro:bit 'controls' to the synths in the browser (just a couple of lines of code)
- [ ] Allow control from more than one micro:bit see the [microbit-midi](https://github.com/glenpike/microbit-midi) for code that allows one micro:bit to be a [relay](https://github.com/glenpike/microbit-midi/blob/master/microbit/js/receiver.js) for multiple ['transmitters'](https://github.com/glenpike/microbit-midi/blob/master/microbit/js/transmitter.js) using the radio function



