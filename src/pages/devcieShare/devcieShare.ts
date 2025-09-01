// pages/mine/Devices/devcieShare.ts

Page({
  data: {
    phone: '',
    roleName: '',
    bed_id: -1,
    camera_id: -1,
    userid: -1,
  },

  /**
   * 页面加载时获取路由参数
   */
  onLoad(options: { bed_id?: string; camera_id?: string; userid?: string }) {
    this.setData({
      bed_id: parseInt(options.bed_id || '-1', 10),
      camera_id: parseInt(options.camera_id || '-1', 10),
      userid: parseInt(options.userid || '-1', 10),
    });
  },

  /**
   * 处理输入事件，更新数据
   */
  handleInput(event: WechatMiniprogram.Input) {
    const field = event.currentTarget.dataset.field as ('phone' | 'roleName');
    if (field) {
      this.setData({
        [field]: event.detail.value,
      });
    }
  },

  /**
   * 点击确认按钮
   */
  async confirmBtn() {
    // 1. 验证角色名称
    if (!this.data.roleName.trim()) {
      wx.showToast({ title: '角色名称不能为空', icon: 'none' });
      return;
    }

    // 2. 验证手机号
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(this.data.phone)) {
      wx.showToast({ title: '请输入合法的手机号', icon: 'none' });
      return;
    }

    // 3. 验证通过，执行分享逻辑
    this.checkAndShare();
  },

  /**
   * 检查手机号并分享设备
   */
  async checkAndShare() {
    wx.showLoading({ title: '正在分享...' });

    try {
      // 步骤一：检查手机号是否存在
      // 模拟API请求
      const checkRes: any = await this.mockApiRequest('checkPhone', { phone: this.data.phone });

      if (checkRes && checkRes.data && checkRes.data.userid) {
        const targetUserId = checkRes.data.userid;

        // 步骤二：分享设备
        // 模拟API请求
        const shareRes: any = await this.mockApiRequest('shareDevice', {
          bed_id: this.data.bed_id,
          camera_id: this.data.camera_id,
          userid: targetUserId,
          relationName: this.data.roleName,
          createid: this.data.userid,
        });

        if (shareRes && shareRes.data > 0) {
          wx.hideLoading();
          wx.showToast({
            title: '分享成功',
            icon: 'success',
          });
          // 延迟后返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          throw new Error('分享失败');
        }
      } else {
        throw new Error('该用户不存在');
      }
    } catch (error: any) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none',
      });
    }
  },

  /**
   * 模拟API请求函数
   * @param action 请求的动作
   * @param params 请求的参数
   */
  mockApiRequest(action: string, params: any): Promise<any> {
    console.log(`Executing ${action} with params:`, params);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (action === 'checkPhone') {
          if (params.phone === '13800138000') { // 假设这是一个已注册的用户
            resolve({ data: { userid: 100 } });
          } else {
            resolve({ data: null }); // 用户不存在
          }
        } else if (action === 'shareDevice') {
          resolve({ data: 1 }); // 模拟分享成功
        } else {
          reject(new Error('未知的API动作'));
        }
      }, 500);
    });
  },
});