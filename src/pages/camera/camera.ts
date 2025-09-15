import { isDevTool } from '../../utils/util';
import { getXp2pManager } from '../../lib/xp2pManager';

const app = getApp();
const console = app.logger || console;

// =================================================================
// 在这里直接写死您的设备参数
// =================================================================
const hardcodedDevice = {
  targetId: 'hardcoded_ipc_1',
  deviceId: '20250901001_178884195_13',
  productId: 'PBA3VBVMHF',
  deviceName: '20250901001_178884195_13',
  xp2pInfo: 'XP2PtWX28/3ZKki2pV9Yiy5hbA==%2.4.50',
  isMjpgDevice: false,
  p2pMode: 'ipc' as const,
  sceneType: 'live' as const,
  liveStreamDomain: '',
  initCommand: '',
  useChannelIds: [0], // 监控的通道，默认为通道0
  options: {
    liveQuality: 'high',
    playerRTC: true,
    playerMuted: false, // 初始非静音
    playerLog: true,
    voiceType: 'Pusher',
    intercomType: 'voice',
    supportPTZ: true,
    supportCustomCommand: true,
  },
};
// =================================================================

// 录制FLV视频的配置
const recordFlvOptions = {
  maxFileSize: 100 * 1024 * 1024, // 单个文件最大100MB
  needAutoStartNextIfFull: false, // 文件满后不自动开始下一个
  needSaveToAlbum: true, // 自动保存到相册
  needKeepFile: wx.getAccountInfoSync().miniProgram.envVersion === 'develop', // 开发版保留原始flv文件
  showLog: true,
};


Page({
  data: {
    deviceInfo: null as any,
    xp2pInfo: '',
    useChannelIds: [] as number[],
    options: {} as any,

    // -- 新增的状态变量 --
    isPlaySuccess: false, // 视频是否播放成功
    isMuted: false, // 是否静音
    isRecording: false, // 是否正在录像
    voiceState: 'VoiceIdle', // 对讲状态：VoiceIdle, VoicePreparing, VoiceSending

    // -- 原有状态 --
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
    player: null as any, // 存储播放器组件实例
    voiceComponent: null as any, // 存储语音组件实例
  },

  onLoad() {
    this.userData.xp2pManager = getXp2pManager();
    this.userData.xp2pManager.checkReset();
    this.onStartPlayer({ detail: hardcodedDevice });
  },

  onReady() {
    // 页面渲染完成后获取组件实例
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

  // ---- 新增功能：事件处理 ----

  // 播放器状态变化
  onPlayStateChange({ type, detail }: { type: string, detail: any }) {
    if (type === 'playsuccess') {
      this.setData({ isPlaySuccess: true });
    } else if (type === 'playstop' || type === 'playend' || type === 'playerror') {
      this.setData({ isPlaySuccess: false });
    }
  },

  // 录像状态变化
  onRecordStateChange({ detail }: { detail: { record: boolean } }) {
    console.log('录像状态变化:', detail);
    this.setData({ isRecording: detail.record });
  },

  // 录像文件状态变化
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

  // 对讲状态变化
  onVoiceStateChange({ detail }: { detail: { voiceState: string } }) {
    console.log('对讲状态变化:', detail);
    this.setData({ voiceState: detail.voiceState });
  },

  onVoiceError({ detail }: { detail: any }) {
    console.error('对讲错误:', detail);
    wx.showToast({ title: detail.errMsg || '对讲发生错误', icon: 'none' });
    this.setData({ voiceState: 'VoiceIdle' });
  },

  // ---- 新增功能：用户操作 ----

  // 切换静音
  toggleMute() {
    this.setData({ isMuted: !this.data.isMuted });
  },

  // 拍照
  takeSnapshot() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '视频播放成功后才能拍照', icon: 'none' });
      return;
    }
    this.userData.player?.snapshotAndSave();
  },

  // 切换录像
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

  // 切换语音对讲
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


  // ---- 原有功能：PTZ 和 自定义信令 ----
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