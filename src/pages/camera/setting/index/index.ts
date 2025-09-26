import cameraService from '../../../../lib/cameraService';
import { getXp2pManager } from '../../../../lib/xp2pManager';

Page({
  data: {
    deviceId: '',
    xp2pInfo: '', // 新增，用于存储 xp2pInfo
    recordTime: '15',
    showAiBox: true,
  },

  userData: {
    xp2pManager: null as any,
    pageId: `setting-index-page-${Date.now()}`,
  },

  async onLoad(options: { deviceId?: string; xp2pInfo?: string }) { // 增加 xp2pInfo
    if (options.deviceId && options.xp2pInfo) {
      const decodedXp2pInfo = decodeURIComponent(options.xp2pInfo);
      this.setData({
        deviceId: options.deviceId,
        xp2pInfo: decodedXp2pInfo
      });
      console.log('【设置首页】已接收到设备ID:', options.deviceId);
      console.log('【设置首页】已接收到xp2pInfo:', decodedXp2pInfo);

      this.userData.xp2pManager = getXp2pManager();

      try {
        wx.showLoading({ title: '连接设备中...' });

        // 1. 启动P2P服务
        await this.userData.xp2pManager.startP2PService({
          p2pMode: 'ipc',
          deviceInfo: {
            deviceId: options.deviceId,
            productId: options.deviceId.split('/')[0],
            deviceName: options.deviceId.split('/')[1],
            isMjpgDevice: false,
          },
          xp2pInfo: decodedXp2pInfo, // 使用传递过来的 xp2pInfo
          caller: this.userData.pageId,
        });
        console.log('【设置首页】P2P服务启动成功。');

        // 2. 将设备注册到全局服务
        cameraService.setActiveDevice(options.deviceId);
        console.log('【设置首页】已在 CameraService 中将此设备设置为活动设备。');

        // 3. P2P连接成功后，获取设备状态
        await this.fetchDeviceStatus();

      } catch (error: any) {
        console.error('【设置首页】P2P服务启动失败:', error);
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
      console.error('【设置首页】缺少 deviceId 或 xp2pInfo 参数');
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

  onUnload() {
    if (this.data.deviceId && this.userData.xp2pManager) {
      console.log('【设置首页】页面卸载，停止P2P服务:', this.data.deviceId);
      // 注意：这里需要根据业务决定是否清除service。如果子页面还需要通信，就不应该在这里清除。
      // 但为了页面的独立性，最好是每个页面都管理自己的连接。
      this.userData.xp2pManager.stopP2PService(this.data.deviceId, this.userData.pageId);
      // 如果 setting/index 是所有设置页的父级，可以不清，由它统一管理。
      // 为简单起见，这里假设每个页面独立管理。
    }
  },

  async fetchDeviceStatus() {
    console.log('【设置首页】正在获取设备初始状态...');
    try {
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

  onRecordTimeChange(e: WechatMiniprogram.TouchEvent) {
    const newTime = e.detail.value;
    console.log('【设置首页】录像时长变更为:', newTime);
    this.setData({ recordTime: newTime });
    cameraService.sendCommand(`SET_RECORD_TIMES,${newTime}`)
      .then(() => wx.showToast({ title: '设置成功', icon: 'success' }))
      .catch(err => {
        console.error('【设置首页】设置录像时长失败:', err);
        wx.showToast({ title: '设置失败', icon: 'error' });
      });
  },

  onAiBoxChange(e: WechatMiniprogram.TouchEvent) {
    const isShow = e.detail.value;
    const commandValue = isShow ? '0' : '1';
    console.log(`【设置首页】AI检测框开关切换为: ${isShow}, 发送指令值: ${commandValue}`);
    this.setData({ showAiBox: isShow });
    cameraService.sendCommand(`DISABLE_AIBOX,${commandValue}`)
      .then(() => wx.showToast({ title: '设置成功', icon: 'success' }))
      .catch(err => {
        console.error('【设置首页】设置AI检测框失败:', err);
        wx.showToast({ title: '设置失败', icon: 'error' });
        this.setData({ showAiBox: !isShow });
      });
  },

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

  navigateToSetting(e: WechatMiniprogram.BaseEvent) {
    const pageUrl = e.currentTarget.dataset.url;
    if (!pageUrl) return;
    if (!this.data.deviceId) {
      wx.showToast({ title: '设备信息丢失，无法跳转', icon: 'none' });
      return;
    }
    // 【修改】继续向下传递关键信息
    const fullUrl = `${pageUrl}?deviceId=${this.data.deviceId}&xp2pInfo=${encodeURIComponent(this.data.xp2pInfo)}`;
    wx.navigateTo({ url: fullUrl });
  }
});