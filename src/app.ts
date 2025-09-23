import { compareVersion } from './utils/util';
import PlantStore from './stores/plant-store'
import UserStore from './stores/user-store'
App({
  console: console,
  logger: null,
  pluginLogger: null,
  xp2pManager: null, // 全局持有xp2pManager实例
  async onLaunch() {
    // 初始化自定义日志记录器
    console.log('App onLaunch')
    // 初始化 PlantStore
    await PlantStore.init()

    // 缓存 adjustedTop 和 remainingHeight
    const { adjustedTop, remainingHeight } = PlantStore.data
    wx.setStorageSync('adjustedTop', adjustedTop)
    wx.setStorageSync('remainingHeight', remainingHeight)

    // 初始化 UserStore
    await UserStore.init()

  },
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
  globalData: {
    userInfo: null,
    openid: null,
    systemSettings: null,
  },
})
