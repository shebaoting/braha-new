import { Logger } from './lib/logger';
import { compareVersion } from './utils/util';

App({
  globalData: {},
  console: console,
  logger: null,
  pluginLogger: null,
  xp2pManager: null, // 全局持有xp2pManager实例

  onLaunch() {
    // 初始化自定义日志记录器
    this.logger = new Logger();
    this.pluginLogger = {
      log: (...args) => this.logger.log('[Plugin]', ...args),
      info: (...args) => this.logger.info('[Plugin]', ...args),
      warn: (...args) => this.logger.warn('[Plugin]', ...args),
      error: (...args) => this.logger.error('[Plugin]', ...args),
    };

    this.logger.log('App: onLaunch');
  },

  // 重启小程序的方法，在某些场景下需要
  restart() {
    const SDKVersion = wx.getSystemInfoSync().SDKVersion;
    if (compareVersion(SDKVersion, '3.0.1') >= 0) {
      wx.restartMiniProgram({
        path: '/pages/camera/view',
      });
    } else {
      wx.exitMiniProgram({});
    }
  },
});