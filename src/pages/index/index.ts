import { bedDeviceApi } from '../../utils/api';

const app = getApp();

Page({
  data: {
    error_show: false,
    errmsg: '',
    camera_show: false,
    camera_net: false,
    deviceList: [] as any[],
    open_Show: false,
    active_model: {} as any,
    menu_item_list: [
      {
        active_icon: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_nbt_sel.png',
        active_normol: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_nbt_nor.png',
        current: 0,
        name: '尿布台',
        isLight: false,
        power_active: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_sel.png',
        power_enabel: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_nor.png',
        cmd: 'AA0103010100',
        img: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/index/img_tc_nbt.png'
      },
      {
        active_icon: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_sc_sel.png',
        active_normol: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_sc_nor.png',
        current: 1,
        name: '睡床',
        isLight: false,
        power_active: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_sel.png',
        power_enabel: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_nor.png',
        cmd: 'AA0103010200',
        img: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/index/img_tc_sc.png'
      },
      {
        active_icon: "http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_yxc_sel.png",
        active_normol: "http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_yxc_nor.png",
        current: 2,
        name: '游戏床',
        isLight: false,
        power_active: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_sel.png',
        power_enabel: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_nor.png',
        cmd: 'AA0103010300',
        img: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/index/img_tc_ysc.png'
      }
    ],
    light_info: {
      active_icon: "http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_yd_sel.png",
      active_normol: "http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_yd_nor.png",
      name: '夜灯',
      power_active: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_sel.png',
      power_enabel: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_nor.png',
      cmd: 'AA0103020111', //夜灯开
      cmd2: 'AA0103020100', //夜灯关
    },
    deviceCurrent: 0,
    blue_show: false,
    modal_show: false,
    bluetoothInited: false,
    bluetoothSearched: false,
    connected: false,
    connect_blue_deviceInfo: null as any,
    modal_content: '',
    popupShow: false,
    backgroundImage: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/swiper/img_cp_yd.png',
    deviceCurrentChange: false,
    noticeShow: false,
    noticeInfo: {} as any,
    navPopupShow: false,
  },

  onLoad() {
    this.checkNotice();
  },

  onShow() {
    if (this.getTabBar() && this.getTabBar().init) {
      this.getTabBar().init()
    }
      this.getDeviceList();
  },

  onIconTap() {
    this.setData({
      navPopupShow: !this.data.navPopupShow
    });
  },

  hideNavPopup() {
    this.setData({
      navPopupShow: false
    });
  },

  show_popu() {
    this.setData({ popupShow: true });
  },

  hide_popu() {
    this.setData({ popupShow: false });
  },

  deviceChange(e: WechatMiniprogram.BaseEvent) {
    const newIndex = e.currentTarget.dataset.index;
    this.setData({
      deviceCurrent: newIndex,
      deviceCurrentChange: true,
      bluetoothInited: false,
      bluetoothSearched: false,
      connected: false,
    });
    wx.closeBluetoothAdapter({});
    this.connectDevice_event();
  },

  pages_to(e: WechatMiniprogram.BaseEvent) {
    const url = e.currentTarget.dataset.url;
    // 点击菜单项后，先关闭菜单再跳转
    this.hideNavPopup();
    this.hide_popu(); // 同时关闭另一个popup

    if (url === 'camera') {
      // Handle camera logic
      console.log('Camera button clicked');
    } else {
      wx.navigateTo({ url });
    }
  },

  onScan() {
    this.hideNavPopup();
    this.setData({ popupShow: false });
    wx.scanCode({
      scanType: ['qrCode'],
      success: (res) => {
        console.log(res.result);
        // Handle scanned QR code logic
      },
      fail: () => {
        this.uToast('扫码失败');
      }
    });
  },

  modal_show_event(e: WechatMiniprogram.BaseEvent) {
    const item = e.currentTarget.dataset.item;
    let content_msg = '';
    if (this.data.deviceList[this.data.deviceCurrent].isconnected) {
      content_msg = `确定要打开${item.name}吗？`; // Simplified

      wx.showModal({
        title: '提示',
        content: content_msg,
        success: (res) => {
          if (res.confirm) {
            this.setData({ active_model: item });
            this.blue_write();
          }
        }
      });
    } else {
      this.uToast("设备未连接");
    }
  },


  async getDeviceList() {
    try {
      const res = await bedDeviceApi.getBedList();
      if (res.data && res.data.code === 0) {
        const list = res.data.data.list || [];
        const formattedList = list.map((item: any) => ({
          ...item,
          productName: item.bedName,
          bedname: item.bedName,
          isconnected: false,
          bedCmd: -1,
          islight: false
        }));

        this.setData({ deviceList: formattedList });
        app.globalData.allDeviceList = formattedList;

        // 如果获取到设备列表，则初始化蓝牙
        if (formattedList.length > 0) {
          this.pageInitBule();
        }
      } else {
        this.uToast(res.data.msg || '获取设备列表失败');
        this.setData({ deviceList: [] });
      }
    } catch (error: any) {
      console.error('getDeviceList error:', error);
      this.uToast(error.message || '网络错误，请稍后再试');
      this.setData({ deviceList: [] });
    }
  },

  async connectDevice_event() {
    await this.getDeviceList();

  },

  uToast(title: string) {
    wx.showToast({ title, icon: 'none' });
  },

  pageInitBule() {
    this.openBluetoothAdapter();
  },

  openBluetoothAdapter() {
    wx.openBluetoothAdapter({
      success: (e) => {
        this.setData({ bluetoothInited: true });
        this.onBLEConnectionStateChange();
        this.getBluetoothAdapterState();
      },
      fail: (e) => {
        this.setData({ bluetoothInited: false });
        this.initTypes(e.errCode);
      },
    });
  },

  getBluetoothAdapterState() {
    wx.getBluetoothAdapterState({
      success: (res) => {
        if (res.available) {
          this.startBluetoothDevicesDiscovery();
        }
      }
    });
  },

  startBluetoothDevicesDiscovery() {
    if (this.data.bluetoothSearched) return;
    this.setData({ bluetoothSearched: true });
    wx.startBluetoothDevicesDiscovery({
      success: (e) => {
        this.onBluetoothDeviceFound();
      },
      fail: (e) => {
        this.setData({ bluetoothSearched: false });
      }
    });
  },

  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound(() => {
      this.getBluetoothDevices();
    });
  },

  getBluetoothDevices() {
    const that = this;
    wx.getBluetoothDevices({
      success: (res) => {
        const currentDeviceName = that.data.deviceList[that.data.deviceCurrent].bedname;
        const foundDevice = res.devices.find(d => d.name && d.name.includes(currentDeviceName));
        if (foundDevice) {
          that.createBLEConnection(foundDevice);
        }
      }
    });
  },

  createBLEConnection(device: any) {
    const that = this;
    wx.createBLEConnection({
      deviceId: device.deviceId,
      success: () => {
        that.stopBluetoothDevicesDiscovery();
        that.setData({ connected: true });
        that.getBLEDeviceServices(device);
      },
    });
  },

  getBLEDeviceServices(device: any) {
    const that = this;
    wx.getBLEDeviceServices({
      deviceId: device.deviceId,
      success: (res) => {
      }
    });
  },

  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery({});
  },

  onBLEConnectionStateChange() {
    const that = this;
    wx.onBLEConnectionStateChange((res) => {
      const isConnected = res.connected;
      that.setData({
        [`deviceList[${that.data.deviceCurrent}].isconnected`]: isConnected
      });
      if (!isConnected) {
        that.setData({
          [`deviceList[${that.data.deviceCurrent}].bedCmd`]: -1,
          [`deviceList[${that.data.deviceCurrent}].islight`]: false,
        });
      }
    });
  },

  blue_write() {
    const buffer = this.getBluetoothInstruct(this.data.active_model.cmd);
    wx.writeBLECharacteristicValue({
      deviceId: this.data.connect_blue_deviceInfo.deviceId,
      serviceId: this.data.connect_blue_deviceInfo.serviceId,
      characteristicId: this.data.connect_blue_deviceInfo.characteristicId,
      value: buffer,
      success: (res) => {
        console.log('Write success');
      }
    });
  },

  getBluetoothInstruct(hexStr: string) {
    const typedArray = new Uint8Array(hexStr.match(/[\da-f]{2}/gi)!.map(h => parseInt(h, 16)));
    return typedArray.buffer;
  },

  initTypes(code: number) {
    const errorMessages: { [key: number]: string } = {
      10001: '未检测到蓝牙，请打开蓝牙重试！',
      10002: '沒有找到指定设备',
      10003: '连接失败',
    };
    const msg = errorMessages[code] || '未知蓝牙错误';
    this.uToast(msg);
  },

  async checkNotice() {
  }
});