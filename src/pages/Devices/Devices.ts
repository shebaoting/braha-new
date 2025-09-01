// pages/mine/Devices/Devices.ts
// @ts-nocheck
const app = getApp();

Page({
  data: {
    deviceList: [] as any[],
    count: 0,
    title: '',

    memberShow: false,
    memberList: [] as any[],

    qrcode_show: false,
    codeUrl: '',

    chooseDevice: {} as any, // 暂存待操作的设备
    chooseMember: {} as any, // 暂存待操作的成员
  },

  onLoad() {
    // 从全局变量获取设备列表
    const allDeviceList = app.globalData.allDeviceList || [];
    this.setData({
      deviceList: allDeviceList,
      count: allDeviceList.length,
      title: `${app.globalData.userInfo.nickname || '我'}的家`,
    });
  },

  // --- 设备操作 ---
  delDevice(e: WechatMiniprogram.BaseEvent) {
    this.setData({ chooseDevice: e.currentTarget.dataset.item });
    wx.showModal({
      title: '提示',
      content: '您确定要删除设备吗？',
      confirmColor: '#BDA01E',
      success: (res) => {
        if (res.confirm) {
          this.con_delDevice();
        }
      },
    });
  },

  async con_delDevice() {
    // 实际项目中应替换为 wx.request
    // const res = await that.$u.iotApi.delDevice({ id: this.data.chooseDevice.id });
    console.log(`正在删除设备: ${this.data.chooseDevice.id}`);
    const res = { data: true }; // 模拟成功

    if (res.data) {
      wx.showToast({ title: '解绑成功' });
      const newList = this.data.deviceList.filter(item => item.id !== this.data.chooseDevice.id);
      this.setData({
        deviceList: newList,
        count: newList.length
      });
      app.globalData.allDeviceList = newList; // 更新全局数据
    } else {
      wx.showToast({ title: '解绑失败，请联系管理员', icon: 'none' });
    }
  },

  shareDevice(e: WechatMiniprogram.BaseEvent) {
    const item = e.currentTarget.dataset.item;
    if (item.userRelation !== 1) {
      wx.showToast({ title: '您没有权限', icon: 'none' });
      return;
    }
    const params = `bed_id=${item.productBedId}&camera_id=${item.productCameraId || -1}&userid=${item.userid}`;
    wx.navigateTo({
      url: `/pages/mine/Devices/devcieShare?${params}`
    });
  },

  // --- 二维码操作 ---
  qrcode_event(e: WechatMiniprogram.BaseEvent) {
    const item = e.currentTarget.dataset.item;
    if (item.userRelation !== 1) {
      wx.showToast({ title: '您没有权限', icon: 'none' });
      return;
    }
    const info = {
      bed_id: item.productBedId,
      camera_id: item.productCameraId || -1,
      userid: item.userid
    };
    const qrUrl = 'https://api.pwmqr.com/qrcode/create/?url=' + encodeURIComponent(JSON.stringify(info));
    this.setData({
      codeUrl: qrUrl,
      qrcode_show: true,
    });
  },

  hideQrcodePopup() {
    this.setData({ qrcode_show: false });
  },

  saveImage() {
    wx.downloadFile({
      url: this.data.codeUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({ title: '保存成功' });
            },
            fail: () => {
              wx.showToast({ title: '保存失败', icon: 'none' });
            }
          });
        }
      },
      fail: () => {
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  },

  // --- 成员管理 ---
  async getItem(e: WechatMiniprogram.BaseEvent) {
    const item = e.currentTarget.dataset.item;
    if (item.userRelation !== 1) {
      wx.showToast({ title: '您没有权限', icon: 'none' });
      return;
    }
    await this.getRelationShip(item.productBedId);
    this.setData({ memberShow: true });
  },

  hideMemberPopup() {
    this.setData({ memberShow: false });
  },

  async getRelationShip(productBedId: string) {
    // 实际项目中应替换为 wx.request
    // const res = await that.$u.iotApi.getRelationShip({ product_bed_id: productBedId });
    // 模拟数据
    const mockMemberList = [
        {id: 1, nickName: '爸爸', relationname: '管理员', productBedId},
        {id: 2, nickName: '妈妈', relationname: '成员', productBedId}
    ];
    this.setData({ memberList: mockMemberList });
  },

  deleteMember(e: WechatMiniprogram.BaseEvent) {
      this.setData({ chooseMember: e.currentTarget.dataset.item });
      wx.showModal({
        title: '提示',
        content: '您确定要删除成员吗？',
        confirmColor: '#BDA01E',
        success: (res) => {
          if (res.confirm) {
            this.delItem();
          }
        },
      });
  },

  async delItem() {
    console.log(`正在删除成员: ${this.data.chooseMember.id}`);
    // const res = await that.$u.iotApi.delShip({ id: this.data.chooseMember.id });
    await this.getRelationShip(this.data.chooseMember.productBedId); // 刷新成员列表
    wx.showToast({title: '删除成功'});
  }
});