import { cameraApi } from '../../../utils/api';
import { isDevTool } from '../../../utils/util';
import { getXp2pManager } from '../../../lib/xp2pManager';
import cameraService from '../../../lib/cameraService'; // 引入全局服务

const app = getApp();
// 使用全局日志记录器或 console

// 录制视频的配置
const recordFlvOptions = {
  maxFileSize: 100 * 1024 * 1024,
  needAutoStartNextIfFull: false,
  needSaveToAlbum: true, // 录制后自动保存到相册
  needKeepFile: wx.getAccountInfoSync().miniProgram.envVersion === 'develop',
  showLog: true,
};

Page({
  data: {
    cameraId: null as number | null,
    deviceInfo: null as any,
    xp2pInfo: '',
    useChannelIds: [0], // 默认使用通道0
    options: { // 提供一个默认的 options 对象，用于驱动组件
      liveQuality: 'high',
      playerRTC: true,
      playerMuted: false,
      playerLog: true,
      voiceType: 'Pusher',
      intercomType: 'voice',
      supportPTZ: true,
      supportCustomCommand: true,
    },
    // ---- 状态标志位 ----
    isPlaySuccess: false, // 视频是否播放成功
    isMuted: false,
    isRecording: false,
    voiceState: 'VoiceIdle', // 对讲状态: VoiceIdle, VoiceSending
    // --- UI 控制 ---
    onlyp2pMap: {
      flv: isDevTool,
      mjpg: isDevTool,
    },
    recordIconColor: '#000000', // 录制按钮颜色，默认为黑色
    micIconColor: '#000000', // 对讲按钮颜色，默认为黑色
    muteIconName: 'sound-mute', // 静音按钮图标

    // 来自 index 页面的模拟数据，实际项目中应通过 options 传入
    icons: {
      books: '/assets/images/books.svg',
      music: '/assets/images/music.svg',
      camera: '/assets/images/camera.svg',
      timer: '/assets/images/timer.svg',
      switch: '/assets/images/switch.svg',
      note: '/assets/images/note.svg',
      baby: '/assets/images/baby.svg',
    },
    current: 0,
    autoplay: false,
    duration: 500,
    interval: 5000,
    swiperList: [
      'https://tdesign.gtimg.com/mobile/demos/swiper1.png',
      'https://tdesign.gtimg.com/mobile/demos/swiper2.png',
    ],
  },

  // ---- 页面/组件实例 ----
  userData: {
    deviceId: '',
    xp2pManager: null as any,
    pageId: `camera-show-page-${Date.now()}`, // 保证页面ID唯一
    player: null as any, // 播放器组件实例
    voiceComponent: null as any, // 语音对讲组件实例
  },

  onLoad(options: { id?: string }) {
    if (options.id) {
      this.setData({ cameraId: parseInt(options.id, 10) });
      this.userData.xp2pManager = getXp2pManager();
      this.userData.xp2pManager.checkReset();
      this.fetchCameraInfo(options.id);
    } else {
      wx.showToast({ title: '缺少设备ID', icon: 'error', duration: 2000, complete: () => wx.navigateBack() });
    }
  },

  // [修正] onReady 中不再获取组件实例，因为它为时过早
  onReady() {},

  onUnload() {
    if (this.userData.deviceId) {
      this.userData.xp2pManager.stopP2PService(this.userData.deviceId, this.userData.pageId);
    }
    // 清理全局服务中的设备信息
    cameraService.clearActiveDevice();
    this.userData.xp2pManager.checkReset();
  },

  async fetchCameraInfo(id: string) {
    wx.showLoading({ title: '加载设备信息...' });
    try {
      const res = await cameraApi.getCameraInfo({ id });
      if (res.data && res.data.code === 0) {
        const deviceData = res.data.data;
        const deviceDetail = {
          targetId: 'hardcoded_ipc_1',
          deviceId: deviceData.deviceId,
          productId: deviceData.productId,
          deviceName: deviceData.deviceName,
          xp2pInfo: deviceData.xp2pInfo,
          isMjpgDevice: false,
          p2pMode: 'ipc' as const,
          sceneType: 'live' as const,
          liveStreamDomain: '',
          initCommand: '',
          useChannelIds: [0],
          options: this.data.options,
        };
        this.onStartPlayer({ detail: deviceDetail });
      } else {
        throw new Error(res.data.msg || '获取设备信息失败');
      }
    } catch (error: any) {
      wx.showModal({
        title: '错误',
        content: error.message || '网络请求失败',
        showCancel: false,
        success: () => wx.navigateBack(),
      });
    } finally {
      wx.hideLoading();
    }
  },

  onStartPlayer({ detail }: { detail: any }) {
    this.userData.deviceId = detail.deviceId;

    this.userData.xp2pManager.startP2PService({
      p2pMode: detail.p2pMode,
      deviceInfo: {
        deviceId: detail.deviceId,
        productId: detail.productId,
        deviceName: detail.deviceName,
        isMjpgDevice: detail.isMjpgDevice,
      },
      xp2pInfo: detail.xp2pInfo,
      caller: this.userData.pageId,
    }).then(() => {
      cameraService.setActiveDevice(detail.deviceId);
    }).catch((err: any) => {
      console.error('启动P2P服务失败:', err);
      wx.showToast({ title: '连接设备失败', icon: 'error' });
    });

    const isMuted = detail.options.playerMuted;
    this.setData({
      deviceInfo: detail,
      xp2pInfo: detail.xp2pInfo,
      useChannelIds: detail.useChannelIds,
      options: detail.options,
      isMuted: isMuted,
      muteIconName: isMuted ? 'sound-mute-1' : 'sound-mute',
    }, () => {
      // [修正] 在 setData 的回调中获取组件实例，确保组件已渲染
      this.userData.player = this.selectComponent('#p2p-live-player-0');
      this.userData.voiceComponent = this.selectComponent('#iot-p2p-voice');
      console.log('【调试】setData回调: 获取到的播放器组件实例:', this.userData.player);
      console.log('【调试】setData回调: 获取到的语音组件实例:', this.userData.voiceComponent);

      if (!this.userData.player || !this.userData.voiceComponent) {
        console.error('【严重错误】在setData回调中仍无法获取组件实例，请检查WXML！');
      }
    });
  },

  // --- 事件处理 ---
  onPlayStateChange({ detail }: { detail: any }) {
    console.log('【调试】onPlayStateChange 事件触发:', detail);
    if (detail.type === 'playsuccess' && !this.data.isPlaySuccess) {
      this.setData({ isPlaySuccess: true });
      console.log('【调试】视频播放成功！isPlaySuccess 已设置为 true。');
    } else if (['playstop', 'playend', 'playerror'].includes(detail.type)) {
      this.setData({ isPlaySuccess: false });
      console.log('【调试】视频播放停止或出错。isPlaySuccess 已设置为 false。');
    }
  },

  onRecordStateChange({ detail }: { detail: { record: boolean } }) {
    console.log('【调试】onRecordStateChange 事件触发:', detail);
    this.setData({
      isRecording: detail.record,
      recordIconColor: detail.record ? '#4CAF50' : '#000000',
    });
  },

  onRecordFileStateChange({ detail }: { detail: any }) {
    console.log('【调试】onRecordFileStateChange 事件触发:', detail.state, detail);
    if (detail.state === 'SaveSuccess') {
      wx.showToast({ title: '录像已保存到相册', icon: 'success' });
    } else if (detail.state === 'Error') {
      wx.showModal({
        title: '录像出错',
        content: `${detail.errType}: ${detail.errMsg || '未知错误'}`,
        showCancel: false,
      });
    }
  },

  onVoiceStateChange({ detail }: { detail: { voiceState: string } }) {
    console.log('【调试】onVoiceStateChange 事件触发:', detail);
    this.setData({
      voiceState: detail.voiceState,
      micIconColor: detail.voiceState === 'VoiceSending' ? '#4CAF50' : '#000000',
    });
  },

  onVoiceError({ detail }: { detail: any }) {
    console.error('【调试】onVoiceError 事件触发:', detail);
    this.setData({ voiceState: 'VoiceIdle', micIconColor: '#000000' });
    wx.showToast({ title: detail.errMsg || '对讲发生错误', icon: 'none' });
  },

  // --- 按钮点击事件实现 ---
  toggleRecording() {
    console.log('【调试】toggleRecording 点击');
    if (!this.data.isPlaySuccess) {
      console.warn('【调试】操作中断：视频尚未播放成功 (isPlaySuccess: false)');
      wx.showToast({ title: '请等待视频加载完成', icon: 'none' });
      return;
    }
    console.log('【调试】isPlaySuccess 检查通过，准备切换录像状态。当前录制状态:', this.data.isRecording);
    console.log('【调试】将要调用的播放器实例:', this.userData.player);

    if (this.data.isRecording) {
      this.userData.player?.stopRecordFlv();
    } else {
      this.userData.player?.startRecordFlv(recordFlvOptions);
    }
  },

  takeSnapshot() {
    console.log('【调试】takeSnapshot 点击');
    if (!this.data.isPlaySuccess) {
      console.warn('【调试】操作中断：视频尚未播放成功 (isPlaySuccess: false)');
      wx.showToast({ title: '请等待视频加载完成', icon: 'none' });
      return;
    }
    console.log('【调试】isPlaySuccess 检查通过，准备拍照。');
    console.log('【调试】将要调用的播放器实例:', this.userData.player);

    this.userData.player?.snapshotAndSave();
  },

  toggleVoice() {
    console.log('【调试】toggleVoice 点击');
    if (!this.data.isPlaySuccess) {
      console.warn('【调试】操作中断：视频尚未播放成功 (isPlaySuccess: false)');
      wx.showToast({ title: '请等待视频加载完成', icon: 'none' });
      return;
    }
    console.log('【调试】isPlaySuccess 检查通过，准备切换对讲状态。当前对讲状态:', this.data.voiceState);
    console.log('【调试】将要调用的语音组件实例:', this.userData.voiceComponent);

    if (this.data.voiceState === 'VoiceIdle') {
      this.userData.voiceComponent?.startVoice();
    } else {
      this.userData.voiceComponent?.stopVoice();
    }
  },

  toggleMute() {
    console.log('【调试】toggleMute 点击');
    const newMutedState = !this.data.isMuted;
    this.setData({
      isMuted: newMutedState,
      muteIconName: newMutedState ? 'sound-mute-1' : 'sound-mute',
    });
  },

  goToSettings() {
    console.log('【调试】goToSettings 点击');
    if (!this.data.deviceInfo) {
      wx.showToast({title: '设备信息未加载', icon: 'none'});
      return;
    }
    wx.navigateTo({
      url: `/pages/camera/setting/index/index?deviceId=${this.data.deviceInfo.deviceId}`
    });
  },

  // --- Swiper and other placeholder methods ---
  onTap(e: any) {
    console.log('Swiper tapped', e);
  },
  onChange(e: any) {
    this.setData({
      current: e.detail.current,
    });
  },
  onImageLoad(e: any) {
    console.log('Image loaded', e);
  },
});