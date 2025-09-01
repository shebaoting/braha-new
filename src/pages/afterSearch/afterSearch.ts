// pages/index/searchDevice/afterSearch.ts
// @ts-nocheck

const app = getApp();

Page({
  data: {
    title: '',
    blue_deviceList: [] as any[],
    isNotDevice: true,
    bluetoothInited: false,
    bluetoothSearched: false,
    connected: false,
    connect_blue_deviceInfo: null,
    chooseDevice: {},
    localSN: '',
  },

  onLoad() {
    this.setData({
      title: `${app.globalData.userInfo.nickname}的家`
    });
  },

  onShow() {
    this.initPage();
  },

  onUnload() {
    wx.closeBluetoothAdapter({});
  },

  goBack() {
    wx.navigateBack();
  },

  initPage() {
    this.setData({
      isNotDevice: true,
      blue_deviceList: [],
    });
    this.openBluetoothAdapter();
  },

  uToast(title: string) {
    wx.showToast({ title, icon: 'none' });
  },

  // --- 蓝牙核心逻辑 ---

  async connect_blue(e: WechatMiniprogram.BaseEvent) {
    const device = e.currentTarget.dataset.device;
    const index = e.currentTarget.dataset.index;

    this.setData({
      [`blue_deviceList[${index}].state`]: '连接中'
    });

    // 检查设备是否已被绑定 (替换为您的 wx.request)
    // const check_device = await YourApi.check_bed({ mac: device.localName || device.name });
    const isDeviceBound = false; // 模拟API返回

    if (isDeviceBound) {
      wx.showModal({
        title: '提示',
        content: '该设备已被绑定,请联系设备管理员',
        showCancel: false,
        confirmColor: '#BEA121'
      });
      this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
      return;
    }

    this.setData({ chooseDevice: device });

    wx.createBLEConnection({
      deviceId: device.deviceId,
      success: (res) => {
        if (this.data.bluetoothSearched) {
          this.stopBluetoothDevicesDiscovery();
        }
        this.setData({ connected: true });

        setTimeout(() => {
          this.discoverServicesAndCharacteristics(device, index);
        }, 1000);
      },
      fail: (err) => {
        this.uToast('连接蓝牙失败,请重试');
        this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
      }
    });
  },

  async discoverServicesAndCharacteristics(device: any, index: number) {
      const services = await this.getBLEDeviceServices(device);
      // 假设我们总是使用第一个服务
      const serviceId = services[0].uuid;

      const characteristics = await this.getBLEDeviceCharacteristics(device.deviceId, serviceId);
      // 假设我们使用第一个可读写的特征值
      const writeCharacteristic = characteristics.find(c => c.properties.write && c.properties.read);

      if (writeCharacteristic) {
          this.setData({
              connect_blue_deviceInfo: {
                  deviceId: device.deviceId,
                  serviceId: serviceId,
                  characteristicId: writeCharacteristic.uuid,
              },
              [`blue_deviceList[${index}].state`]: '已连接'
          });
          this.sendPostData(); // 连接成功后跳转
      } else {
          this.uToast('未找到可用特征值');
          this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
      }
  },

  openBluetoothAdapter() {
    wx.openBluetoothAdapter({
      success: (e) => {
        this.setData({ bluetoothInited: true });
        this.getBluetoothAdapterState();
      },
      fail: (e) => {
        this.setData({ bluetoothInited: false });
        this.initTypes(e.errCode);
      }
    });
  },

  getBluetoothAdapterState() {
    wx.getBluetoothAdapterState({
      success: (res) => {
        if (res.available) {
          this.startBluetoothDevicesDiscovery();
        } else {
          this.uToast('请打开手机蓝牙');
        }
      },
      fail: (e) => {
         this.initTypes(e.errCode);
      }
    });
  },

  startBluetoothDevicesDiscovery() {
    this.setData({ bluetoothSearched: true });
    wx.startBluetoothDevicesDiscovery({
      success: (e) => {
        this.onBluetoothDeviceFound();
      },
      fail: (e) => {
        this.setData({ bluetoothSearched: false, isNotDevice: false });
        this.initTypes(e.errCode);
      }
    });
  },

  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound(() => {
      this.getBluetoothDevices();
    });
  },

  getBluetoothDevices() {
    wx.getBluetoothDevices({
      success: (res) => {
        let foundDevices = res.devices.filter(item => item.name && item.name.includes("Braha"));
        if (foundDevices.length > 0) {
          let currentDeviceList = this.data.blue_deviceList;
          foundDevices.forEach(newDevice => {
            // 避免重复添加
            if (!currentDeviceList.some(d => d.deviceId === newDevice.deviceId)) {
              newDevice.state = '未连接';
              currentDeviceList.push(newDevice);
            }
          });
          this.setData({ blue_deviceList: currentDeviceList });
        }
      }
    });
  },

  stopBluetoothDevicesDiscovery() {
      wx.stopBluetoothDevicesDiscovery({
          success: () => { this.setData({ bluetoothSearched: false }); }
      });
  },

  sendPostData(){
      wx.navigateTo({
          url: `/pages/index/addDevice/inputDevice/inputDevice?sn=${this.data.localSN}&name=${this.data.chooseDevice.name}&mac=${this.data.chooseDevice.deviceId}`
      });
  },

  // ... 其他蓝牙辅助函数 ...
  initTypes(code: number) {
    const errorMessages: { [key: number]: string } = {
      10001: '未检测到蓝牙，请打开蓝牙重试！'
      // ... 其他错误码
    };
    this.uToast(errorMessages[code] || '蓝牙发生未知错误');
  },
});