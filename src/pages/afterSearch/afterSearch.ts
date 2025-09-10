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
    console.log('[调试] 页面 onShow，开始初始化流程...');
    this.initPage();
  },

  onUnload() {
    console.log('[调试] 页面 onUnload，关闭蓝牙适配器。');
    wx.closeBluetoothAdapter({});
  },

  goBack() {
    wx.navigateBack();
  },

  initPage() {
    console.log('[调试] -> initPage: 重置页面数据，准备打开蓝牙适配器。');
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
    console.log(`[调试] -> connect_blue: 尝试连接设备:`, device);


    this.setData({
      [`blue_deviceList[${index}].state`]: '连接中'
    });

    // 检查设备是否已被绑定 (替换为您的 wx.request)
    // const check_device = await YourApi.check_bed({ mac: device.localName || device.name });
    const isDeviceBound = false; // 模拟API返回

    if (isDeviceBound) {
      console.log('[调试] 设备已被绑定，显示提示框。');
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

    console.log(`[调试] 调用 wx.createBLEConnection， DeviceId: ${device.deviceId}`);
    wx.createBLEConnection({
      deviceId: device.deviceId,
      success: (res) => {
        console.log('[调试] wx.createBLEConnection 成功:', res);
        if (this.data.bluetoothSearched) {
          console.log('[调试] 连接成功，停止蓝牙搜索。');
          this.stopBluetoothDevicesDiscovery();
        }
        this.setData({ connected: true });

        setTimeout(() => {
          this.discoverServicesAndCharacteristics(device, index);
        }, 1000);
      },
      fail: (err) => {
        console.error('[调试] wx.createBLEConnection 失败:', err);
        this.uToast('连接蓝牙失败,请重试');
        this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
      }
    });
  },

 async discoverServicesAndCharacteristics(device: any, index: number) {
      console.log('[调试] -> discoverServicesAndCharacteristics: 开始发现服务和特征值', device);

      const YOUR_SERVICE_UUID = "00008356-0000-1000-8000-00805F9B34FB";


      const YOUR_WRITE_CHARACTERISTIC_UUID = "00009535-0000-1000-8000-00805F9B34FB";

      try {
        const services = await this.getBLEDeviceServices(device);
        if (!services || services.length === 0) {
            console.error('[调试] 未找到任何服务。');
            this.uToast('获取蓝牙服务失败');
            this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
            return;
        }
        console.log('[调试] 获取到的所有服务列表:', services);

        // 从所有服务中，找到我们需要的那个特定服务
        const targetService = services.find(s => s.uuid.toUpperCase() === YOUR_SERVICE_UUID.toUpperCase());

        if (!targetService) {
            console.error(`[调试] 未在设备上找到指定的服务UUID: ${YOUR_SERVICE_UUID}`);
            // 如果找不到，也可以尝试使用第一个服务作为备选方案
            // const targetService = services[0];
            // console.warn(`[调试] 警告: 未找到指定服务，将尝试使用发现的第一个服务: ${targetService.uuid}`);
            this.uToast('找不到指定蓝牙服务');
            this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
            return;
        }

        console.log(`[调试] 成功找到目标服务: ${targetService.uuid}`);
        const characteristics = await this.getBLEDeviceCharacteristics(device.deviceId, targetService.uuid);
        console.log('[调试] 在目标服务下获取到的所有特征值列表:', characteristics);

        // 从该服务的所有特征值中，找到我们需要的那个“可写”的特征值
        const writeCharacteristic = characteristics.find(c => c.uuid.toUpperCase() === YOUR_WRITE_CHARACTERISTIC_UUID.toUpperCase());

        // 也可以通过属性来找，但不推荐，因为一个服务下可能有多个可写的特征值
        // const writeCharacteristic = characteristics.find(c => c.properties.write);

        if (writeCharacteristic) {
            console.log('[调试] 成功找到可写的特征值:', writeCharacteristic);
            this.setData({
                connect_blue_deviceInfo: {
                    deviceId: device.deviceId,
                    serviceId: targetService.uuid,
                    characteristicId: writeCharacteristic.uuid, // 存储写入特征值的ID
                },
                [`blue_deviceList[${index}].state`]: '已连接'
            });
            this.sendPostData(); // 连接成功后跳转
        } else {
            console.error(`[调试] 在服务 ${targetService.uuid} 下未找到指定的写入特征值UUID: ${YOUR_WRITE_CHARACTERISTIC_UUID}`);
            this.uToast('未找到可用特征值');
            this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
        }
      } catch (err) {
          console.error('[调试] 在发现服务或特征值过程中发生异常:', err);
          this.uToast('发现服务/特征值失败');
          this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
      }

      // ======================= 代码修改结束 =======================
  },

  openBluetoothAdapter() {
    console.log('[调试] -> openBluetoothAdapter: 调用 wx.openBluetoothAdapter');
    wx.openBluetoothAdapter({
      success: (e) => {
        console.log('[调试] wx.openBluetoothAdapter 成功:', e);
        this.setData({ bluetoothInited: true });
        this.getBluetoothAdapterState();
      },
      fail: (e) => {
        console.error('[调试] wx.openBluetoothAdapter 失败:', e);
        this.setData({ bluetoothInited: false });
        this.initTypes(e.errCode);
      }
    });
  },

  getBluetoothAdapterState() {
    console.log('[调试] -> getBluetoothAdapterState: 调用 wx.getBluetoothAdapterState');
    wx.getBluetoothAdapterState({
      success: (res) => {
        console.log('[调试] wx.getBluetoothAdapterState 成功:', res);
        if (res.available) {
          console.log('[调试] 蓝牙适配器可用，开始搜索设备...');
          this.startBluetoothDevicesDiscovery();
        } else {
          console.warn('[调试] 蓝牙适配器不可用，提示用户打开蓝牙。');
          this.uToast('请打开手机蓝牙');
        }
      },
      fail: (e) => {
         console.error('[调试] wx.getBluetoothAdapterState 失败:', e);
         this.initTypes(e.errCode);
      }
    });
  },

  startBluetoothDevicesDiscovery() {
    console.log('[调试] -> startBluetoothDevicesDiscovery: 调用 wx.startBluetoothDevicesDiscovery');
    this.setData({ bluetoothSearched: true });
    wx.startBluetoothDevicesDiscovery({
      success: (e) => {
        console.log('[调试] wx.startBluetoothDevicesDiscovery 成功, 开始监听设备发现...', e);
        this.onBluetoothDeviceFound();
      },
      fail: (e) => {
        console.error('[调试] wx.startBluetoothDevicesDiscovery 失败:', e);
        this.setData({ bluetoothSearched: false, isNotDevice: false });
        this.initTypes(e.errCode);
      }
    });
  },

  onBluetoothDeviceFound() {
    console.log('[调试] -> onBluetoothDeviceFound: 注册 wx.onBluetoothDeviceFound 回调。');
    wx.onBluetoothDeviceFound(() => {
      // 使用箭头函数确保 this 指向正确
      // 为了避免频繁调用 getBluetoothDevices，可以加一个定时器或者防抖
      console.log('[调试] wx.onBluetoothDeviceFound 触发，发现新设备，调用 getBluetoothDevices。');
      this.getBluetoothDevices();
    });
  },

  getBluetoothDevices() {
    console.log('[调试] -> getBluetoothDevices: 调用 wx.getBluetoothDevices');
    wx.getBluetoothDevices({
      success: (res) => {
        console.log('[调试] wx.getBluetoothDevices 成功，【所有】发现的设备列表:', res.devices);

        let foundDevices = res.devices.filter(item => item.name && item.name.includes("Baby2Plus"));
        console.log('[调试] 经过名称 "Braha" 过滤后，【符合条件】的设备列表:', foundDevices);

        if (foundDevices.length > 0) {
          let currentDeviceList = this.data.blue_deviceList;
          console.log('[调试] 当前页面已显示的设备列表:', currentDeviceList);

          foundDevices.forEach(newDevice => {
            // 避免重复添加
            if (!currentDeviceList.some(d => d.deviceId === newDevice.deviceId)) {
              console.log(`[调试] 发现一个【新】的 Braha 设备，准备添加到列表:`, newDevice);
              newDevice.state = '未连接';
              currentDeviceList.push(newDevice);
            }
          });

          console.log('[调试] 更新后的完整设备列表，准备 setData:', currentDeviceList);
          this.setData({ blue_deviceList: currentDeviceList });
        } else {
            console.log('[调试] 本次 getBluetoothDevices 调用中，没有发现名称含 "Braha" 的设备。');
        }
      },
      fail: (err) => {
        console.error('[调试] wx.getBluetoothDevices 失败:', err);
      }
    });
  },

  stopBluetoothDevicesDiscovery() {
      console.log('[调试] -> stopBluetoothDevicesDiscovery: 调用 wx.stopBluetoothDevicesDiscovery');
      wx.stopBluetoothDevicesDiscovery({
          success: (res) => {
            console.log('[调试] wx.stopBluetoothDevicesDiscovery 成功', res);
            this.setData({ bluetoothSearched: false });
          },
          fail: (err) => {
            console.error('[调试] wx.stopBluetoothDevicesDiscovery 失败', err);
          }
      });
  },

  sendPostData(){
      console.log('[调试] -> sendPostData: 准备跳转到 inputDevice 页面');
      wx.navigateTo({
          url: `/pages/index/addDevice/inputDevice/inputDevice?sn=${this.data.localSN}&name=${this.data.chooseDevice.name}&mac=${this.data.chooseDevice.deviceId}`
      });
  },

  // 这里为您补充一个Promise封装的示例
  getBLEDeviceServices(device: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceServices({
        deviceId: device.deviceId,
        success: (res) => resolve(res.services),
        fail: reject,
      });
    });
  },

  getBLEDeviceCharacteristics(deviceId: string, serviceId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: (res) => resolve(res.characteristics),
        fail: reject,
      });
    });
  },

  initTypes(code: number) {
    console.error(`[调试] -> initTypes: 蓝牙流程发生错误，错误码: ${code}`);
    const errorMessages: { [key: number]: string } = {
      10000: '未初始化蓝牙适配器',
      10001: '当前蓝牙适配器不可用，请打开系统蓝牙',
      10002: '没有找到指定设备',
      10003: '连接失败',
      10004: '没有找到指定服务',
      10005: '没有找到指定特征值',
      10006: '当前连接已断开',
      10007: '当前特征值不支持此操作',
      10008: '其余所有系统上报的异常',
      10009: 'Android 系统特有，系统版本低于 4.3 不支持 BLE',
      10012: '连接超时',
      10013: '创建连接失败'
    };
    this.uToast(errorMessages[code] || `蓝牙发生未知错误(${code})`);
  },
});