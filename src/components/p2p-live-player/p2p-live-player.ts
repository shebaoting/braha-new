// 伪造 console 以使用全局 logger
const app = getApp();
const console = app.logger || console;

Component({
  behaviors: ['wx://component-export'], // 必须有这个 behavior，export() 才能生效
  options: {
    styleIsolation: 'apply-shared',
    multipleSlots: true,
  },
  properties: {
    compClass: String,
    deviceInfo: Object,
    xp2pInfo: String,
    liveStreamDomain: String,
    needCheckStream: Boolean,
    sceneType: String,
    streamChannel: Number,
    streamQuality: String,
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
    record: false, // 用于控制组件内部UI状态
    orientation: 'vertical',
    fill: false,
    controlsId: 'controls',
    showIcons: {
      quality: true,
      muted: true,
      orientation: true,
      fill: true,
      fullScreen: true,
      snapshot: true,
      record: true, // 确保录像图标显示
    },
  },
  lifetimes: {
    attached() {
      const showIcons = this.data.showIcons;
      if (this.properties.deviceInfo.isMjpgDevice) {
        showIcons.orientation = false;
        showIcons.record = false; // MJPG 格式不支持录制
      } else {
        showIcons.orientation = true;
        showIcons.record = true;
      }
      this.setData({ showIcons });
    },
    ready() {
      // @ts-ignore
      this.player = this.selectComponent(`#${this.data.playerId}`);
    },
  },

  // ================== 核心修复：导出方法给父组件使用 ==================
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
  // ================================================================

  methods: {
    // 播放器状态变化
    onPlayStateEvent({ type, detail }: {type: string, detail: any}) {
      if (type === 'playsuccess') {
        this.setData({ isPlaySuccess: true });
      } else if (type === 'playstop' || type === 'playend' || type === 'playerror') {
        this.setData({ isPlaySuccess: false });
      }
      this.triggerEvent('playstatechagne', { type, detail });
    },

    // 播放错误
    onPlayError({ type, detail }: {type: string, detail: any}) {
      this.setData({ isPlaySuccess: false });
      wx.showModal({
        content: `${detail.errMsg || '播放失败'}`,
        showCancel: false,
      });
      this.triggerEvent('playstatechagne', { type, detail });
    },

    // 全屏状态变化
    onFullScreenChange({ type, detail }: {type: string, detail: any}) {
        this.setData({ fullScreen: detail.fullScreen });
        this.triggerEvent(type, detail);
    },

    // 网络状态事件
    onNetStatus({ type, detail }: {type: string, detail: any}) {
      // 只要接收到视频数据（NET_STATUS_VIDEO_DATA_RECEIVED），就认为播放成功
      if (detail?.info?.code === 2106 && !this.data.isPlaySuccess) {
        console.log('检测到视频数据流，强制标记为播放成功！');
        this.setData({ isPlaySuccess: true });
        this.triggerEvent('playstatechagne', { type: 'playsuccess', detail: { msg: 'Stream data received' } });
      }
      this.triggerEvent(type, detail);
    },

    // 录像状态变化 (来自底层插件)
    onRecordStateChange({detail}: {detail: any}) {
      this.setData({ record: detail.record });
      this.triggerEvent('recordstatechange', detail);
    },

    // 录像文件状态变化 (来自底层插件)
    onRecordFileStateChange({detail}: {detail: any}) {
      this.triggerEvent('recordfilestatechange', detail);
    },

    // 控件图标点击
    clickControlIcon({ detail }: {detail: {name: string}}) {
        const { name } = detail;
        switch (name) {
            case 'muted':
                this.setData({ muted: !this.data.muted });
                break;
            case 'orientation':
                this.setData({ orientation: this.data.orientation === 'horizontal' ? 'vertical' : 'horizontal' });
                break;
            case 'fill':
                this.setData({ fill: !this.data.fill });
                break;
            case 'fullScreen':
                // @ts-ignore
                this.data.fullScreen ? this.player.exitFullScreen() : this.player.requestFullScreen({ direction: 90 });
                break;
            case 'snapshot':
                this.snapshotAndSave();
                break;
            case 'record':
                // 当组件内部的录像按钮被点击时，通知父页面来处理
                this.triggerEvent('recordtap');
                break;
        }
    },

    // --- 封装内部方法，供 export 和内部调用 ---
    isPlaySuccess() {
        return this.data.isPlaySuccess;
    },
    snapshotAndSave() {
      // @ts-ignore
      if(this.player) this.player.snapshotAndSave();
    },
    startRecordFlv(options: any) {
      // @ts-ignore
      if(this.player) this.player.startRecordFlv(options);
    },
    stopRecordFlv() {
      // @ts-ignore
      if(this.player) this.player.stopRecordFlv();
    }
  }
});