// pages/index/addDevice/newDevice.ts

// 获取全局 app 实例
const app = getApp();

Page({
  data: {
    productId: '',
    deviceIotName: '',
    bed_id: -1, // 关联的床ID
  },

  onLoad(options: { bed_id?: string }) {
    if (options.bed_id) {
      this.setData({
        bed_id: parseInt(options.bed_id, 10),
      });
    }
  },

  /**
   * 监听产品ID输入
   */
  onProductIdInput(event: WechatMiniprogram.Input) {
    this.setData({
      productId: event.detail.value,
    });
  },

  /**
   * 监听设备ID输入
   */
  onDeviceIdInput(event: WechatMiniprogram.Input) {
    this.setData({
      deviceIotName: event.detail.value,
    });
  },

  /**
   * 扫码识别
   */
  scanCode() {
    wx.scanCode({
      scanType: ['qrCode'],
      success: (res) => {
        try {
          const result = JSON.parse(res.result);
          if (result.ProductId && result.DeviceName) {
            this.setData({
              productId: result.ProductId,
              deviceIotName: result.DeviceName,
            });
          } else {
            this.showToast('二维码格式不正确');
          }
        } catch (error) {
          this.showToast('无法解析二维码');
        }
      },
      fail: () => {
        this.showToast('扫码失败');
      }
    });
  },

  /**
   * 确认添加按钮
   */
  confirmBtn() {
    if (!this.data.productId || !this.data.deviceIotName) {
      this.showToast('请输入完整的设备信息！');
      return;
    }

    // 实际项目中应替换为真实的 API 请求
    this.addCameraDevice();
  },

  /**
   * 添加摄像头设备 (API 请求)
   */
  addCameraDevice() {
    const that = this;
    const params = {
      productName: this.data.productId,
      productDeviceName: this.data.deviceIotName,
      userid: app.globalData.userInfo.userid,
      product_bed_id: this.data.bed_id,
    };

    // wx.request({
    //   url: 'YOUR_API_ENDPOINT/addCamera',
    //   method: 'POST',
    //   data: params,
    //   success(res) {
    //     if (res.data.success) { // 假设接口返回 { success: true, ... }
    //       app.globalData.allDeviceList = []; // 清空全局设备列表缓存
    //       that.checkDeviceStatus();
    //     } else {
    //       that.showToast(res.data.msg || '添加失败');
    //     }
    //   },
    //   fail() {
    //     that.showToast('请求失败');
    //   }
    // });

    // --- 以下为模拟成功逻辑 ---
    app.globalData.allDeviceList = [];
    this.checkDeviceStatus();
  },

  /**
   * 检查设备状态 (模拟)
   */
  checkDeviceStatus() {
    // 假设设备未配网，所以 result.data 为 0
    const deviceIsOnline = false;

    if (deviceIsOnline) {
      this.showToast('添加成功', () => {
        wx.switchTab({ url: '/pages/index/index' });
      });
    } else {
      // 显示配网提示
      wx.showModal({
        title: '提示',
        content: '添加成功, 是否立即配网？',
        confirmColor: '#BDA01E',
        success: (res) => {
          if (res.confirm) {
            this.navigateToNetworkConfig();
          } else if (res.cancel) {
            wx.switchTab({ url: '/pages/index/index' });
          }
        }
      });
    }
  },

  /**
   * 跳转到配网页面
   */
  navigateToNetworkConfig() {
    const { productId, deviceIotName } = this.data;
    wx.navigateTo({
      url: `/pages/index/cameraPlay/addCamera?productId=${productId}&deviceName=${deviceIotName}`
    });
  },

  /**
   * 封装 wx.showToast
   */
  showToast(title: string, callback?: () => void) {
      wx.showToast({
          title,
          icon: 'none',
          duration: 2000,
          complete: callback
      });
  }
});