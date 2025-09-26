import cameraService from '../../../../lib/cameraService';
import { getXp2pManager } from '../../../../lib/xp2pManager';

// 【新增】辅助函数：生成0到n-1的数组，并格式化为两位数
const generateNumberArray = (n: number) => {
  return Array.from({ length: n }, (_, i) => ({
    label: i < 10 ? `0${i}` : `${i}`,
    value: i < 10 ? `0${i}` : `${i}`,
  }));
};

// 【新增】生成级联选择器所需的时间数据
const generateTimeOptions = () => {
  const hours = generateNumberArray(25); // 0-24
  const minutes = generateNumberArray(60); // 0-59

  // 为每个小时选项添加分钟作为子集
  hours.forEach(hour => {
    // 24点后面不需要分钟
    if (hour.value !== '24') {
        hour.children = minutes;
    }
  });

  // “全天”选项
  const allDayOption = { label: '全天', value: 'allday', children: [] };

  return [allDayOption, ...hours];
};

Page({
  data: {
    deviceId: '',
    xp2pInfo: '',
    deviceStatus: {
      BABY_CRY_APPEASE: false,
      MUSIC_APPEASING: false,
      CRYDET_TIME: '00:00-24:00',
      CRY_DETECT_SENSE: 1,
      CRY_APPEASE_SONG: 'auto',
      MUSIC_LIST: [] as string[],
    },
    senseMap: ['低', '中', '高'],

    // --- Cascader 相关数据 ---
    isTimePickerVisible: false,
    timeOptions: generateTimeOptions(),
    cascaderValue: null as any,
  },

  userData: {
    xp2pManager: null as any,
    pageId: `setting-soothe-page-${Date.now()}`,
  },

  async onLoad(options: { deviceId?: string; xp2pInfo?: string }) {
    if (options.deviceId && options.xp2pInfo) {
      const decodedXp2pInfo = decodeURIComponent(options.xp2pInfo);
      this.setData({
        deviceId: options.deviceId,
        xp2pInfo: decodedXp2pInfo
      });
      console.log('【啼哭安抚页】已接收到设备ID:', options.deviceId);

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

        console.log('【啼哭安抚页】P2P服务启动成功。');
        cameraService.setActiveDevice(options.deviceId);
        await this.fetchDeviceStatus();

      } catch (error: any) {
        console.error('【啼哭安抚页】P2P服务启动失败:', error);
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
      console.error('【啼哭安抚页】缺少 deviceId 或 xp2pInfo 参数');
      wx.showToast({ title: '参数错误', icon: 'error', duration: 2000, complete: () => wx.navigateBack() });
    }
  },

  onUnload() {
    if (this.data.deviceId && this.userData.xp2pManager) {
      this.userData.xp2pManager.stopP2PService(this.data.deviceId, this.userData.pageId);
    }
  },

  async fetchDeviceStatus() {
    console.log('【啼哭安抚页】正在获取设备状态...');
    try {
      const res = await cameraService.sendCommand('CHECK_ONLINE');
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);
        console.log('【啼哭安抚页】获取到设备状态:', status);

        const musicList = [];
        for (let i = 0; i < 10; i++) {
          if (status[`Music${i}`]) {
            musicList.push(status[`Music${i}`]);
          }
        }

        this.setData({
          'deviceStatus.BABY_CRY_APPEASE': status.APPEASE === '1',
          'deviceStatus.MUSIC_APPEASING': status.MUSIC_APPEASING === '1',
          'deviceStatus.CRYDET_TIME': status.CRYDET_TIME || '00:00-24:00',
          'deviceStatus.CRY_DETECT_SENSE': parseInt(status.CRY_DETECT_SENSE, 10) || 1,
          'deviceStatus.CRY_APPEASE_SONG': status.CRY_APPEASE || 'auto',
          'deviceStatus.MUSIC_LIST': musicList,
        });
      }
    } catch (error) {
      console.error('【啼哭安抚页】获取设备状态失败:', error);
      wx.showToast({ title: '获取设备状态失败', icon: 'none' });
    }
  },

  // --- 事件处理函数 ---

  onCryDetectChange(e: WechatMiniprogram.TouchEvent) {
    const value = e.detail.value;
    const commandValue = value ? '1' : '0';
    this.setData({ 'deviceStatus.BABY_CRY_APPEASE': value });

    cameraService.sendCommand(`BABY_CRY_APPEASE,${commandValue},${this.data.deviceStatus.CRY_APPEASE_SONG}`)
      .catch(() => this.setData({ 'deviceStatus.BABY_CRY_APPEASE': !value }));
  },

  onMusicAppeasingChange(e: WechatMiniprogram.TouchEvent) {
    const value = e.detail.value;
    const commandValue = value ? '1' : '0';
    this.setData({ 'deviceStatus.MUSIC_APPEASING': value });
    cameraService.sendCommand(`MUSIC_APPEASING,${commandValue}`)
      .catch(() => this.setData({ 'deviceStatus.MUSIC_APPEASING': !value }));
  },

  showTimePicker() {
    const [start, end] = this.data.deviceStatus.CRYDET_TIME.split('-');
    // 将 "HH:mm-HH:mm" 格式转换为 Cascader 需要的 value 数组
    const cascaderValue = start === '00:00' && (end === '24:00' || end === '00:00')
      ? ['allday'] // 如果是全天，则选中“全天”
      : [start, end];

    this.setData({
      cascaderValue: cascaderValue,
      isTimePickerVisible: true
    });
  },

  hideTimePicker() {
    this.setData({ isTimePickerVisible: false });
  },

  onTimeChange(e: WechatMiniprogram.TouchEvent) {
    const { value, selectedOptions } = e.detail;

    let startTime = '00:00';
    let endTime = '24:00';
    let isValidSelection = false;

    if (value.length === 1 && value[0] === 'allday') {
      isValidSelection = true;
    } else if (value.length === 2) {
      // 级联选择返回的是 value，需要从 options 中找到 label
      const startHour = selectedOptions[0].label;
      const startMinute = selectedOptions[0].children.find((c:any) => c.value === value[1]).label;
      startTime = `${startHour}:${startMinute}`;

      const endHour = selectedOptions[2].label;
      const endMinute = selectedOptions[2].children.find((c:any) => c.value === value[3]).label;
      endTime = `${endHour}:${endMinute}`;
      isValidSelection = true;
    }

    if (!isValidSelection) {
        // 用户可能只选择了一部分，此时不关闭弹窗也不发指令
        return;
    }

    const timeRange = `${startTime}-${endTime}`;

    console.log(`【啼哭安抚页】安抚时间段变更为: ${timeRange}`);

    this.setData({
      'deviceStatus.CRYDET_TIME': timeRange,
      cascaderValue: value,
      isTimePickerVisible: false // 确认选择后关闭
    });

    cameraService.sendCommand(`SET_CRYDET_TIME,${startTime},${endTime}`);
  },

  showSensePicker() {
    wx.showActionSheet({
      itemList: this.data.senseMap,
      success: (res) => {
        const senseValue = res.tapIndex; // 0, 1, 2
        this.setData({ 'deviceStatus.CRY_DETECT_SENSE': senseValue });
        cameraService.sendCommand(`CRY_DETECT_SENSE,${senseValue}`);
      }
    });
  },

  showMusicPicker() {
    const itemList = ['随机', ...this.data.deviceStatus.MUSIC_LIST];
    wx.showActionSheet({
      itemList,
      success: (res) => {
        const selectedSong = res.tapIndex === 0 ? 'auto' : itemList[res.tapIndex];
        this.setData({ 'deviceStatus.CRY_APPEASE_SONG': selectedSong });
        // 使用复合指令，保持当前啼哭检测开关状态
        const commandValue = this.data.deviceStatus.BABY_CRY_APPEASE ? '1' : '0';
        cameraService.sendCommand(`BABY_CRY_APPEASE,${commandValue},${selectedSong}`);
      }
    });
  },
});