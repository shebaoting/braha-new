// pages/mine/userInfo/userInfo.ts
// @ts-nocheck

// 获取 App 实例
const app = getApp();

interface UserInfo {
  nickname: string;
  phone: string;
  memo: string;
  avatar: string | null;
}

Page({
  data: {
    userInfo: null as UserInfo | null,
    imgUrl: '../../assets/images/avatar_default.png', // 默认头像路径
  },

  onLoad() {
    // 从全局数据加载用户信息
    const globalUserInfo = app.globalData.userInfo;
    if (globalUserInfo) {
      this.setData({
        userInfo: { ...globalUserInfo }, // 使用副本以避免直接修改全局数据
        imgUrl: globalUserInfo.avatar || this.data.imgUrl,
      });
    }
  },

  /**
   * 更新昵称输入
   */
  onNicknameInput(e: WechatMiniprogram.Input) {
    this.setData({
      'userInfo.nickname': e.detail.value,
    });
  },

  /**
   * 更新简介输入
   */
  onMemoInput(e: WechatMiniprogram.Input) {
    this.setData({
      'userInfo.memo': e.detail.value,
    });
  },

  /**
   * 选择图片作为头像
   */
  chooseImage() {
    wx.chooseImage({
      sourceType: ['album'],
      sizeType: ['compressed'],
      count: 1,
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        // 将图片转换为 Base64 并立即上传
        this.convertImageToBase64(tempFilePath).then((base64) => {
          this.setData({
            'userInfo.avatar': base64,
            imgUrl: `data:image/jpeg;base64,${base64}`,
          });
          // 选择头像后自动触发保存
          this.confirm_save();
        });
      },
    });
  },

  /**
   * 将图片文件路径转换为 Base64 字符串
   */
  convertImageToBase64(imagePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileSystemManager = wx.getFileSystemManager();
      fileSystemManager.readFile({
        filePath: imagePath,
        encoding: 'base64',
        success: (res) => {
          resolve(res.data as string);
        },
        fail: (err) => {
          console.error('图片转Base64失败:', err);
          reject(err);
        },
      });
    });
  },

  /**
   * 确认保存用户信息
   */
  async confirm_save() {
    if (!this.data.userInfo) return;

    // 模拟调用 API 更新用户信息
    console.log('正在保存用户信息:', this.data.userInfo);

    // 假设 API 调用成功
    // const res = await yourApi.updateUser(this.data.userInfo);

    // 更新全局数据和本地存储
    app.globalData.userInfo = { ...this.data.userInfo };
    wx.setStorageSync("userInfo", this.data.userInfo);

    wx.showToast({
      title: '修改成功',
      icon: 'success',
    });
  },
});