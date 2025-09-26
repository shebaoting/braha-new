// src/pages/mine/mine.ts
import userStore from '../../stores/user-store';

Page({
  data: {
    userInfo: null as any,
  },

  onLoad() {
        this.setData({
      userInfo: userStore.data.userInfo,
    });
  },


  onShow() {
    if (this.getTabBar() && this.getTabBar().init) {
      this.getTabBar().init()
    }

    userStore.init();
  },

  /**
   * 跳转到用户信息编辑页
   */
  logincheck() {
    if (this.data.userInfo) {
      wx.navigateTo({ url: '/pages/mine/userInfo/userInfo' });
    } else {
      wx.showToast({
        title: '正在获取用户信息...',
        icon: 'none'
      });
    }
  },

  /**
   * 通用页面跳转
   */
  page_to(event: WechatMiniprogram.BaseEvent) {
    const url = event.currentTarget.dataset.url;
    if (!url) return;

    // 由于是静默登录，直接判断是否有用户信息即可
    if (this.data.userInfo) {
      wx.navigateTo({ url });
    } else {
       wx.showToast({
        title: '正在获取用户信息...',
        icon: 'none'
      });
    }
  },

  /**
   * 跳转到编辑用户信息页面
   */
  set_user() {
    wx.navigateTo({ url: '/pages/mine/userInfo/userInfo' });
  },

  onUnload() {

    userStore.remove(this);
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