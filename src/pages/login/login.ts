const app = getApp();

Page({
  data: {
    checked: false,
    loginInfo: null as any, // 用于存储后端返回的 sessionKey 等信息
  },

  onLoad() {
    this.getSessionInfo();
  },

  /**
   * 步骤一：获取 code，并从后端换取 sessionKey, openid 等信息
   */
  getSessionInfo() {
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('wx.login code:', res.code);
          // TODO: 替换为您的后端API请求
          // const response = await yourApi.minilogin({ code: res.code, relogin: true });
          // this.setData({ loginInfo: response.data });

          // --- 模拟API返回 ---
          console.log("正在模拟从后端获取 sessionKey 和 openid...");
          setTimeout(() => {
            this.setData({
              loginInfo: {
                sessionKey: 'mock_session_key_12345',
                openid: 'mock_openid_67890',
                unionid: 'mock_unionid_abcde'
              }
            });
            console.log("模拟 sessionKey 获取成功!");
          }, 500);
          // --- 模拟结束 ---

        } else {
          console.error('wx.login 失败！' + res.errMsg);
        }
      }
    });
  },

  /**
   * 未勾选协议时点击登录的提示
   */
  checkLogin() {
    wx.showToast({
      title: '请阅读并勾选用户协议',
      icon: 'none'
    });
  },

  /**
   * 步骤二：用户授权手机号后的回调
   */
  login(e: WechatMiniprogram.ButtonGetPhoneNumber) {
    if (e.detail.errMsg && e.detail.errMsg.includes("ok")) {
      console.log('用户同意授权手机号');
      // TODO: 替换为您的后端API请求，以解密手机号并完成登录/注册
      // const res = await yourApi.miniRegedit({
      //   sessionKey: this.data.loginInfo.sessionKey,
      //   encryptedData: e.detail.encryptedData,
      //   iv: e.detail.iv,
      //   openid: this.data.loginInfo.openid,
      //   unionid: this.data.loginInfo.unionid
      // });
      // if (res.code == 200) {
      //   app.globalData.userInfo = res.data;
      //   app.globalData.isLogin = true;
      //   ...
      // }

      // --- 模拟API调用和成功登录 ---
      console.log("正在模拟后端验证并登录...");
      wx.showLoading({ title: '登录中...' });
      setTimeout(() => {
        wx.hideLoading();
        app.globalData.userInfo = { nickname: '微信用户', avatar: '' }; // 模拟用户信息
        app.globalData.isLogin = true;

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500,
          complete: () => {
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/index/index'
              });
            }, 1500);
          }
        });
      }, 1000);
      // --- 模拟结束 ---

    } else {
      console.log('用户拒绝授权手机号');
      wx.showToast({
        title: '您已取消授权',
        icon: 'none'
      });
    }
  },

  /**
   * 稍后登录（返回上一页）
   */
  loginBack() {
    wx.navigateBack();
  },

  /**
   * 切换复选框状态
   */
  toggleCheck() {
    this.setData({
      checked: !this.data.checked,
    });
  },

  /**
   * 跳转到协议/政策页面
   */
  goToPage(e: WechatMiniprogram.BaseEvent) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({ url });
    }
  }
});