let app

const Tone = require('tone')

window.Tone = Tone

import MicrobitUSB from './microbit-usb'
import USBDeviceManager from './usb-device-manager'

let filter = new Tone.Filter(200, "lowpass", -24)
let synth = new Tone.Synth({
  oscillator: {
    type: 'fatsawtooth',
  },
})

synth.chain(filter, Tone.Master)

let seq = new Tone.Sequence(function(time, note){
  synth.triggerAttackRelease(Tone.Frequency(note, 'midi'), '8n')
}, [36, 40, [43, 43], 40/*, 48, 52, 55, 60, 64, 67*/], "8n").start(0)

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

// let notes_1 = [36, 40, 43, 48, 52, 55, 60, 64, 67] // C E G arpeggios
// let notes_2 = [36, 38, 40, 41, 43, 45, 47, 48] //.map { |n| n + 24 }

// const mapNotes = (value, notes) => {
//   let input = Math.max(value, 0)
//   input = Math.min(input, 100)
//   let index = Math.floor((input / 101) * notes.length)
//   return notes[index]
// }

const mapFilter = (value) => {
  let input = Math.max(value, 0)
  input = Math.min(input, 100)
  let freq = (input / 100) * 2000 + 200
  return freq
}

const serialEventHandler = (data) => {
  let lines = processSerialInput(data)
  let packets = processDataPackets(lines)
  if (packets.length) {
    for (let i = 0; i < packets.length; i++) {
      if (packets[i].n == 'roll') {
        let freq = mapFilter(packets[i].v)
        filter.frequency.value = freq
        
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
  app.$data.isRunning = true

  Tone.Transport.start()
  while (running) {
    await microbit.readSerial()
    await delay(50)
  }
  console.log('Stopping!')
  microbit.disable()
  Tone.Transport.stop()
  app.$data.isRunning = false
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

  app = new Vue({
    el: '.app',
    data: {
     isRunning: false
    },
    methods: {
      go: () => {
        readUSBDevice()
      },
      stop: () => {
        running = false
      }
    }
  })
})()
