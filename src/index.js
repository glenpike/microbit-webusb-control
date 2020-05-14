const Tone = require('tone')

window.Tone = Tone

import MicrobitUSB from './microbit-usb'
import USBDeviceManager from './usb-device-manager'

// Fix the vulnerabilities
// Do a separate synth - defs?
// Mapping input to notes and controls
// Create 'wiring' handler

//create a synth and connect it to the master output (your speakers)
let synth = new Tone.Synth().toMaster()

const deviceManager = new USBDeviceManager(MicrobitUSB)

let running = false

const delay = async (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Move this, either to Microbit or 'middleware' kind of thing
let serialText = ''
const processSerialInput = (serialData) => {
  let lines = []
  let hex = ''
  for (let i = 0; i < serialData.length; i++) {
    const char = serialData[i]
    if (char == '\n') {
      if (serialText.length) {
        lines.push(serialText.trim())
      }
      serialText = ''
    } else {
      serialText += char
    }
    hex += `${serialData.charCodeAt([i]).toString(16)} `
  }
  // console.log(`decoded '${hex}'\nSerial Str: '${serialData}'\nlines: ${lines}\nserialText: '${serialText}'`)
  if (serialText.length > 256) {
    serialText = ''
  }

  return lines
}

const processDataPackets = (lines) => {
  const packets = []
  lines.forEach((line, index) => {
    try {
      let packet = JSON.parse(line)
      packets.push(packet)
    } catch (e) {
      console.warn('Invalid packet @ ', index, line)
    }
  })
  return packets
}

let notes_1 = [36, 40, 43, 48, 52, 55, 60, 64, 67] // C E G arpeggios
let notes_2 = [36, 38, 40, 41, 43, 45, 47, 48] //.map { |n| n + 24 }

const mapNotes = (value, notes) => {
  let input = Math.max(value, 0)
  input = Math.min(input, 100)
  let index = Math.floor((input / 101) * notes.length)
  return notes[index]
}

const serialEventHandler = (data) => {
  let lines = processSerialInput(data)
  let packets = processDataPackets(lines)
  if (packets.length) {
    for (let i = 0; i < packets.length; i++) {
      if (packets[i].n == 'pitch') {
        let note = mapNotes(packets[i].v, notes_1)
        // console.log('received pitch: ', note)
        synth.triggerAttackRelease(Tone.Frequency(note, 'midi'), '8n')
      }
    }
  }
}

const readUSBDevice = async () => {
  await Tone.start()
  console.log('audio is ready')

  const microbit = await deviceManager.addDevice()

  if (!microbit) {
    console.log('No microbit!')
    return
  }

  await microbit.enable()

  console.log('Starting!')
  running = true

  while (running) {
    await microbit.readSerial()
    await delay(50)
  }
  console.log('Stopping!')
  microbit.disable()
}

const disconnectListener = (data) => {
  console.log('microbit disconnected? ', data.device)
  running = false
}

const handlers = {
  serial: serialEventHandler,
  'usbdevice::disconnect': disconnectListener,
}

const messageHandler = (event) => {
  let handler = handlers[event.data.type]
  if (handler) {
    handler(event.data.data)
  }
}

;(async () => {
  window.addEventListener('message', messageHandler)
  const go = document.querySelector('.js-button-go')
  console.log('button ', go)
  go.onclick = () => readUSBDevice()
  const stop = document.querySelector('.js-button-stop')
  stop.onclick = () => {
    running = false
  }
})()
