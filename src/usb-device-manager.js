

class USBDeviceManager {
  constructor(UsbDeviceType) {
    this.currentDevice = null
    this.UsbDeviceType = UsbDeviceType

    navigator.usb.addEventListener('connect', (event) => {
      let device = event.device
      if(this.deviceMatches(device, UsbDeviceType)) {
        if (this.currentDevice) {
          this.currentDevice = null
        }
        this.currentDevice = UsbDeviceType(device)
        this.connectDevice()
      }
    })

    navigator.usb.addEventListener('disconnect', (event) => {
      if(event.device == this.currentDevice) {
        window.postMessage({
          type: 'usbdevice::disconnect',
          // id: 'n/a',
          device: this.currentDevice
        }, "*",)
        this.currentDevice = null
      }
    })

    this.findExistingDevice()
  }

  deviceMatches(a, b) {
    a.vendorId == b.vendorId && a.productId == b.productId
  }

  async connectDevice() {
    await this.currentDevice.connect()
    window.postMessage({
      type: 'usbdevice::connect',
      // id: 'n/a',
      device: this.currentDevice
    }, "*",)
  }

  async disconnectDevice() {
    if(!this.currentDevice) {
      return
    }
    await this.currentDevice.disconnect()
    window.postMessage({
      type: 'usbdevice::disconnect',
      // id: 'n/a',
      device: this.currentDevice
    }, "*",)
    this.currentDevice = null
  }

  async findExistingDevice() {
      // Existing devices that have been 'paired'
      return navigator.usb.getDevices().then((devices) => {
        let foundDevice = null
        devices.forEach((device) => {
          console.log('getDevices ', device)
          if(this.deviceMatches(device, this.UsbDeviceType)) {
            foundDevice = this.UsbDeviceType(device)
          }
        })
        return foundDevice
      })
  }

  async addDevice() {
    try {
      // let device = findExistingDevice()
      // if(!device) {
        let filters = [{
          vendorId: this.UsbDeviceType.vendorId, productId: this.UsbDeviceType.productId
        }]
        let device = await navigator.usb.requestDevice({filters})
      // }
      console.log(`addDevice: exists? ${this.currentDevice}`, device)
      this.currentDevice = new this.UsbDeviceType(device)
      
      return this.currentDevice
    } catch (error) {
      // Ignore "no device selected" error.
      return null;
    }
  }
}

export default USBDeviceManager
