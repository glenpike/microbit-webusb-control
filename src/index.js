// const Tone = require('tone')

// window.Tone = Tone

const vendorId = 0x0D28
const productId = 0x0204

const listDevices = function() {
  
  const filters = [
    {vendorId, productId},
  ];
  console.log('go ', filters)
  
  navigator.usb.getDevices(filters)
  .then(devices => {
    console.log("Total devices: " + devices.length);
    devices.forEach(device => {
      console.log("Product name: " + device.productName + ", serial number " + device.serialNumber);
    });
  });
}

let device

const receivePacketAsync = () => {
  let final = (res) => {
    if (res.status != "ok")
        this.error("USB IN transfer failed")
    let arr = new Uint8Array(res.data.buffer)
    if (arr.length == 0)
        return recvPacketAsync()
    return arr
  }
  return device.controlTransferIn({
    requestType: "class",
    recipient: "interface",
    request: 0x01,
    value: 0x100,
    index: 4
  }, 64).then(final)
}

const requestDevice = function() {
  

  navigator.usb.requestDevice({ filters: [{ vendorId }] })
    .then(selectedDevice => {
      console.log('selectedDevice: ', selectedDevice)
      device = selectedDevice;
      return device.open(); // Begin a session.
    })
    .then(() => device.selectConfiguration(1))
    .then(() => device.claimInterface(4)) // Request exclusive control over interface #4.
    .then(() => receivePacketAsync())
    .then(buf => {
      let decoder = new TextDecoder();
      console.log('Received: ' + decoder.decode(buf));
    })
      
    .catch(error => { console.log(error); });
}


const button = document.querySelector('.js-button')
console.log('button ', button)
button.onclick = requestDevice
