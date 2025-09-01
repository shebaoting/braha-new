// pages/index/addDevice/inputDevice/inputDevice.ts

// 获取小程序全局实例
const app = getApp();

Page({
  data: {
    deviceName: '',
    sn: '',
    blueName: '',
    mac: '',
    isAdding: false, // 防止重复点击
  },

  /**
   * 生命周期函数--监听页面加载
   * 获取从上个页面传来的参数
   */
  onLoad(options: { sn: string; name: string; mac: string }) {
    this.setData({
      sn: options.sn || '',
      blueName: options.name || '',
      mac: options.mac || '',
    });
  },

  /**
   * 监听输入框内容变化
   */
  onDeviceNameInput(event: WechatMiniprogram.Input) {
      this.setData({
          deviceName: event.detail.value
      });
  },

  /**
   * 确认添加设备
   */
  async confirmBtn() {
    if (this.data.isAdding) {
      return; // 如果正在添加，则不执行任何操作
    }

    if (!this.data.deviceName.trim()) {
      wx.showToast({
        title: '请输入设备别名',
        icon: 'none',
      });
      return;
    }

    this.setData({ isAdding: true });
    wx.showLoading({
      title: '设备添加中',
      mask: true,
    });

    // 模拟API调用，请替换为您的真实API请求
    wx.request({
      url: 'YOUR_API_ENDPOINT/addbed', // 替换为您的API地址
      method: 'POST',
      data: {
        userid: app.globalData.userInfo.userid,
        productSN: this.data.sn,
        deviceName: this.data.deviceName,
        name: this.data.blueName,
        mac: this.data.mac,
      },
      success: (res) => {
        // 假设API返回成功
        if (res.statusCode === 200) {
          app.globalData.allDeviceList = []; // 清空全局设备列表缓存
          wx.showToast({
            title: '添加成功',
            icon: 'success',
          });

          // 2秒后跳转到首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index',
            });
          }, 2000);

        } else {
          // 处理API错误
          wx.showToast({
            title: '添加失败，请重试',
            icon: 'none',
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none',
        });
      },
      complete: () => {
        wx.hideLoading();
        this.setData({ isAdding: false });
      },
    });
  },
});