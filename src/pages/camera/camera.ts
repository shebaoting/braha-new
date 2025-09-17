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
  xp2pInfo: 'XP2PwuQc1i/sjgUnKC4q9JnRng==%2.4.50',
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
    inputCommand: 'CHECK_ONLINE',
    onlyp2pMap: {
      flv: isDevTool,
      mjpg: isDevTool,
    },

    showMusicPanel: false,
    musicList: [] as string[],
    currentSong: '',
    musicState: -1,
    volume: 80,

    deviceStatus: {
      BABY_CRY_APPEASE: false,
      CRY_DETECT_SENSE: 1,
      PTZ_TRACK: false,
      DEFENCE_NOTIFY: false,
      SLEEP_TRACKING: false,
      FENCE_DISPLAY: false,
      DANGER_DISPLAY: false,
      FENCEDET_SENSE: 2,
      SLEEP_TRACK_SENSE: 2,
      FACE_SNAPSHOT: false,
      BLOCK_DETECT: false,
      CRYDET_TIME: '00:00-24:00',

      RES: '720',
      FV: false,
      FH: false,
      LUMI: 50,
      CONT: 50,
      SATU: 50,
      SET_ENCODE_H265: false,
      FORCE_RGB: false,
      AIBOX: false,
      LOGO: true, // 默认改为true

      NIGHT_LAMP: false,
      CAM_WORK_TIME_START: '00:00',
      CAM_WORK_TIME_END: '24:00',
      FIRMWARE: '0',
      VER: '',
      YSGN: false,
      AUDIO: false,
      RECORDTIME: '15',
      TEMPERATURE_UNIT: '0',

      MUSIC_APPEASING: false,
      BREATHING_LED: false,
    },
    cryTimeEnd: '24:00',
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

  _sendCommand(cmd: string) {
    const commandString = `action=user_define&cmd=${cmd},MYBABY`;
    console.log('发送指令:', commandString);
    return this.userData.xp2pManager.sendCommand(this.userData.deviceId, commandString);
  },

  _updateDeviceStatus(status: any) {
    if (!status) return;

    const newStatus: { [key: string]: any } = {};
    const cryDetTime = status.CRYDET_TIME || '00:00-24:00';
    const cryTimeParts = cryDetTime.split('-');
    const cryTimeEnd = cryTimeParts.length > 1 ? cryTimeParts[1] : '24:00';

    if (status.APPEASE !== undefined) newStatus['deviceStatus.BABY_CRY_APPEASE'] = status.APPEASE === '1';
    if (status.CRY_DETECT_SENSE !== undefined) newStatus['deviceStatus.CRY_DETECT_SENSE'] = parseInt(status.CRY_DETECT_SENSE, 10);
    if (status.PT !== undefined) newStatus['deviceStatus.PTZ_TRACK'] = status.PT === '1';
    if (status.FENCE !== undefined) newStatus['deviceStatus.DEFENCE_NOTIFY'] = status.FENCE === '1';
    if (status.SLEEP_TRACKING !== undefined) newStatus['deviceStatus.SLEEP_TRACKING'] = status.SLEEP_TRACKING === '1';
    if (status.FENCE_DISPLAY !== undefined) newStatus['deviceStatus.FENCE_DISPLAY'] = status.FENCE_DISPLAY === '1';
    if (status.DANGER_DISPLAY !== undefined) newStatus['deviceStatus.DANGER_DISPLAY'] = status.DANGER_DISPLAY === '1';
    if (status.FENCEDET_SENSE !== undefined) newStatus['deviceStatus.FENCEDET_SENSE'] = parseInt(status.FENCEDET_SENSE, 10);
    if (status.SLEEP_TRACK_SENSE !== undefined) newStatus['deviceStatus.SLEEP_TRACK_SENSE'] = parseInt(status.SLEEP_TRACK_SENSE, 10);
    if (status.SNAPSHOT !== undefined) newStatus['deviceStatus.FACE_SNAPSHOT'] = status.SNAPSHOT === '1';
    if (status.BLOCK !== undefined) newStatus['deviceStatus.BLOCK_DETECT'] = status.BLOCK === '1';
    if (status.CRYDET_TIME !== undefined) { newStatus['deviceStatus.CRYDET_TIME'] = cryDetTime; newStatus['cryTimeEnd'] = cryTimeEnd; }
    if (status.RES !== undefined) newStatus['deviceStatus.RES'] = status.RES;
    if (status.FV !== undefined) newStatus['deviceStatus.FV'] = status.FV === '1';
    if (status.FH !== undefined) newStatus['deviceStatus.FH'] = status.FH === '1';
    if (status.LUMI !== undefined) newStatus['deviceStatus.LUMI'] = parseInt(status.LUMI, 10);
    if (status.CONT !== undefined) newStatus['deviceStatus.CONT'] = parseInt(status.CONT, 10);
    if (status.SATU !== undefined) newStatus['deviceStatus.SATU'] = parseInt(status.SATU, 10);
    if (status.SET_ENCODE_H265 !== undefined) newStatus['deviceStatus.SET_ENCODE_H265'] = status.SET_ENCODE_H265 === '1';
    if (status.FC !== undefined) newStatus['deviceStatus.FORCE_RGB'] = status.FC === '1';
    if (status.AIBOX !== undefined) newStatus['deviceStatus.AIBOX'] = status.AIBOX === '0';

    // ================== 核心修复：修正LOGO状态解析 ==================
    if (status.LOGO !== undefined) newStatus['deviceStatus.LOGO'] = status.LOGO === '1'; // 1代表开启
    // =============================================================

    if (status.NightLamp !== undefined) newStatus['deviceStatus.NIGHT_LAMP'] = status.NightLamp === '1';
    if (status.START_TIME !== undefined) newStatus['deviceStatus.CAM_WORK_TIME_START'] = status.START_TIME === '0' ? '00:00' : status.START_TIME;
    if (status.END_TIME !== undefined) newStatus['deviceStatus.CAM_WORK_TIME_END'] = status.END_TIME === '24' ? '24:00' : status.END_TIME;
    if (status.FIRMWARE !== undefined) newStatus['deviceStatus.FIRMWARE'] = status.FIRMWARE;
    if (status.VER !== undefined) newStatus['deviceStatus.VER'] = status.VER;
    if (status.YSGN !== undefined) newStatus['deviceStatus.YSGN'] = status.YSGN === '1';
    if (status.AUDIO !== undefined) newStatus['deviceStatus.AUDIO'] = status.AUDIO === '1';
    if (status.RECORDTIME !== undefined) newStatus['deviceStatus.RECORDTIME'] = status.RECORDTIME;
    if (status.TEMPERATURE_UNIT !== undefined) newStatus['deviceStatus.TEMPERATURE_UNIT'] = status.TEMPERATURE_UNIT;
    if (status.MUSIC_APPEASING !== undefined) newStatus['deviceStatus.MUSIC_APPEASING'] = status.MUSIC_APPEASING === '1';
    if (status.BREATHING_LED !== undefined) newStatus['deviceStatus.BREATHING_LED'] = status.BREATHING_LED === '1';
    if (status.MusicState !== undefined) newStatus['musicState'] = parseInt(status.MusicState, 10);
    if (status.CUR_MUSIC !== undefined) newStatus['currentSong'] = status.CUR_MUSIC || '';
    if (status.Volume !== undefined) newStatus['volume'] = parseInt(status.Volume, 10);

    if (Object.keys(newStatus).length > 0) {
      this.setData(newStatus);
    }
  },

  onStartPlayer({ detail }: { detail: any }) {
    this.userData.deviceId = detail.deviceId;
    this.userData.xp2pManager.startP2PService({ p2pMode: detail.p2pMode, deviceInfo: detail, xp2pInfo: detail.xp2pInfo, caller: this.userData.pageId }).catch((err: any) => console.error('启动P2P服务失败:', err));
    this.setData({ deviceInfo: detail, xp2pInfo: detail.xp2pInfo, useChannelIds: detail.useChannelIds, options: detail.options, isMuted: detail.options.playerMuted });
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
  onRecordStateChange({ detail }: { detail: { record: boolean } }) { this.setData({ isRecording: detail.record }); },
  onRecordFileStateChange({ detail }: { detail: any }) { if (detail.state === 'SaveSuccess') { wx.showToast({ title: '录像已保存到相册', icon: 'success' }); } else if (detail.state === 'Error') { if (detail.errType === 'saveError' && detail.errMsg.includes('invalid video')) { wx.showModal({ title: '保存失败', content: '视频录制成功，但因设备视频编码为H.265，系统相册不支持，无法保存。请将设备视频编码设为H.264。', showCancel: false }); } else { wx.showModal({ title: '录像出错', content: `${detail.errType}: ${detail.errMsg || ''}`, showCancel: false }); } } },
  onVoiceStateChange({ detail }: { detail: { voiceState: string } }) { this.setData({ voiceState: detail.voiceState }); },
  onVoiceError({ detail }: { detail: any }) { this.setData({ voiceState: 'VoiceIdle' }); wx.showToast({ title: detail.errMsg || '对讲发生错误', icon: 'none' }); },
  onCryAppeaseChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`BABY_CRY_APPEASE,${e.detail.value ? '1' : '0'},auto`).then(this.handleCommandResponse); },
  onCrySenseTap() { const itemList = ['低', '中', '高']; wx.showActionSheet({ itemList, success: res => this._sendCommand(`CRY_DETECT_SENSE,${res.tapIndex}`).then(this.handleCommandResponse) }); },
  onTrackingChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`PTZ_TRACK,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onFenceChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`DEFENCE_NOTIFY,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onSleepTrackingChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`SLEEP_TRACKING,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onFenceDisplayChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`DISPLAY_FENCE_AREA,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onDangerDisplayChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`DISPLAY_DANGER_AREA,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onFenceSenseTap() { const itemList = ['低', '中', '高']; wx.showActionSheet({ itemList, success: res => this._sendCommand(`SET_FENCEDET_SENSE,${res.tapIndex + 1}`).then(this.handleCommandResponse) }); },
  onSleepSenseTap() { const itemList = ['低', '中', '高']; wx.showActionSheet({ itemList, success: res => this._sendCommand(`SET_SLEEP_TRACK_SENSE,${res.tapIndex + 1}`).then(this.handleCommandResponse) }); },
  onFaceSnapChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`FACE_SNAPSHOT,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onBlockDetectChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`BLOCK_DETECT,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onCryTimeChange(e: WechatMiniprogram.PickerChange) { const endTime = e.detail.value; const originalTime = this.data.deviceStatus.CRYDET_TIME || '00:00-24:00'; const startTime = originalTime.split('-')[0]; this._sendCommand(`SET_CRYDET_TIME,${startTime},${endTime}`).then(this.handleCommandResponse); },
  onResolutionTap() { const itemList = ['超高清 (1080P)', '高清 (720P)', '标清 (360P)']; const values = ['1080', '720', '360']; wx.showActionSheet({ itemList, success: res => this._sendCommand(`CHANGE_RESOLUTION,${values[res.tapIndex]}`).then(this.handleCommandResponse) }); },
  onImageFlipChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`UISPC,4,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onImageMirrorChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`UISPC,3,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onBrightnessChange(e: WechatMiniprogram.SliderChange) { this._sendCommand(`UISPC,0,${e.detail.value}`).then(this.handleCommandResponse); },
  onContrastChange(e: WechatMiniprogram.SliderChange) { this._sendCommand(`UISPC,1,${e.detail.value}`).then(this.handleCommandResponse); },
  onSaturationChange(e: WechatMiniprogram.SliderChange) { this._sendCommand(`UISPC,2,${e.detail.value}`).then(this.handleCommandResponse); },
  onEncodingChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`SET_ENCODE_H265,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onForceRgbChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`FORCE_RGB,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onAiBoxChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`DISABLE_AIBOX,${e.detail.value ? '0' : '1'}`).then(this.handleCommandResponse); },

  // ================== 核心修复：修正LOGO指令发送逻辑 ==================
  onLogoChange(e: WechatMiniprogram.SwitchChange) {
    // 指令是反的: 1 -> 关闭, 0 -> 开启
    const commandValue = e.detail.value ? '0' : '1';
    this._sendCommand(`DISABLE_LOGO_DISP,${commandValue}`).then(this.handleCommandResponse);
  },
  // =============================================================

  onNightLightChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`NIGHT_LAMP,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onWorkTimeChange(e: WechatMiniprogram.PickerChange) { const { type } = e.currentTarget.dataset; const value = e.detail.value; const { CAM_WORK_TIME_START, CAM_WORK_TIME_END } = this.data.deviceStatus; const start = type === 'start' ? value : CAM_WORK_TIME_START; const end = type === 'end' ? value : CAM_WORK_TIME_END; this._sendCommand(`CAM_WORK_TIME,${start},${end}`).then(this.handleCommandResponse); },
  onRebootTap() { wx.showModal({ title: '确认重启', content: '您确定要重启设备吗？', success: res => { if (res.confirm) this._sendCommand('REBOOT_DEVICE').then(() => wx.showToast({ title: '重启指令已发送', icon: 'none' })); } }); },
  onUpgradeTap() { const { FIRMWARE, VER } = this.data.deviceStatus; if (FIRMWARE !== '1') { wx.showToast({ title: '已是最新版本', icon: 'none' }); return; } const newVersion = VER.split('/')[1]; wx.showModal({ title: '固件升级', content: `检测到新版本 ${newVersion}，是否立即升级？`, success: res => { if (res.confirm) this._sendCommand(`UPGRADE_FIRMWARE,${newVersion}`).then(() => wx.showToast({ title: '升级指令已发送', icon: 'none' })); } }); },
  onSleepModeChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`SET_SLEEP_MODE,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onSysAudioChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`SYS_AUDIO,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onRecordTimeTap() { const itemList = ['15秒', '30秒', '60秒']; const values = ['15', '30', '60']; wx.showActionSheet({ itemList, success: res => this._sendCommand(`SET_RECORD_TIMES,${values[res.tapIndex]}`).then(this.handleCommandResponse) }); },
  onTempUnitChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`SET_TEMPERATURE_UNIT,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onMusicAppeasingChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`MUSIC_APPEASING,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onBreathingLedChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`BREATHING_LED,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  handleCommandResponse(res: any) { if (res.type === 'success' && res.data) { const status = JSON.parse(res.data); this._updateDeviceStatus(status); } else { wx.showToast({ title: '操作失败', icon: 'error' }); } },
  toggleMusicPanel() { this.setData({ showMusicPanel: !this.data.showMusicPanel }); if (this.data.showMusicPanel) { this.getDeviceStatusAndMusicList(); } },
  async getDeviceStatusAndMusicList() { if (!this.data.isPlaySuccess) return; try { const res = await this._sendCommand('CHECK_ONLINE'); if (res.type === 'success' && res.data) { const status = JSON.parse(res.data); const musicArray = []; for (let i = 0; i < 10; i++) { if (status[`Music${i}`]) musicArray.push(status[`Music${i}`]); else break; } this.setData({ musicList: musicArray }); this._updateDeviceStatus(status); } } catch (err) { console.error('获取设备状态失败:', err); } },
  onMusicListItemTap(e: WechatMiniprogram.TouchEvent) { this.controlMusic('play', e.currentTarget.dataset.song); },
  toggleMusicPlay() { if (!this.data.currentSong) return; this.controlMusic(this.data.musicState === 1 ? 'pause' : 'play', this.data.currentSong); },
  async controlMusic(action: 'play' | 'pause', songName: string) { try { const res = await this._sendCommand(`SET_LULLABY_PLAY,${action},${songName}`); this.handleCommandResponse(res); } catch (err) { console.error(`音乐操作 ${action} 失败:`, err); } },
  toggleMute() { this.setData({ isMuted: !this.data.isMuted }); },
  takeSnapshot() { if (!this.data.isPlaySuccess) return; this.userData.player?.snapshotAndSave(); },
  toggleRecording() { if (!this.data.isPlaySuccess) return; this.data.isRecording ? this.userData.player?.stopRecordFlv() : this.userData.player?.startRecordFlv(recordFlvOptions); },
  toggleVoice() { if (!this.data.isPlaySuccess) return; this.data.voiceState === 'VoiceIdle' ? this.userData.voiceComponent?.startVoice() : this.userData.voiceComponent?.stopVoice(); },
  controlPTZ(e: WechatMiniprogram.TouchEvent) { const ptzAction = e.currentTarget.dataset.cmd as string; const directionMap: { [key: string]: string } = { 'ptz_up_press': 'UP', 'ptz_down_press': 'DOWN', 'ptz_left_press': 'LEFT', 'ptz_right_press': 'RIGHT' }; const direction = directionMap[ptzAction]; if (!direction || !this.userData.deviceId) return; this.setData({ ptzCmd: ptzAction }); this._sendCommand(`UYTKZ,${direction},1`).catch((err: any) => console.error(`PTZ指令 ${direction} 失败:`, err)); },
  releasePTZBtn() { this.setData({ ptzCmd: '' }); },
  onInputCommand(e: WechatMiniprogram.Input) { this.setData({ inputCommand: e.detail.value }); },
  sendCommand() { if (!this.data.inputCommand || !this.userData.deviceId) return; this._sendCommand(this.data.inputCommand).then((res: any) => { let content = '类型：' + res.type; if (res.data) { try { content += '\n内容：' + JSON.stringify(JSON.parse(res.data), null, 2); } catch { content += '\n内容：' + res.data; } } wx.showModal({ title: '信令成功', content: content, showCancel: false }); }).catch((err: any) => wx.showModal({ title: '信令失败', content: err.errMsg, showCancel: false })); },
});