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
  let len = serialData[1]
  if(0 == len) {
    return []
  }
  let decoder = new TextDecoder();
  if (!serialData.length) {
    return []
  }
  // console.log('decoded serialData: ', decoder.decode(serialData.slice(2)))
  // console.log('received some serialData: ', serialData)
  // Split serialText into an array of lines
  // const lines = serialText.split('\n')
  // let lines = []
  serialText = ''
  let hex = `${serialData[0].toString(16)} ${serialData[1].toString(16)}`
  for(let i = 2; i < len; i++) {
    const char = String.fromCharCode(serialData[i])
    // if (char == "\n") {
    //   if (serialText.length) {
    //     lines.push(serialText)
    //   }
    //   serialText = ''
    // } else {
      serialText += char
      hex += ` ${serialData[i].toString(16)}`
    // }
  }
  console.log(`decoded ${hex}\nserialData: '${serialText}'`)
  const packets = []
  // lines.forEach((line, index) => {
  //   try {
  //     let packet = JSON.parse(line)
  //     packets.push(packet)
  //   } catch(e) {
  //     console.warn('Invalid packet @ ', index, line)
  //   }
  // })
  return packets;
}

function serialListener(event) {
  if(event.data.type == 'serial') {
    // console.log(`serial: '${event.data.data}'`)
    let serialData = event.data.data;
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
    console.log(`decoded '${hex}'\nSerial Str: '${serialData}'\nlines: ${lines}\nserialText: '${serialText}'`)
    if(serialText.length > 256) {
      serialText = ''
    }
  }
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
  window.addEventListener('message', serialListener)

  while(running) {
    const serialBuffer = await usbDevices.readSerial(device)

    // let packets = processSerialInput(serialBuffer)

    // if (packets.length) {
    //   console.log('received some packets: ', packets)
    // }
    // } else {
    //   console.warn('no packets?? ', serialText)
    // }

    // await delay(10)
  }
  console.log('Stopping!')
  window.removeEventListener('message', serialListener)
  usbDevices.disconnectDevice(device)
}

(async () => {
  
  const go = document.querySelector('.js-button-go')
  console.log('button ', go)
  go.onclick = () => readUSBDevice()
  const stop = document.querySelector('.js-button-stop')
  stop.onclick = () => { running = false }

})()
