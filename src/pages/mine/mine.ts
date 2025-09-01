// pages/mine/mine.ts

// 假设 App 的 globalData 结构
interface IAppOption {
  globalData: {
    userInfo?: any;
    isLogin?: boolean;
  }
}

const app = getApp<IAppOption>();

Page({
  data: {
    avatarUrl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/mine/avatar.png',
    userInfo: null as any,
  },

  onShow() {

    if (this.getTabBar() && this.getTabBar().init) {
      this.getTabBar().init()
    }

    // 页面显示时，从全局数据更新用户信息
    const userInfo = app.globalData.userInfo;
    this.setData({
      userInfo: userInfo,
      avatarUrl: userInfo?.avatar || 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/mine/avatar.png'
    });
  },

  /**
   * 检查登录状态并跳转
   * 如果已登录，跳转到用户信息页；否则，触发登录流程
   */
  logincheck() {
    if (app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/mine/userInfo/userInfo' });
    } else {
      // 调用全局登录处理函数
      // loginManager();
      console.log("需要触发登录流程");
      wx.navigateTo({ url: '/pages/login/login' }); // 假设跳转到登录页
    }
  },

  /**
   * 通用页面跳转
   */
  page_to(event: WechatMiniprogram.BaseEvent) {
    const url = event.currentTarget.dataset.url;
    if (!url) return;

    if (app.globalData.isLogin) {
      wx.navigateTo({ url });
    } else {
      // loginManager();
      console.log("需要触发登录流程");
      wx.navigateTo({ url: '/pages/login/login' }); // 假设跳转到登录页
    }
  },

  /**
   * 跳转到编辑用户信息页面
   */
  set_user() {
    wx.navigateTo({ url: '/pages/mine/userInfo/userInfo' });
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '个人中心',
      path: '/pages/mine/mine'
    };
  }
});