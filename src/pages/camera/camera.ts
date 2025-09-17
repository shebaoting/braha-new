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
  xp2pInfo: 'XP2PwuQH1VmzkQ0gfRlK1siKhA==%2.4.50',
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
    inputCommand: 'CHECK_ONLINE', // 输入框现在只需要输入指令本身
    onlyp2pMap: {
      flv: isDevTool,
      mjpg: isDevTool,
    },

    showMusicPanel: false,
    musicList: [] as string[],
    currentSong: '',
    musicState: -1,
    volume: 80,
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
      this.getDeviceStatusAndMusicList();
    } else if (['playstop', 'playend', 'playerror'].includes(detail.type)) {
      this.setData({ isPlaySuccess: false });
    }
  },

  // ... (其他事件处理函数保持不变)
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


  // ================= 核心修改：统一的信令发送函数 =================
  /**
   * @description 统一发送自定义指令的函数，会自动拼接前缀和后缀
   * @param cmd - 指令主体，例如 "CHECK_ONLINE" 或 "SET_LULLABY_PLAY,play,song.mp3"
   */
  _sendCommand(cmd: string) {
    // 自动拼接前缀和后缀
    const commandString = `action=user_define&cmd=${cmd},MYBABY`;
    console.log('发送指令:', commandString);
    return this.userData.xp2pManager.sendCommand(this.userData.deviceId, commandString);
  },
  // =============================================================

  // --- 音乐播放器相关方法 (已修改为使用 _sendCommand) ---

  toggleMusicPanel() {
    this.setData({ showMusicPanel: !this.data.showMusicPanel });
    if (this.data.showMusicPanel) {
      this.getDeviceStatusAndMusicList();
    }
  },

  async getDeviceStatusAndMusicList() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '请等待视频连接成功', icon: 'none' });
      return;
    }
    try {
      // 修改点：调用包装函数
      const res = await this._sendCommand('CHECK_ONLINE');
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);
        const musicArray = [];
        for (let i = 0; i < 10; i++) {
          if (status[`Music${i}`]) {
            musicArray.push(status[`Music${i}`]);
          } else { break; }
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

  onMusicListItemTap(e: WechatMiniprogram.TouchEvent) {
    const songName = e.currentTarget.dataset.song;
    this.controlMusic('play', songName);
  },

  toggleMusicPlay() {
    if (!this.data.currentSong) {
      wx.showToast({ title: '请先选择一首歌曲', icon: 'none' });
      return;
    }
    const action = this.data.musicState === 1 ? 'pause' : 'play';
    this.controlMusic(action, this.data.currentSong);
  },

  onVolumeChange(e: WechatMiniprogram.SliderChange) {
    const volume = e.detail.value;
    // 修改点：调用包装函数
    this._sendCommand(`SET_SPEAKER_VOLUME,${volume}`)
      .then(() => {
        this.setData({ volume });
      })
      .catch((err: any) => console.error('设置音量失败:', err));
  },

  async controlMusic(action: 'play' | 'pause', songName: string) {
    // 修改点：调用包装函数
    const command = `SET_LULLABY_PLAY,${action},${songName}`;
    try {
      const res = await this._sendCommand(command);
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);
        this.setData({
          currentSong: status.CUR_MUSIC,
          musicState: parseInt(status.MusicState, 10),
        });
      }
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
      console.error(`音乐操作 ${action} 失败:`, err);
    }
  },


  // --- 原有功能 (PTZ和自定义信令已修改为使用 _sendCommand) ---
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

  // PTZ 控制逻辑现在也使用包装函数
  controlPTZ(e: WechatMiniprogram.TouchEvent) {
    const ptzAction = e.currentTarget.dataset.cmd as string; // 'ptz_up_press' 等
    // 从文档看，UYTKZ指令格式是 UYTKZ,type,value
    // 这里我们假设 value 固定为 1
    const directionMap: { [key: string]: string } = {
        'ptz_up_press': 'UP',
        'ptz_down_press': 'DOWN',
        'ptz_left_press': 'LEFT',
        'ptz_right_press': 'RIGHT'
    };
    const direction = directionMap[ptzAction];
    if (!direction || !this.userData.deviceId) return;

    this.setData({ ptzCmd: ptzAction });
    // 修改点：调用包装函数
    this._sendCommand(`UYTKZ,${direction},1`)
      .catch((err: any) => console.error(`PTZ指令 ${direction} 失败:`, err));
  },

  releasePTZBtn() {
    // 注意：文档没有为 "松开" 定义指令，PTZ可能是点按式移动固定距离
    // 如果需要 "松开停止" 的逻辑，需要设备端支持一个例如 "UYTKZ,STOP,0" 的指令
    this.setData({ ptzCmd: '' });
  },

  onInputCommand(e: WechatMiniprogram.Input) {
    this.setData({ inputCommand: e.detail.value });
  },

  // 自定义信令发送也使用包装函数
  sendCommand() {
    if (!this.data.inputCommand || !this.userData.deviceId) return;
    // 修改点：调用包装函数
    this._sendCommand(this.data.inputCommand)
      .then((res: any) => {
        let content = '类型：' + res.type;
        if(res.data) {
          try {
            // 尝试格式化JSON，方便阅读
            content += '\n内容：' + JSON.stringify(JSON.parse(res.data), null, 2);
          } catch {
            content += '\n内容：' + res.data;
          }
        }
        wx.showModal({ title: '信令成功', content: content, showCancel: false });
      })
      .catch((err: any) => {
        wx.showModal({ title: '信令失败', content: err.errMsg, showCancel: false });
      });
  },
});