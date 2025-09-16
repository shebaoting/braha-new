import { isDevTool } from '../../utils/util';
import { getXp2pManager } from '../../lib/xp2pManager';

const app = getApp();
const console = app.logger || console;

// =================================================================
// 设备参数
// =================================================================
const hardcodedDevice = {
  targetId: 'hardcoded_ipc_1',
  deviceId: '20250901001_178884195_3',
  productId: 'PBA3VBVMHF',
  deviceName: '20250901001_178884195_3',
  xp2pInfo: 'XP2PwuQH1VmzkQ17Jgox4faYqA==%2.4.50',
  isMjpgDevice: false,
  p2pMode: 'ipc' as const,
  sceneType: 'live' as const,
  liveStreamDomain: '',
  initCommand: '',
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
};
// =================================================================

const recordFlvOptions = {
  maxFileSize: 100 * 1024 * 1024,
  needAutoStartNextIfFull: false,
  needSaveToAlbum: true,
  needKeepFile: wx.getAccountInfoSync().miniProgram.envVersion === 'develop',
  showLog: true,
};


Page({
  data: {
    deviceInfo: null as any,
    xp2pInfo: '',
    useChannelIds: [] as number[],
    options: {} as any,

    isPlaySuccess: false,
    isMuted: false,
    isRecording: false,
    voiceState: 'VoiceIdle',

    ptzCmd: '',
    inputCommand: 'action=inner_define&channel=0&cmd=get_device_st&type=voice',
    onlyp2pMap: {
      flv: isDevTool,
      mjpg: isDevTool,
    },
  },

  userData: {
    deviceId: '',
    xp2pManager: null as any,
    pageId: 'camera-view-page',
    player: null as any,
    voiceComponent: null as any,
  },

  onLoad() {
    this.userData.xp2pManager = getXp2pManager();
    this.userData.xp2pManager.checkReset();
    this.onStartPlayer({ detail: hardcodedDevice });
  },

  onReady() {
    this.userData.player = this.selectComponent('#p2p-live-player-0');
    this.userData.voiceComponent = this.selectComponent('#iot-p2p-voice');
  },

  onUnload() {
    if (this.userData.deviceId) {
      console.log('页面卸载，停止P2P服务:', this.userData.deviceId);
      this.userData.xp2pManager.stopP2PService(this.userData.deviceId, this.userData.pageId);
    }
    this.userData.xp2pManager.checkReset();
  },

  onStartPlayer({ detail }: { detail: any }) {
    console.log('开始处理播放请求:', detail);
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
    }).catch((err: any) => {
      console.error('启动P2P服务失败:', err);
    });

    this.setData({
      deviceInfo: detail,
      xp2pInfo: detail.xp2pInfo,
      useChannelIds: detail.useChannelIds,
      options: detail.options,
      isMuted: detail.options.playerMuted,
    });
  },

  onPlayStateChange({ detail }: { detail: any }) {
    if (detail.type === 'playsuccess') {
      this.setData({ isPlaySuccess: true });
    } else if (detail.type === 'playstop' || detail.type === 'playend' || detail.type === 'playerror') {
      this.setData({ isPlaySuccess: false });
    }
  },

  onRecordStateChange({ detail }: { detail: { record: boolean } }) {
    console.log('录像状态变化:', detail);
    this.setData({ isRecording: detail.record });
  },

  onRecordFileStateChange({ detail }: { detail: any }) {
    console.log('录像文件状态:', detail.state, detail);
    switch (detail.state) {
      case 'SaveSuccess':
        wx.showToast({ title: '录像已保存到相册', icon: 'success' });
        break;
      case 'Error':
        wx.showModal({
          title: '录像出错',
          content: `${detail.errType}: ${detail.errMsg || ''}`,
          showCancel: false,
        });
        break;
    }
  },

  onVoiceStateChange({ detail }: { detail: { voiceState: string } }) {
    console.log('对讲状态变化:', detail);
    this.setData({ voiceState: detail.voiceState });
  },

  onVoiceError({ detail }: { detail: any }) {
    console.error('对讲错误:', detail);
    wx.showToast({ title: detail.errMsg || '对讲发生错误', icon: 'none' });
    this.setData({ voiceState: 'VoiceIdle' });
  },

  toggleMute() {
    this.setData({ isMuted: !this.data.isMuted });
  },

  takeSnapshot() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '视频播放成功后才能拍照', icon: 'none' });
      return;
    }
    this.userData.player?.snapshotAndSave();
  },

  toggleRecording() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '视频播放成功后才能录像', icon: 'none' });
      return;
    }
    if (this.data.isRecording) {
      this.userData.player?.stopRecordFlv();
    } else {
      this.userData.player?.startRecordFlv(recordFlvOptions);
    }
  },

  toggleVoice() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '视频播放成功后才能对讲', icon: 'none' });
      return;
    }

    if (this.data.voiceState === 'VoiceIdle') {
      console.log('开始对讲');
      this.userData.voiceComponent?.startVoice();
    } else {
      console.log('停止对讲');
      this.userData.voiceComponent?.stopVoice();
    }
  },

  controlPTZ(e: WechatMiniprogram.TouchEvent) {
    const cmd = e.currentTarget.dataset.cmd as string;
    if (!cmd || !this.userData.deviceId) return;

    this.setData({ ptzCmd: cmd });
    this.userData.xp2pManager.sendPTZCommand(this.userData.deviceId, { ptzCmd: cmd })
      .catch((err: any) => console.error(`发送PTZ指令 ${cmd} 失败:`, err));
  },

  releasePTZBtn() {
    this.setData({ ptzCmd: '' });
    setTimeout(() => {
      this.userData.xp2pManager.sendPTZCommand(this.userData.deviceId, { ptzCmd: 'ptz_release_pre' })
        .catch((err: any) => console.error('发送PTZ释放指令失败:', err));
    }, 200);
  },

  onInputCommand(e: WechatMiniprogram.Input) {
    this.setData({
      inputCommand: e.detail.value,
    });
  },

  sendCommand() {
    if (!this.data.inputCommand || !this.userData.deviceId) return;

    this.userData.xp2pManager.sendCommand(this.userData.deviceId, this.data.inputCommand)
      .then((res: any) => {
        wx.showModal({ title: '信令成功', content: JSON.stringify(res), showCancel: false });
      })
      .catch((err: any) => {
        wx.showModal({ title: '信令失败', content: err.errMsg, showCancel: false });
      });
  },
});