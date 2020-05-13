input.onButtonPressed(Button.A, function () {
  sendPacket("input", "A")
  led.toggle(3, 3)
})
input.onButtonPressed(Button.B, function () {
  sendPacket("input", "B")
  led.toggle(4, 3)
})
input.onButtonPressed(Button.AB, function () {
  sendPacket("input", "AB")
  led.toggle(3, 4)
})
input.onGesture(Gesture.Shake, function () {
  sendPacket("input", "shake")
  led.toggle(4, 4)
})
let pitch = 0
let lastPitch = 0
let roll = 0
let lastRoll = 0
let compass = 0
let lastCompass = 0
let useRadio = false
// JavaScript for a Microbit to transmit it's
// orientation and other input values via Serial (USB by default)
function compare(current: number, previous: number) {
  return Math.floor(current / 2.0) != Math.floor(previous / 2.0)
}

function sendPacket(name: String, value: any) {
  if (useRadio) {
      if (name == 'input') {
          radio.sendString(`"${name}": "${value}"`)
      } else {
          radio.sendValue(`${name}`, value)
      }
  } else {
      serial.writeLine(`{ "s": "1234", "t": "${input.runningTimeMicros()}", "n": "${name}", "v": "${value}" }`)
  }
}
basic.showLeds(`
# . # . #
. # # # .
# . # . #
. . # . .
. . # . .
`)

basic.forever(function () {
  pitch = input.rotation(Rotation.Pitch)
  if (compare(pitch, lastPitch)) {
      sendPacket("pitch", pitch)
      lastPitch = pitch
      led.toggle(0, 3)
  }
  roll = input.rotation(Rotation.Roll)
  if (compare(roll, lastRoll)) {
      sendPacket("roll", roll)
      lastRoll = roll
      led.toggle(1, 3)
  }
  compass = input.compassHeading()
  if (compare(compass, lastCompass)) {
      sendPacket("compass", compass)
      lastCompass = compass
      led.toggle(0, 4)
  }
  basic.pause(100)
})
