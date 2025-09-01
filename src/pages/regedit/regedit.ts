// pages/login/regedit.ts
// @ts-nocheck

const app = getApp();
let countdownInterval: any = null; // 用于存储倒计时定时器

Page({
  data: {
    phone: '',
    phone_code: '',
    openid: '',
    unionid: '',

    getcodeTxt: '获取验证码',
    issend: false,
    seconds: 60,

    codeFromServer: '', // 用于存储从服务器获取的验证码
    userInfo: null, // 用户信息
    checked: false,

    isButtonDisabled: true, // 控制“同意并继续”按钮的禁用状态
  },

  onLoad(options: any) {
    this.setData({
      openid: options.openid,
      unionid: options.unionid,
    });
  },

  onUnload() {
    // 页面卸载时清除定时器
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  },

  // --- 输入处理 ---
  onPhoneInput(e: WechatMiniprogram.Input) {
    this.setData({ phone: e.detail.value });
    this.checkButtonStatus();
  },

  onCodeInput(e: WechatMiniprogram.Input) {
    this.setData({ phone_code: e.detail.value });
    this.checkButtonStatus();
  },

  onCheckboxChange(e: WechatMiniprogram.CheckboxGroupChange) {
    this.setData({ checked: e.detail.value.length > 0 });
    this.checkButtonStatus();
  },

  // 检查是否可以启用主按钮
  checkButtonStatus() {
    const { phone, phone_code, checked } = this.data;
    const disabled = !(phone.length > 0 && phone_code.length > 0 && checked);
    this.setData({ isButtonDisabled: disabled });
  },

  // --- 核心逻辑 ---
  getCode() {
    if (!this.data.checked) {
      wx.showToast({ title: '请同意用户协议', icon: 'none' });
      return;
    }

    // 简单的手机号格式校验
    if (!/^1[3-9]\d{9}$/.test(this.data.phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    // --- 模拟API: 发送验证码 ---
    // this.$u.iotApi.sendCode(...)
    wx.showLoading({ title: '发送中...' });
    // 以下为模拟请求
    setTimeout(() => {
      wx.hideLoading();
      // 模拟成功
      const mockCode = "123456"; // 假设服务器返回的验证码
      this.setData({ codeFromServer: mockCode });
      wx.showToast({ title: `验证码已发送(模拟:${mockCode})`, icon: 'none' });
      this.startCountdown();

      // // 模拟手机号已注册的情况
      // wx.showModal({ ... });

    }, 1000);
  },

  regeditphone() {
    if (this.data.phone_code !== this.data.codeFromServer) {
      wx.showToast({ title: '验证码错误', icon: 'error' });
      return;
    }

    // --- 模拟API: 注册/登录 ---
    // this.$u.iotApi.register(...)
    wx.showLoading({ title: '登录中...' });
    setTimeout(() => {
        wx.hideLoading();
        // 模拟登录成功
        const mockUserInfo = { userId: '123', nickname: '微信用户' };
        app.globalData.userInfo = mockUserInfo;
        app.globalData.isLogin = true;
        wx.setStorageSync("userInfo", mockUserInfo);

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });

        setTimeout(() => {
          wx.switchTab({ url: "/pages/index/index" });
        }, 1500);

    }, 1000);
  },

  // --- 辅助函数 ---
  startCountdown() {
    this.setData({ issend: true });
    let { seconds } = this.data;

    countdownInterval = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(countdownInterval);
        this.setData({
          getcodeTxt: '再次获取',
          seconds: 60,
          issend: false,
        });
      } else {
        this.setData({
          getcodeTxt: `重新获取(${seconds}s)`,
          seconds: seconds,
        });
      }
    }, 1000);
  },

  // --- 页面跳转 ---
  goToUserAgreement() {
    wx.navigateTo({ url: '/pages/mine/settting/UserAgreement' });
  },

  goToPrivacyPolicy() {
    wx.navigateTo({ url: '/pages/mine/settting/PrivacyPolicy' });
  },
});