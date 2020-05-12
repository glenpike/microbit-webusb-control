const interfaceNumber = 4;
const controlTransferGetReport = 0x01;
const controlTransferSetReport = 0x09;
const controlTransferOutReport = 0x200;
const controlTransferInReport = 0x100;

async function delay(ms) { new Promise(resolve => setTimeout(resolve, ms) ) }

class USBDevices {
  constructor() {
    navigator.usb.addEventListener('connect', (event) => {
      this.devices.push(event.device)
      this.connectDevice(event.device)
    })

    navigator.usb.addEventListener('disconnect', (event) => {
      let index = this.devices.indexOf(event.device)
      this.devices.splice(index, 1)
    })

    navigator.usb.getDevices().then((devices) => {
      this.devices = devices;
      devices.forEach((device) => this.connectDevice(device))
    })
  }

  async connectDevice(device) {
    try {
      await device.open()
      if (device.configuration === null)
        await device.selectConfiguration(1)
      await device.claimInterface(4)
      console.log('Connected ', device)
      //Set baud rate
      await this.sendPacketAsync(device, Uint8Array.from([0x82, 0x00, 0xC2, 0x01, 0x00]))
      const buf = await this.receivePacketAsync(device)
    } catch(e) {
      console.warn('could not connect device: ', device);
    }
  }

  async disconnectDevice(device) {
    try {
      await device.releaseInterface(4)
      console.log('disconnected ', device)
    } catch(e) {
      console.warn('could not disconnect device: ', device);
    }
  }

  //From: https://github.com/microsoft/pxt/blob/master/pxtlib/webusb.ts#L186
  async sendPacketAsync(device, packet) {
    return device.controlTransferOut({
        requestType: "class",
        recipient: "interface",
        request: controlTransferSetReport,
        value: controlTransferOutReport,
        index: interfaceNumber
    }, packet).then(res => {
        if (res.status != "ok") {
          console.error("USB CTRL OUT transfer failed")
        }
        // console.log(`USB CTRL OUT sent: ${res.bytesWritten} bytes`)
    })
  }

  //From https://github.com/microsoft/pxt-microbit/blob/afd1b07fd02df6b8316ca240c7c7a41115eae8de/editor/extension.tsx#L52
  async readSerial(device) {
    await this.sendPacketAsync(device, Uint8Array.from([0x83]))
    await this.receivePacketAsync(device)
  }

  async receivePacketAsync(device) {
    // console.log('receivePacketAsync ', device)
    let final = (res) => {
      // console.log('final ', res)
      if (res.status != "ok")
        console.error("USB IN transfer failed")
      let arr = new Uint8Array(res.data.buffer)
      if (arr.length == 0) {
          console.log('array length is 0')
          return this.receivePacketAsync(device)
      }
      var len = arr[1];
      var str = "";
      for (var i = 2; i < len + 2; ++i) {
          str += String.fromCharCode(arr[i]);
      }
      if (str.length > 0) {
          window.postMessage({
              type: 'serial',
              id: 'n/a',
              data: str
          }, "*");
      }
      return arr
    }
    return device.controlTransferIn({
      requestType: "class",
      recipient: "interface",
      request: controlTransferGetReport,
      value: controlTransferInReport,
      index: interfaceNumber
    }, 64).then(final)
  }

  async addDevice(filters) {
    try {
      let device = await navigator.usb.requestDevice({filters})
      let index = this.devices.indexOf(device)
      console.log(`addDevice: exists? ${index}`, device)
      if (index === -1) {
        this.push('devices', device)
        await this.connectDevice(device)
      }
      return device
    } catch (error) {
      // Ignore "no device selected" error.
      return null;
    }
  }
}

export default USBDevices
