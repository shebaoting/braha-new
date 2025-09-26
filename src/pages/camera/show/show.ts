import { cameraApi } from '../../../utils/api';
import { isDevTool } from '../../../utils/util';
import { getXp2pManager } from '../../../lib/xp2pManager';
import cameraService from '../../../lib/cameraService';

const app = getApp();
const console = app.logger || console;

const recordFlvOptions = {
  maxFileSize: 100 * 1024 * 1024,
  needAutoStartNextIfFull: false,
  needSaveToAlbum: true,
  needKeepFile: wx.getAccountInfoSync().miniProgram.envVersion === 'develop',
  showLog: true,
};

Page({
  data: {
    cameraId: null as number | null,
    deviceInfo: null as any,
    xp2pInfo: '',
    useChannelIds: [0],
    options: {
      liveQuality: 'high',
      playerRTC: true,
      playerMuted: false,
      playerLog: true,
      voiceType: 'Pusher',
      intercomType: 'voice',
      supportPTZ: true,
      supportCustomCommand: true,
    },
    isPlaySuccess: false,
    isMuted: false,
    isRecording: false,
    voiceState: 'VoiceIdle',
    onlyp2pMap: {
      flv: isDevTool,
      mjpg: isDevTool,
    },
    recordIconColor: '#000000',
    micIconColor: '#000000',
    muteIconName: 'sound-mute',
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

  userData: {
    deviceId: '',
    xp2pManager: null as any,
    pageId: `camera-show-page-${Date.now()}`,
    player: null as any,
    voiceComponent: null as any,
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

  onReady() {
    this.userData.player = this.selectComponent('#p2p-live-player-0');
    this.userData.voiceComponent = this.selectComponent('#iot-p2p-voice');
  },

  onUnload() {
    if (this.userData.deviceId) {
      this.userData.xp2pManager.stopP2PService(this.userData.deviceId, this.userData.pageId);
    }
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
      this.userData.player = this.selectComponent('#p2p-live-player-0');
      this.userData.voiceComponent = this.selectComponent('#iot-p2p-voice');
    });
  },

  onPlayStateChange({ detail }: { detail: any }) {
    if (detail.type === 'playsuccess' && !this.data.isPlaySuccess) {
      this.setData({ isPlaySuccess: true });
    } else if (['playstop', 'playend', 'playerror'].includes(detail.type)) {
      this.setData({ isPlaySuccess: false });
    }
  },

  onRecordStateChange({ detail }: { detail: { record: boolean } }) {
    this.setData({
      isRecording: detail.record,
      recordIconColor: detail.record ? '#4CAF50' : '#000000',
    });
  },

  onRecordFileStateChange({ detail }: { detail: any }) {
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
    this.setData({
      voiceState: detail.voiceState,
      micIconColor: detail.voiceState === 'VoiceSending' ? '#4CAF50' : '#000000',
    });
  },

  onVoiceError({ detail }: { detail: any }) {
    this.setData({ voiceState: 'VoiceIdle', micIconColor: '#000000' });
    wx.showToast({ title: detail.errMsg || '对讲发生错误', icon: 'none' });
  },

  toggleRecording() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '请等待视频加载完成', icon: 'none' });
      return;
    }
    if (this.data.isRecording) {
      this.userData.player?.stopRecordFlv();
    } else {
      this.userData.player?.startRecordFlv(recordFlvOptions);
    }
  },

  takeSnapshot() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '请等待视频加载完成', icon: 'none' });
      return;
    }
    this.userData.player?.snapshotAndSave();
  },

  toggleVoice() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '请等待视频加载完成', icon: 'none' });
      return;
    }
    if (this.data.voiceState === 'VoiceIdle') {
      this.userData.voiceComponent?.startVoice();
    } else {
      this.userData.voiceComponent?.stopVoice();
    }
  },

  toggleMute() {
    const newMutedState = !this.data.isMuted;
    this.setData({
      isMuted: newMutedState,
      muteIconName: newMutedState ? 'sound-mute-1' : 'sound-mute',
    });
  },

  /**
   * [修改] 跳转到设置页面，增加 xp2pInfo 参数
   */
  goToSettings() {
    if (!this.data.deviceInfo) {
      wx.showToast({title: '设备信息未加载', icon: 'none'});
      return;
    }
    // 【关键修改】将 xp2pInfo 编码后传递给设置页面
    const url = `/pages/camera/setting/index/index?deviceId=${this.data.deviceInfo.deviceId}&xp2pInfo=${encodeURIComponent(this.data.xp2pInfo)}`;
    wx.navigateTo({
      url: url,
      fail: (err) => {
        console.error('跳转到设置页面失败:', err);
      }
    });
  },

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