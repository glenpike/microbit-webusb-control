// const Tone = require('tone')

// window.Tone = Tone

import USBDevices from './usb-devices'


const usbDevices = new USBDevices();

const vendorId = 0x0D28
const productId = 0x0204
let running = false

async function delay(ms) { new Promise(resolve => setTimeout(resolve, ms) ) }

let serialText = ''
function processSerialInput(serialData) {
  let decoder = new TextDecoder();
  if (!serialData.length) {
    return []
  }
  console.log('decoded serialData: ', decoder.decode(serialData))
  // console.log('received some serialData: ', serialData)
  // Split serialText into an array of lines
  // const lines = serialText.split('\n')
  let lines = []
  for(let i = 0; i < serialData.length; i++) {
    const char = String.fromCharCode(serialData[i])
    if (char == "\n") {
      if (serialText.length) {
        lines.push(serialText)
      }
      serialText = ''
    } else {
      serialText += char
    }
  }
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

async function readUSBDevice() {
  const device = await usbDevices.addDevice([
    {vendorId, productId},
  ]);

  if(!device) {
    console.log('No device!')
    return;
  }
  console.log('Starting!')
  running = true

  while(running) {
    const serialBuffer = await usbDevices.readSerial(device)

    let packets = processSerialInput(serialBuffer)

    if (packets.length) {
      console.log('received some packets: ', packets)
    } else {
      console.warn('no packets?? ', serialText)
    }

    await delay(1000)
  }
  console.log('Stopping!')
}

(async () => {
  const go = document.querySelector('.js-button-go')
  console.log('button ', go)
  go.onclick = () => readUSBDevice()
  const stop = document.querySelector('.js-button-stop')
  stop.onclick = () => { running = false }

})()