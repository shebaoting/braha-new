// pages/index/cameraPlay/addCamera.ts
// @ts-nocheck

let countdownTimer: any = null; // 用于存储倒计时器

Page({
  data: {
    popup_show: false,
    current: 0,
    set_wifi: false, // true for Wi-Fi connect, false for QR code

    WifiInfo: {
      SSID: '',
      password: ''
    },

    iseye: false, // false = password hidden
    wifi_show: false,
    theList: [] as WechatMiniprogram.WifiInfo[],
    chooseIndex: -1,

    codeUrl: '',
    productId: '',
    deviceName: '',

    isknow: false, // Flag to check if returning from Wi-Fi settings
    tips: '60', // Countdown text
    tipstext: '配置WiFi结果，由于设备型号不同，请以设备提示为准，为此带来的不便，敬请谅解.',

    wifiInitialized: false // 新增一个状态，标记Wi-Fi是否已初始化
  },

  onLoad(options: any) {
    this.setData({
      productId: options.productId,
      deviceName: options.deviceName,
    });
  },

  onShow() {
    // 【修正】页面显示时不再自动初始化Wi-Fi，只在需要时（例如从系统设置返回）检查网络状态
    if (this.data.isknow) {
      this.checkConnectedWifi();
    }
  },

  onUnload() {
    this.stopCountdown();
  },

  // --- UI Event Handlers ---
  setWifi(e: WechatMiniprogram.BaseEvent) {
    const type = parseInt(e.currentTarget.dataset.type, 10);
    this.setData({
      set_wifi: type === 1,
      popup_show: true,
    });
  },

  confirmExit() {
    wx.showModal({
      title: '提示',
      content: '您确定要退出吗？',
      confirmColor: '#BDA01E',
      success: (res) => {
        if (res.confirm) {
          this.exitPop();
        }
      }
    });
  },

  exitPop() {
    this.setData({
      popup_show: false,
      current: 0,
      set_wifi: false,
    });
    this.stopCountdown();
  },

  toggleEye() {
    this.setData({ iseye: !this.data.iseye });
  },

  async showWifiList() {
    // 【修正】在用户点击“选择Wi-Fi”时，才进行初始化和权限请求
    if (!this.data.wifiInitialized) {
      try {
        await wx.startWifi({});
        this.setData({ wifiInitialized: true });
        this.reloadWifi(); // 初始化成功后加载列表
      } catch (err) {
        console.error('Wi-Fi init error:', err);
        wx.showToast({ title: '请先开启手机Wi-Fi和定位服务', icon: 'none' });
        return;
      }
    } else {
      this.reloadWifi(); // 如果已初始化，直接加载列表
    }
    this.setData({ wifi_show: true });
  },

  hideWifiList() {
    this.setData({ wifi_show: false });
  },

  // --- Logic Methods ---
  nextStep(e: WechatMiniprogram.BaseEvent) {
    const step = parseInt(e.currentTarget.dataset.step, 10);

    if (step === 2) {
      if (!this.data.WifiInfo.SSID || !this.data.WifiInfo.password) {
        wx.showToast({ title: "请选择Wi-Fi和输入Wi-Fi密码", icon: 'none' });
        return;
      }
      if (!this.data.set_wifi) {
        const qrData = encodeURIComponent(JSON.stringify(this.data.WifiInfo));
        this.setData({
          codeUrl: `https://api.pwmqr.com/qrcode/create/?url=${qrData}`
        });
        this.startCountdown();
      }
      this.setData({ current: step });
    } else if (step === 3) {
      this.setData({ isknow: true });
      this.connectToDeviceWifi();
    } else {
      this.setData({ current: step });
    }
  },

  backStep() {
    if (!this.data.set_wifi && this.data.current === 2) {
      this.stopCountdown();
    }
    this.setData({ current: this.data.current - 1 });
  },

  // --- Wi-Fi Logic ---
  async checkConnectedWifi() {
    // 仅检查当前连接的Wi-Fi，不主动扫描，避免权限问题
    try {
      const netRes = await wx.getNetworkType();
      if (netRes.networkType === 'wifi') {
        const wifiRes = await wx.getConnectedWifi({});
        console.log(`已连接的Wifi信息：${wifiRes.wifi.SSID}`);

        if (this.data.isknow) {
          this.setData({ isknow: false });
          if (wifiRes.wifi.SSID.toLowerCase().includes("care")) {
            this.setCameraWifi();
          } else {
            wx.showToast({ title: '请连接正确的设备Wi-Fi', icon: 'error' });
          }
        } else {
          this.setData({ 'WifiInfo.SSID': wifiRes.wifi.SSID });
        }
      }
    } catch(err) {
      console.log('获取已连接WiFi失败', err);
    }
  },

  reloadWifi() {
      wx.getWifiList({
          success: () => {
              wx.onGetWifiList((result) => {
                  const filteredList = result.wifiList.filter(item => !!item.SSID);
                  this.setData({ theList: filteredList });
              });
          },
          fail: (err) => {
              wx.showToast({title: '获取Wi-Fi列表失败', icon: 'none'})
              console.error(err);
          }
      });
  },

  chooseSSID(e: WechatMiniprogram.BaseEvent) {
    const { item, index } = e.currentTarget.dataset;
    this.setData({
      'WifiInfo.SSID': item.SSID,
      chooseIndex: index,
      wifi_show: false
    });
  },

  connectToDeviceWifi() {
    wx.showModal({
        title: '操作提示',
        content: '请前往手机系统设置，手动连接到以 "Care-AP" 开头的Wi-Fi，密码为 "12345678"，连接成功后请返回小程序。',
        showCancel: false,
        confirmText: '好的',
        confirmColor: '#BDA01E',
    });
  },

  setCameraWifi() {
    this.setData({ current: 3 });
    const data = {
      enable: 1, dhcp: 1, ssid: this.data.WifiInfo.SSID, pwd: this.data.WifiInfo.password
    };
    console.log('Sending Wi-Fi credentials to device:', data);
    this.startCountdown();
  },

  // --- Countdown Logic ---
  startCountdown() {
    this.stopCountdown();
    this.setData({ tips: '60' });
    countdownTimer = setInterval(() => {
      let seconds = parseInt(this.data.tips, 10) - 1;

      if (seconds % 2 === 0) {
        this.checkDeviceStatus();
      }

      if (seconds <= 0) {
        this.stopCountdown();
        this.setData({ tips: '0' });
        this.showResultModal('配置超时，请重试');
      } else {
        this.setData({ tips: seconds.toString() });
      }
    }, 1000);
  },

  stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  },

  checkDeviceStatus() {
    console.log(`Checking device status for ${this.data.productId}/${this.data.deviceName}`);
  },

  showResultModal(content: string) {
    wx.showModal({
      title: '提示',
      content: content,
      showCancel: false,
      confirmText: '确定',
      confirmColor: '#BDA01E',
      success: () => {
        wx.switchTab({ url: '/pages/index/index' });
      }
    });
  }
});