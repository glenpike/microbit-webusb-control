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
    await device.open()
    if (device.configuration === null)
      await device.selectConfiguration(1)
    await device.claimInterface(4)
    console.log('Connected ', device)

    //TODO: Set baud rate
    //https://github.com/microsoft/pxt-microbit/blob/afd1b07fd02df6b8316ca240c7c7a41115eae8de/editor/extension.tsx#L130
  }
  //TODO sendPacketAsync:
  //https://github.com/microsoft/pxt/blob/master/pxtlib/webusb.ts#L186

  //TODO reading Serial
  //https://github.com/microsoft/pxt-microbit/blob/afd1b07fd02df6b8316ca240c7c7a41115eae8de/editor/extension.tsx#L52
  async receivePacketAsync(device) {
    console.log('receivePacketAsync ', device)
    let final = (res) => {
      console.log('final ', res)
      if (res.status != "ok")
        this.error("USB IN transfer failed")
      let arr = new Uint8Array(res.data.buffer)
      if (arr.length == 0) {
          console.log('array length is 0')
          return this.recvPacketAsync(device)
      }
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
