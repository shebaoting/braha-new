import { isDevTool } from '../../utils/util';
import { getXp2pManager } from '../../lib/xp2pManager';

const app = getApp();
const console = app.logger || console;

// 设备参数
const hardcodedDevice = {
  targetId: 'hardcoded_ipc_1',
  deviceId: '20250901001_178884195_3',
  productId: 'PBA3VBVMHF',
  deviceName: '20250901001_178884195_3',
  xp2pInfo: 'XP2PwuQH1VmzkQ1iJnECpuywhw==%2.4.50',
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

    // --- 新增：音乐播放器状态 ---
    showMusicPanel: false, // 控制音乐面板的显示和隐藏
    musicList: [] as string[], // 存储从设备获取的音乐列表
    currentSong: '', // 当前播放的歌曲名
    musicState: -1, // -1:未播放, 0:暂停, 1:播放中
    volume: 80, // 音量 (0-100)
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
      this.userData.xp2pManager.stopP2PService(this.userData.deviceId, this.userData.pageId);
    }
    this.userData.xp2pManager.checkReset();
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
    }).catch((err: any) => console.error('启动P2P服务失败:', err));

    this.setData({
      deviceInfo: detail,
      xp2pInfo: detail.xp2pInfo,
      useChannelIds: detail.useChannelIds,
      options: detail.options,
      isMuted: detail.options.playerMuted,
    });
  },

  onPlayStateChange({ detail }: { detail: any }) {
    if (detail.type === 'playsuccess' && !this.data.isPlaySuccess) {
      this.setData({ isPlaySuccess: true });
      // 播放成功后，立即获取一次设备状态和音乐列表
      this.getDeviceStatusAndMusicList();
    } else if (['playstop', 'playend', 'playerror'].includes(detail.type)) {
      this.setData({ isPlaySuccess: false });
    }
  },

  // ... (onRecordStateChange, onRecordFileStateChange, onVoiceStateChange, onVoiceError 等方法保持不变)
  onRecordStateChange({ detail }: { detail: { record: boolean } }) {
    this.setData({ isRecording: detail.record });
  },
  onRecordFileStateChange({ detail }: { detail: any }) {
    if (detail.state === 'SaveSuccess') {
      wx.showToast({ title: '录像已保存到相册', icon: 'success' });
    } else if (detail.state === 'Error') {
      if (detail.errType === 'saveError' && detail.errMsg.includes('invalid video')) {
        wx.showModal({
          title: '保存失败',
          content: '视频录制成功，但因设备视频编码为H.265，系统相册不支持，无法保存。请将设备视频编码设为H.264。',
          showCancel: false,
        });
      } else {
        wx.showModal({ title: '录像出错', content: `${detail.errType}: ${detail.errMsg || ''}`, showCancel: false });
      }
    }
  },
  onVoiceStateChange({ detail }: { detail: { voiceState: string } }) {
    this.setData({ voiceState: detail.voiceState });
  },
  onVoiceError({ detail }: { detail: any }) {
    this.setData({ voiceState: 'VoiceIdle' });
    wx.showToast({ title: detail.errMsg || '对讲发生错误', icon: 'none' });
  },

  // --- 音乐播放器相关方法 ---

  // 切换音乐面板显示
  toggleMusicPanel() {
    this.setData({ showMusicPanel: !this.data.showMusicPanel });
    // 每次打开时都刷新一次状态
    if (this.data.showMusicPanel) {
      this.getDeviceStatusAndMusicList();
    }
  },

  // 获取设备状态，其中包含了音乐列表和当前状态
  async getDeviceStatusAndMusicList() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '请等待视频连接成功', icon: 'none' });
      return;
    }
    const command = 'action=user_define&cmd=CHECK_ONLINE,MYBABY';
    console.log('设备状态0:', command);
    try {
      const res = await this.userData.xp2pManager.sendCommand(this.userData.deviceId, command);
      console.log('设备状态1:', res);
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);

        const musicArray = [];
        for (let i = 0; i < 10; i++) { // 假设最多10首
          if (status[`Music${i}`]) {
            musicArray.push(status[`Music${i}`]);
          } else {
            break;
          }
        }
        this.setData({
          musicList: musicArray,
          currentSong: status.CUR_MUSIC || '',
          musicState: parseInt(status.MusicState, 10),
          volume: parseInt(status.Volume, 10),
        });
      }
    } catch (err: any) {
      wx.showToast({ title: '获取音乐列表失败', icon: 'error' });
      console.error('获取音乐列表失败:', err);
    }
  },

  // 点击音乐列表中的歌曲
  onMusicListItemTap(e: WechatMiniprogram.TouchEvent) {
    const songName = e.currentTarget.dataset.song;
    this.controlMusic('play', songName);
  },

  // 点击播放/暂停按钮
  toggleMusicPlay() {
    if (!this.data.currentSong) {
      wx.showToast({ title: '请先选择一首歌曲', icon: 'none' });
      return;
    }
    const action = this.data.musicState === 1 ? 'pause' : 'play';
    this.controlMusic(action, this.data.currentSong);
  },

  // 音量变化
  onVolumeChange(e: WechatMiniprogram.SliderChange) {
    const volume = e.detail.value;
    const command = `action=user_define&cmd=SET_SPEAKER_VOLUME,${volume}`;

    this.userData.xp2pManager.sendCommand(this.userData.deviceId, command)
      .then(() => {
        this.setData({ volume });
      })
      .catch((err: any) => console.error('设置音量失败:', err));
  },

  // 统一的音乐控制函数
  async controlMusic(action: 'play' | 'pause', songName: string) {
    const command = `action=user_define&cmd=SET_LULLABY_PLAY,${action},${songName}`;
    try {
      const res = await this.userData.xp2pManager.sendCommand(this.userData.deviceId, command);
      if (res.type === 'success' && res.data) {
        // 操作成功后，用设备返回的最新状态更新UI
        const status = JSON.parse(res.data);
        this.setData({
          currentSong: status.CUR_MUSIC,
          musicState: parseInt(status.MusicState, 10),
        });
      }
    } catch(err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
      console.error(`音乐操作 ${action} 失败:`, err);
    }
  },


  // --- 原有功能 ---
  toggleMute() {
    this.setData({ isMuted: !this.data.isMuted });
  },
  takeSnapshot() {
    if (!this.data.isPlaySuccess) return;
    this.userData.player?.snapshotAndSave();
  },
  toggleRecording() {
    if (!this.data.isPlaySuccess) return;
    this.data.isRecording ? this.userData.player?.stopRecordFlv() : this.userData.player?.startRecordFlv(recordFlvOptions);
  },
  toggleVoice() {
    if (!this.data.isPlaySuccess) return;
    this.data.voiceState === 'VoiceIdle' ? this.userData.voiceComponent?.startVoice() : this.userData.voiceComponent?.stopVoice();
  },
  controlPTZ(e: WechatMiniprogram.TouchEvent) {
    const cmd = e.currentTarget.dataset.cmd as string;
    if (!cmd || !this.userData.deviceId) return;
    this.setData({ ptzCmd: cmd });
    this.userData.xp2pManager.sendPTZCommand(this.userData.deviceId, { ptzCmd: cmd }).catch((err: any) => console.error(`PTZ指令 ${cmd} 失败:`, err));
  },
  releasePTZBtn() {
    this.setData({ ptzCmd: '' });
    setTimeout(() => {
      this.userData.xp2pManager.sendPTZCommand(this.userData.deviceId, { ptzCmd: 'ptz_release_pre' }).catch((err: any) => console.error('PTZ释放指令失败:', err));
    }, 200);
  },
  onInputCommand(e: WechatMiniprogram.Input) {
    this.setData({ inputCommand: e.detail.value });
  },
  sendCommand() {
    if (!this.data.inputCommand || !this.userData.deviceId) return;
    this.userData.xp2pManager.sendCommand(this.userData.deviceId, this.data.inputCommand)
      .then((res: any) => wx.showModal({ title: '信令成功', content: JSON.stringify(res), showCancel: false }))
      .catch((err: any) => wx.showModal({ title: '信令失败', content: err.errMsg, showCancel: false }));
  },
});