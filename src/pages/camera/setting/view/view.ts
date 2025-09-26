import cameraService from '../../../../lib/cameraService';
import { getXp2pManager } from '../../../../lib/xp2pManager';
import { isDevTool } from '../../../../utils/util';

Page({
  data: {
    deviceId: '',
    xp2pInfo: '',
    deviceInfo: null as any,
    isPlaySuccess: false,
    onlyp2pMap: {
      flv: isDevTool,
      mjpg: isDevTool,
    },
    // --- UI的状态 ---
    deviceStatus: {
      FV: false,      // 垂直翻转
      FH: false,      // 水平镜像
      LOGO: true,     // 显示水印
      FORCE_RGB: false, // 强制彩色（高清夜视的反向逻辑）
      LUMI: 50,       // 亮度
      CONT: 50,       // 对比度
      SATU: 50,       // 饱和度
    },
  },

  userData: {
    xp2pManager: null as any,
    pageId: `setting-view-page-${Date.now()}`,
    sliderChangeTimer: null as any, // 滑块节流定时器
  },

  async onLoad(options: { deviceId?: string; xp2pInfo?: string }) {
    if (options.deviceId && options.xp2pInfo) {
      const decodedXp2pInfo = decodeURIComponent(options.xp2pInfo);
      this.setData({
        deviceId: options.deviceId,
        xp2pInfo: decodedXp2pInfo,
        deviceInfo: { // 预设 deviceInfo 以渲染播放器
          deviceId: options.deviceId,
          productId: options.deviceId.split('/')[0],
          deviceName: options.deviceId.split('/')[1],
          isMjpgDevice: false,
        }
      });
      console.log('【画面设置页】已接收到设备ID:', options.deviceId);

      this.userData.xp2pManager = getXp2pManager();

      try {
        await this.userData.xp2pManager.startP2PService({
          p2pMode: 'ipc',
          deviceInfo: this.data.deviceInfo,
          xp2pInfo: decodedXp2pInfo,
          caller: this.userData.pageId,
        });

        console.log('【画面设置页】P2P服务启动成功。');
        cameraService.setActiveDevice(options.deviceId);

      } catch (error: any) {
        console.error('【画面设置页】P2P服务启动失败:', error);
        wx.showModal({
          title: '连接失败',
          content: `无法连接到设备(${error.errMsg || '未知错误'})`,
          showCancel: false,
          success: () => wx.navigateBack(),
        });
      }

    } else {
      console.error('【画面设置页】缺少 deviceId 或 xp2pInfo 参数');
      wx.navigateBack();
    }
  },

  onUnload() {
    if (this.data.deviceId && this.userData.xp2pManager) {
      this.userData.xp2pManager.stopP2PService(this.data.deviceId, this.userData.pageId);
    }
  },

  /**
   * 视频播放成功后，获取设备状态来初始化UI
   */
  onPlaySuccess() {
    this.setData({ isPlaySuccess: true });
    this.fetchDeviceStatus();
  },

  async fetchDeviceStatus() {
    if (!this.data.isPlaySuccess) return;
    console.log('【画面设置页】正在获取设备状态...');
    try {
      const res = await cameraService.sendCommand('CHECK_ONLINE');
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);
        console.log('【画面设置页】获取到设备状态:', status);
        this.setData({
          'deviceStatus.FV': status.FV === '1',
          'deviceStatus.FH': status.FH === '1',
          'deviceStatus.LOGO': status.LOGO === '1',
          'deviceStatus.FORCE_RGB': status.FC === '1',
          'deviceStatus.LUMI': parseInt(status.LUMI, 10) || 50,
          'deviceStatus.CONT': parseInt(status.CONT, 10) || 50,
          'deviceStatus.SATU': parseInt(status.SATU, 10) || 50,
        });
      }
    } catch (error) {
      console.error('【画面设置页】获取设备状态失败:', error);
    }
  },

  // --- 事件处理函数 ---

  /**
   * 垂直翻转
   */
  toggleFlip() {
    const newValue = !this.data.deviceStatus.FV;
    this.setData({ 'deviceStatus.FV': newValue });
    cameraService.sendCommand(`UISPC,4,${newValue ? '1' : '0'}`)
      .catch(() => this.setData({ 'deviceStatus.FV': !newValue })); // 失败回滚
  },

  /**
   * 水平镜像
   */
  toggleMirror() {
    const newValue = !this.data.deviceStatus.FH;
    this.setData({ 'deviceStatus.FH': newValue });
    cameraService.sendCommand(`UISPC,3,${newValue ? '1' : '0'}`)
      .catch(() => this.setData({ 'deviceStatus.FH': !newValue }));
  },

  /**
   * 水印开关
   */
  toggleLogo() {
    const newValue = !this.data.deviceStatus.LOGO;
    // 指令是反向的: 1=关闭, 0=开启
    const commandValue = newValue ? '0' : '1';
    this.setData({ 'deviceStatus.LOGO': newValue });
    cameraService.sendCommand(`DISABLE_LOGO_DISP,${commandValue}`)
      .catch(() => this.setData({ 'deviceStatus.LOGO': !newValue }));
  },

  /**
   * 高清夜视开关 (强制彩色)
   */
  onForceRgbChange(e: WechatMiniprogram.TouchEvent) {
    const value = e.detail.value;
    // UI上的“高清夜视”开启，对应的是强制彩色关闭(0)
    // UI上的“高清夜视”关闭，对应的是强制彩色开启(1)
    const commandValue = value ? '0' : '1';
    this.setData({ 'deviceStatus.FORCE_RGB': !value });
    cameraService.sendCommand(`FORCE_RGB,${commandValue}`)
      .catch(() => this.setData({ 'deviceStatus.FORCE_RGB': value }));
  },

  /**
   * 滑块调节（亮度、对比度、饱和度）
   */
  onSliderChange(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type;
    const value = e.detail.value;

    // 实时更新UI
    switch(type) {
      case 'brightness': this.setData({ 'deviceStatus.LUMI': value }); break;
      case 'contrast': this.setData({ 'deviceStatus.CONT': value }); break;
      case 'saturation': this.setData({ 'deviceStatus.SATU': value }); break;
    }

    // 节流发送
    if (this.userData.sliderChangeTimer) {
      clearTimeout(this.userData.sliderChangeTimer);
    }

    this.userData.sliderChangeTimer = setTimeout(() => {
      let command = '';
      switch(type) {
        case 'brightness': command = `UISPC,0,${value}`; break;
        case 'contrast': command = `UISPC,1,${value}`; break;
        case 'saturation': command = `UISPC,2,${value}`; break;
      }
      if(command) {
        cameraService.sendCommand(command).catch(err => {
            console.error(`【画面设置页】设置${type}失败:`, err);
            // 失败时可以考虑重新拉取状态进行UI校准
            this.fetchDeviceStatus();
        });
      }
    }, 200);
  },
});