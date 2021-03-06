const interfaceNumber = 4
const controlTransferGetReport = 0x01
const controlTransferSetReport = 0x09
const controlTransferOutReport = 0x200
const controlTransferInReport = 0x100

class MicrobitUSB {
  static vendorId = 0x0d28
  static productId = 0x0204

  constructor(device) {
    this.device = device
  }

  async enable() {
    try {
      await this.device.open()
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1)
      }
      await this.device.claimInterface(interfaceNumber)

      await this.sendPacketAsync(
        Uint8Array.from([0x82, 0x00, 0xc2, 0x01, 0x00])
      )
      const buf = await this.receivePacketAsync()
      console.log('MicrobitUSB enabled ', this.device, buf)
    } catch (e) {
      console.warn('could not enable this.device: ', e, this.device)
    }
  }

  async disable() {
    try {
      await this.device.releaseInterface(interfaceNumber)
      console.log('disabled ', this.device)
    } catch (e) {
      console.warn(
        'could not disable this.device (may have gone already!): ',
        this.device
      )
    }
  }

  //From: https://github.com/microsoft/pxt/blob/master/pxtlib/webusb.ts#L186
  async sendPacketAsync(packet) {
    return this.device
      .controlTransferOut(
        {
          requestType: 'class',
          recipient: 'interface',
          request: controlTransferSetReport,
          value: controlTransferOutReport,
          index: interfaceNumber,
        },
        packet
      )
      .then((res) => {
        if (res.status != 'ok') {
          console.error('USB CTRL OUT transfer failed')
        }
      })
  }

  //From https://github.com/microsoft/pxt-microbit/blob/afd1b07fd02df6b8316ca240c7c7a41115eae8de/editor/extension.tsx#L52
  async readSerial() {
    await this.sendPacketAsync(Uint8Array.from([0x83]))
    await this.receivePacketAsync()
  }

  async receivePacketAsync() {
    // console.log('receivePacketAsync ', this.device)
    let final = (res) => {
      if (res.status != 'ok') console.error('USB IN transfer failed')
      let arr = new Uint8Array(res.data.buffer)
      if (arr.length == 0) {
        console.log('array length is 0')
        return this.receivePacketAsync()
      }
      var len = arr[1]
      var str = ''
      for (var i = 2; i < len + 2; ++i) {
        str += String.fromCharCode(arr[i])
      }
      if (str.length > 0) {
        window.postMessage(
          {
            type: 'serial',
            id: 'n/a',
            data: str,
          },
          '*'
        )
      }
      return arr
    }
    return this.device
      .controlTransferIn(
        {
          requestType: 'class',
          recipient: 'interface',
          request: controlTransferGetReport,
          value: controlTransferInReport,
          index: interfaceNumber,
        },
        64
      )
      .then(final)
  }
}

export default MicrobitUSB
