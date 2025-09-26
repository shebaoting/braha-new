import cameraService from '../../../../lib/cameraService';

Page({
  data: {
    deviceId: '',
    // --- UI的状态 ---
    recordTime: '15',
    showAiBox: true,
  },

  onLoad(options: { deviceId?: string }) {
    if (options.deviceId) {
      this.setData({
        deviceId: options.deviceId
      });
      console.log('【设置首页】已接收到设备ID:', options.deviceId);
      cameraService.setActiveDevice(options.deviceId);
      console.log('【设置首页】已在 CameraService 中将此设备设置问活动设备。');

      // 现在可以安全地获取设备状态了
      this.fetchDeviceStatus();

    } else {
      console.error('【设置首页】未接收到设备ID，无法进行后续操作。');
      wx.showToast({
        title: '设备信息缺失',
        icon: 'error',
        duration: 2000,
        complete: () => {
          wx.navigateBack();
        }
      });
    }
  },

  /**
   * 获取设备当前状态，用于初始化页面UI
   */
  async fetchDeviceStatus() {
    console.log('【设置首页】正在获取设备初始状态...');
    try {
      // 现在的调用应该是安全的
      const res = await cameraService.sendCommand('CHECK_ONLINE');
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);
        console.log('【设置首页】获取到设备状态:', status);
        this.setData({
          recordTime: status.RECORDTIME || '15',
          showAiBox: status.AIBOX === '0',
        });
      }
    } catch (error) {
      console.error('【设置首页】获取设备状态失败:', error);
      wx.showToast({ title: '获取设备状态失败', icon: 'none' });
    }
  },

  /**
   * 消息录像时长变更事件
   */
  onRecordTimeChange(e: WechatMiniprogram.TouchEvent) {
    const newTime = e.detail.value;
    console.log('【设置首页】录像时长变更为:', newTime);

    this.setData({ recordTime: newTime });

    cameraService.sendCommand(`SET_RECORD_TIMES,${newTime}`)
      .then(() => {
        wx.showToast({ title: '设置成功', icon: 'success' });
      })
      .catch(err => {
        console.error('【设置首页】设置录像时长失败:', err);
        wx.showToast({ title: '设置失败', icon: 'error' });
      });
  },

  /**
   * AI检测框开关变更事件
   */
  onAiBoxChange(e: WechatMiniprogram.TouchEvent) {
    const isShow = e.detail.value;
    const commandValue = isShow ? '0' : '1';
    console.log(`【设置首页】AI检测框开关切换为: ${isShow}, 发送指令值: ${commandValue}`);

    this.setData({ showAiBox: isShow });

    cameraService.sendCommand(`DISABLE_AIBOX,${commandValue}`)
      .then(() => {
        wx.showToast({ title: '设置成功', icon: 'success' });
      })
      .catch(err => {
        console.error('【设置首页】设置AI检测框失败:', err);
        wx.showToast({ title: '设置失败', icon: 'error' });
        this.setData({ showAiBox: !isShow });
      });
  },

  /**
   * 重启摄像机点击事件
   */
  onRebootTap() {
    wx.showModal({
      title: '确认重启',
      content: '您确定要重启摄像机吗？此操作将导致设备短暂离线。',
      confirmColor: '#BDA01E',
      success: (res) => {
        if (res.confirm) {
          console.log('【设置首页】用户确认重启，发送重启指令...');
          wx.showLoading({ title: '正在发送指令...' });

          cameraService.sendCommand('REBOOT_DEVICE')
            .then(() => {
              wx.hideLoading();
              wx.showToast({ title: '重启指令已发送', icon: 'success' });
            })
            .catch(err => {
              wx.hideLoading();
              console.error('【设置首页】发送重启指令失败:', err);
              wx.showToast({ title: '操作失败', icon: 'error' });
            });
        }
      }
    });
  },

  /**
   * 通用的设置页面跳转处理函数
   */
  navigateToSetting(e: WechatMiniprogram.BaseEvent) {
    const pageUrl = e.currentTarget.dataset.url;

    if (!pageUrl) {
      console.error("目标页面的URL未在WXML中通过 data-url 指定。");
      return;
    }

    if (!this.data.deviceId) {
      wx.showToast({ title: '设备信息丢失，无法跳转', icon: 'none' });
      return;
    }

    const fullUrl = `${pageUrl}?deviceId=${this.data.deviceId}`;

    console.log('【设置首页】准备跳转到:', fullUrl);
    wx.navigateTo({
      url: fullUrl,
      fail: (err) => {
        console.error('【设置首页】页面跳转失败:', err);
      }
    });
  }
});