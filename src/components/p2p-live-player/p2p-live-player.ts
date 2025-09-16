const app = getApp();
const console = app.logger || console;

Component({
  behaviors: ['wx://component-export'],
  options: {
    styleIsolation: 'apply-shared',
    multipleSlots: true,
  },
  properties: {
    compClass: String,
    deviceInfo: Object,
    xp2pInfo: String,
    streamQuality: String,
    // ... 其他属性保持不变
    liveStreamDomain: String,
    needCheckStream: Boolean,
    sceneType: String,
    streamChannel: Number,
    mode: String,
    soundMode: String,
    muted: Boolean,
    acceptPlayerEvents: Object,
    onlyp2pMap: Object,
    showLog: Boolean,
  },
  data: {
    playerId: 'iot-p2p-player',
    isPlaySuccess: false,
    fullScreen: false,
    record: false,
    orientation: 'vertical',
    fill: false,
    // 将清晰度列表和映射关系放入组件内部
    qualityList: [
      { value: 'standard', text: '标清' },
      { value: 'high', text: '高清' },
      { value: 'super', text: '超清' },
    ],
    qualityMap: {
      standard: '标清',
      high: '高清',
      super: '超清',
    },
    // 将内部清晰度状态与属性分开，方便控制
    innerStreamQuality: '',
  },
  lifetimes: {
    attached() {
      // 初始化时，将外部传入的清晰度赋值给内部状态
      this.setData({
        innerStreamQuality: this.properties.streamQuality,
      });
    },
    ready() {
      // @ts-ignore
      this.player = this.selectComponent(`#${this.data.playerId}`);
    },
  },
  export() {
    return {
      isPlaySuccess: () => this.data.isPlaySuccess,
      snapshotAndSave: () => this.snapshotAndSave(),
      startRecordFlv: (options: any) => this.startRecordFlv(options),
      stopRecordFlv: () => this.stopRecordFlv(),
      requestFullScreen: (options: any) => this.player?.requestFullScreen(options),
      exitFullScreen: () => this.player?.exitFullScreen(),
    };
  },
  methods: {
    onPlayStateEvent({ type, detail }: { type: string; detail: any }) {
      if (type === 'playsuccess') {
        this.setData({ isPlaySuccess: true });
      } else if (type === 'playstop' || type === 'playend' || type === 'playerror') {
        this.setData({ isPlaySuccess: false });
      }
      this.triggerEvent('playstatechagne', { type, detail });
    },

    onPlayError({ type, detail }: { type: string; detail: any }) {
      this.setData({ isPlaySuccess: false });
      wx.showModal({
        content: `${detail.errMsg || '播放失败'}`,
        showCancel: false,
      });
      this.triggerEvent('playstatechagne', { type, detail });
    },

    onFullScreenChange({ type, detail }: { type: string; detail: any }) {
      this.setData({ fullScreen: detail.fullScreen });
      this.triggerEvent(type, detail);
    },

    onNetStatus({ type, detail }: { type: string; detail: any }) {
      if (detail?.info?.code === 2106 && !this.data.isPlaySuccess) {
        this.setData({ isPlaySuccess: true });
        this.triggerEvent('playstatechagne', { type: 'playsuccess', detail: { msg: 'Stream data received' } });
      }
      this.triggerEvent(type, detail);
    },

    onRecordStateChange({ detail }: { detail: any }) {
      this.setData({ record: detail.record });
      this.triggerEvent('recordstatechange', detail);
    },

    onRecordFileStateChange({ detail }: { detail: any }) {
      this.triggerEvent('recordfilestatechange', detail);
    },

    // ================== 新增功能方法 ==================

    // 切换清晰度
    handleChangeQuality() {
        if (!this.data.isPlaySuccess) return;
        const itemList = this.data.qualityList.map(item => item.text);
        wx.showActionSheet({
            itemList,
            success: (res) => {
                const selectedQuality = this.data.qualityList[res.tapIndex];
                if (selectedQuality.value !== this.data.innerStreamQuality) {
                    console.log('切换清晰度到:', selectedQuality.value);
                    this.setData({ innerStreamQuality: selectedQuality.value });
                    // 注意：插件的 `iot-p2p-player-with-mjpg` 组件会自动监听 streamQuality 属性的变化并重新拉流
                }
            }
        });
    },

    // 切换全屏
    handleToggleFullScreen() {
      // @ts-ignore
      this.data.fullScreen ? this.player.exitFullScreen() : this.player.requestFullScreen({ direction: 90 });
    },

    // 启动画中画
    handlePictureInPicture() {
      if (!this.data.isPlaySuccess) return;
      // @ts-ignore
      this.player.requestPictureInPicture({
        success:() => console.log('进入画中画成功'),
        fail:(err:any) => console.error('进入画中画失败', err)
      })
    },

    // ================== 原有方法 ==================

    snapshotAndSave() {
      // @ts-ignore
      if (this.player) this.player.snapshotAndSave();
    },
    startRecordFlv(options: any) {
      // @ts-ignore
      if (this.player) this.player.startRecordFlv(options);
    },
    stopRecordFlv() {
      // @ts-ignore
      if (this.player) this.player.stopRecordFlv();
    },
  },
});