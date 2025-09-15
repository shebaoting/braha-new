// 伪造 console 以使用全局 logger
const app = getApp();
const console = app.logger || console;

Component({
  behaviors: ['wx://component-export'],
  options: {
    styleIsolation: 'apply-shared',
    multipleSlots: true,
  },
  properties: {
    // ... 原有属性
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
    record: false,
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
      record: true,
    },
  },
  lifetimes: {
    attached() {
      // 在组件实例进入页面节点树时执行
      // 根据设备类型调整
      const showIcons = this.data.showIcons;
      if (this.properties.deviceInfo.isMjpgDevice) {
        showIcons.orientation = false;
      } else {
        showIcons.orientation = true;
      }
      this.setData({ showIcons });
    },
    ready() {
      this.player = this.selectComponent(`#${this.data.playerId}`);
    },
  },
  methods: {
    onPlayStateEvent({ type, detail }) {
      if (type === 'playsuccess') {
        this.setData({ isPlaySuccess: true });
      } else if (type === 'playstop' || type === 'playend' || type === 'playerror') {
        this.setData({ isPlaySuccess: false });
      }
      this.triggerEvent('playstatechagne', { type, detail });
    },
    onPlayError({ type, detail }) {
      this.setData({ isPlaySuccess: false });
      wx.showModal({
        content: `${detail.errMsg || '播放失败'}`,
        showCancel: false,
      });
    },
    onFullScreenChange({ type, detail }) {
        this.setData({ fullScreen: detail.fullScreen });
        this.triggerEvent(type, detail);
    },
    clickControlIcon({ detail }) {
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
                this.data.fullScreen ? this.player.exitFullScreen() : this.player.requestFullScreen({ direction: 90 });
                break;
            case 'snapshot':
                this.player.snapshotAndSave();
                break;
        }
    },
    isPlaySuccess() {
        return this.data.isPlaySuccess;
    }
  }
});