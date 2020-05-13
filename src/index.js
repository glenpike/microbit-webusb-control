// const Tone = require('tone')

// window.Tone = Tone

import MicrobitUSB from './microbit-usb'
import USBDeviceManager from './usb-device-manager'

const deviceManager = new USBDeviceManager(MicrobitUSB);

let running = false

async function delay(ms) { new Promise(resolve => setTimeout(resolve, ms) ) }

let serialText = ''
function processSerialInput(serialData) {
  let lines = []
  let hex = ''
  for(let i = 0; i < serialData.length; i++) {
    const char = serialData[i]
    if (char == "\n") {
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
  if(serialText.length > 256) {
    serialText = ''
  }

  return lines;
}

function processDataPackets(lines) {
  const packets = []
  lines.forEach((line, index) => {
    try {
      let packet = JSON.parse(line)
      packets.push(packet)
    } catch(e) {
      console.warn('Invalid packet @ ', index, line)
    }
  })
  return packets;
}

function serialEventHandler(data) {
  let lines = processSerialInput(data)
  let packets = processDataPackets(lines)
  if (packets.length) {
    console.log('received some packets: ', packets)
  }
}

async function readUSBDevice() {
  const microbit = await deviceManager.addDevice();

  if(!microbit) {
    console.log('No microbit!')
    return;
  }

  await microbit.connect()

  console.log('Starting!')
  running = true
  

  while(running) {
    await microbit.readSerial()
    await delay(50)
  }
  console.log('Stopping!')
  microbit.disconnect()
}

function disconnectListener(data) {
  console.log('microbit disconnected? ', data.device)
  running = false;
}

const handlers = {
  'serial': serialEventHandler,
  'usbdevice::disconnect': disconnectListener
}

function messageHandler(event) {
  let handler = handlers[event.data.type]
  if(handler) {
    handler(event.data.data)
  }
}

(async () => {
  window.addEventListener('message', messageHandler)
  const go = document.querySelector('.js-button-go')
  console.log('button ', go)
  go.onclick = () => readUSBDevice()
  const stop = document.querySelector('.js-button-stop')
  stop.onclick = () => { running = false }
})()
