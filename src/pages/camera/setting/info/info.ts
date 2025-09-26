import cameraService from '../../../../lib/cameraService';
import { getXp2pManager } from '../../../../lib/xp2pManager';

Page({
  data: {
    deviceId: '',
    xp2pInfo: '',
    deviceInfo: null as any, // 用于存储从设备获取的完整信息对象
    isLoading: true, // 控制加载状态的显示
  },

  userData: {
    xp2pManager: null as any,
    pageId: `setting-info-page-${Date.now()}`,
  },

  async onLoad(options: { deviceId?: string; xp2pInfo?: string }) {
    if (options.deviceId && options.xp2pInfo) {
      const decodedXp2pInfo = decodeURIComponent(options.xp2pInfo);
      this.setData({
        deviceId: options.deviceId,
        xp2pInfo: decodedXp2pInfo
      });
      console.log('【摄像机信息页】已接收到设备ID:', options.deviceId);

      this.userData.xp2pManager = getXp2pManager();

      try {
        // 启动 P2P 服务，这是发送信令的前提
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

        console.log('【摄像机信息页】P2P服务启动成功。');
        cameraService.setActiveDevice(options.deviceId); // 注册到全局服务

        // P2P连接成功后，获取设备信息
        await this.fetchDeviceInfo();

      } catch (error: any) {
        console.error('【摄像机信息页】P2P服务启动失败:', error);
        this.setData({ isLoading: false }); // 停止加载状态
        wx.showModal({
          title: '连接失败',
          content: `无法连接到设备(${error.errMsg || '未知错误'})`,
          showCancel: false,
          success: () => wx.navigateBack(),
        });
      }

    } else {
      console.error('【摄像机信息页】缺少 deviceId 或 xp2pInfo 参数');
      this.setData({ isLoading: false });
      wx.navigateBack();
    }
  },

  onUnload() {
    // 页面卸载时，清理P2P连接
    if (this.data.deviceId && this.userData.xp2pManager) {
      console.log('【摄像机信息页】页面卸载，停止P2P服务:', this.data.deviceId);
      this.userData.xp2pManager.stopP2PService(this.data.deviceId, this.userData.pageId);
    }
  },

  /**
   * 发送 CHECK_ONLINE 指令获取设备详细信息
   */
  async fetchDeviceInfo() {
    this.setData({ isLoading: true });
    console.log('【摄像机信息页】正在发送 CHECK_ONLINE 指令获取设备信息...');
    try {
      const res = await cameraService.sendCommand('CHECK_ONLINE');
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);
        console.log('【摄像机信息页】获取到设备信息:', status);
        this.setData({
          deviceInfo: status,
          isLoading: false
        });
      } else {
        // 处理信令返回但内容错误的情况
        throw new Error(res.errMsg || '设备返回数据格式错误');
      }
    } catch (error) {
      console.error('【摄像机信息页】获取设备信息失败:', error);
      this.setData({ isLoading: false });
      wx.showToast({ title: '获取信息失败', icon: 'none' });
    }
  },
});