import cameraService from '../../../../lib/cameraService';
import { getXp2pManager } from '../../../../lib/xp2pManager';

Page({
  data: {
    deviceId: '',
    xp2pInfo: '',
    // --- UI的状态 ---
    volume: 80, // 设备音量
    sysAudioOn: true, // 系统提示音开关
    indicatorLightOn: true, // 工作指示灯开关
    isVolumePopupVisible: false, // 控制音量弹出层的显示
  },

  userData: {
    xp2pManager: null as any,
    pageId: `setting-list-page-${Date.now()}`,
    // 用于滑块节流，避免频繁发送指令
    volumeChangeTimer: null as any,
  },

  async onLoad(options: { deviceId?: string; xp2pInfo?: string }) {
    if (options.deviceId && options.xp2pInfo) {
      const decodedXp2pInfo = decodeURIComponent(options.xp2pInfo);
      this.setData({
        deviceId: options.deviceId,
        xp2pInfo: decodedXp2pInfo
      });
      console.log('【摄像机设置页】已接收到设备ID:', options.deviceId);

      this.userData.xp2pManager = getXp2pManager();

      try {
        wx.showLoading({ title: '连接设备中...' });

        await this.userData.xp2pManager.startP2PService({
          p2pMode: 'ipc',
          deviceInfo: {
            deviceId: options.deviceId,
            productId: options.deviceId.split('/')[0],
            deviceName: options.deviceId.split('/')[1],
            isMjpgDevice: false,
          },
          xp2pInfo: decodedXp2pInfo,
          caller: this.userData.pageId,
        });

        console.log('【摄像机设置页】P2P服务启动成功。');
        cameraService.setActiveDevice(options.deviceId);

        await this.fetchDeviceStatus();

      } catch (error: any) {
        console.error('【摄像机设置页】P2P服务启动失败:', error);
        wx.showModal({
          title: '连接失败',
          content: `无法连接到设备(${error.errMsg || '未知错误'})`,
          showCancel: false,
          success: () => wx.navigateBack(),
        });
      } finally {
        wx.hideLoading();
      }

    } else {
      console.error('【摄像机设置页】缺少 deviceId 或 xp2pInfo 参数');
      wx.navigateBack();
    }
  },

  onUnload() {
    if (this.data.deviceId && this.userData.xp2pManager) {
      this.userData.xp2pManager.stopP2PService(this.data.deviceId, this.userData.pageId);
    }
  },

  async fetchDeviceStatus() {
    console.log('【摄像机设置页】正在获取设备状态...');
    try {
      const res = await cameraService.sendCommand('CHECK_ONLINE');
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);
        console.log('【摄像机设置页】获取到设备状态:', status);
        this.setData({
          volume: parseInt(status.Volume, 10) || 80,
          sysAudioOn: status.AUDIO === '1',
          indicatorLightOn: status.LED === '1'
        });
      }
    } catch (error) {
      console.error('【摄像机设置页】获取设备状态失败:', error);
      wx.showToast({ title: '获取设备状态失败', icon: 'none' });
    }
  },

  // --- 事件处理函数 ---

  /**
   * 跳转到其他设置页
   */
  navigateToSetting(e: WechatMiniprogram.BaseEvent) {
    const pageUrl = e.currentTarget.dataset.url;
    const { deviceId, xp2pInfo } = this.data;
    if (!pageUrl || !deviceId) return;

    const fullUrl = `${pageUrl}?deviceId=${deviceId}&xp2pInfo=${encodeURIComponent(xp2pInfo)}`;
    wx.navigateTo({ url: fullUrl });
  },

  /**
   * 显示音量调节弹窗
   */
  showVolumePopup() {
    this.setData({ isVolumePopupVisible: true });
  },

  /**
   * 隐藏音量调节弹窗
   */
  hideVolumePopup() {
    this.setData({ isVolumePopupVisible: false });
  },

  /**
   * 滑块滑动时触发，更新UI并使用节流发送指令
   */
  onVolumeChange(e: WechatMiniprogram.TouchEvent) {
    const newVolume = e.detail.value;
    // 实时更新UI
    this.setData({ volume: newVolume });

    // 清除上一个定时器
    if (this.userData.volumeChangeTimer) {
      clearTimeout(this.userData.volumeChangeTimer);
    }

    // 设置一个节流定时器，200毫秒后发送指令
    this.userData.volumeChangeTimer = setTimeout(() => {
      console.log(`【摄像机设置页】发送音量指令: ${newVolume}`);
      cameraService.sendCommand(`SET_SPEAKER_VOLUME,${newVolume}`)
        .catch(err => {
          console.error('【摄像机设置页】设置音量失败:', err);
          wx.showToast({ title: '音量设置失败', icon: 'error' });
        });
    }, 200);
  },

  /**
   * 系统提示音开关
   */
  onSysAudioChange(e: WechatMiniprogram.TouchEvent) {
    const value = e.detail.value;
    const commandValue = value ? '1' : '0';
    console.log(`【摄像机设置页】系统提示音开关切换为: ${value}, 发送指令值: ${commandValue}`);

    this.setData({ sysAudioOn: value });

    cameraService.sendCommand(`SYS_AUDIO,${commandValue}`)
      .then(() => wx.showToast({ title: '设置成功', icon: 'success' }))
      .catch(err => {
        console.error('【摄像机设置页】设置系统提示音失败:', err);
        wx.showToast({ title: '设置失败', icon: 'error' });
        this.setData({ sysAudioOn: !value }); // 失败回滚
      });
  },

  /**
   * 摄像机工作指示灯开关
   */
  onIndicatorLightChange(e: WechatMiniprogram.TouchEvent) {
    const value = e.detail.value;
    const commandValue = value ? '1' : '0';
    console.log(`【摄像机设置页】工作指示灯开关切换为: ${value}, 发送指令值: ${commandValue}`);

    this.setData({ indicatorLightOn: value });

    // 文档中没有直接控制指示灯的指令，这里假设指令为 "LED"
    // 如果指令不同，请修改此处
    cameraService.sendCommand(`LED,${commandValue}`)
      .then(() => wx.showToast({ title: '设置成功', icon: 'success' }))
      .catch(err => {
        console.error('【摄像机设置页】设置指示灯失败:', err);
        wx.showToast({ title: '设置失败', icon: 'error' });
        this.setData({ indicatorLightOn: !value }); // 失败回滚
      });
  },
});