// pages/index/addDevice/addDevice.ts

// 获取全局 app 实例
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    roleName: '',
    showModal: false,
    modalContent: '设备添加成功',
    bed_id: -1,
    camera_id: -1,
    userid: -1,
  },

  /**
   * 生命周期函数--监听页面加载
   * @param {object} options 页面启动参数
   */
  onLoad(options: { bed_id?: string; camera_id?: string; userid?: string }) {
    this.setData({
      bed_id: options.bed_id ? parseInt(options.bed_id, 10) : -1,
      camera_id: options.camera_id ? parseInt(options.camera_id, 10) : -1,
      userid: options.userid ? parseInt(options.userid, 10) : -1,
    });
  },

  /**
   * 点击确认按钮
   */
  confirmBtn() {
    if (this.data.roleName.trim().length > 0) {
      // 模拟 API 请求
      this.shareDeviceRequest();
    } else {
      // 显示错误提示的模态框
      this.setData({
        modalContent: '请输入角色名称',
        showModal: true,
      });
    }
  },

  /**
   * 模拟API请求：分享设备
   */
  shareDeviceRequest() {
    const params = {
      bed_id: this.data.bed_id,
      camera_id: this.data.camera_id,
      userid: app.globalData.userInfo.userid, // 假设 app.globalData.userInfo 存在
      relationName: this.data.roleName,
      createid: this.data.userid
    };

    console.log('发起分享设备请求:', params);

    // 在这里替换为实际的 wx.request 调用
    // wx.request({
    //   url: 'YOUR_API_ENDPOINT/shareDevice',
    //   method: 'POST',
    //   data: params,
    //   success: (res) => {
    //     if (res.data.code === 200) {
           this.setData({
             modalContent: '添加成功',
             showModal: true,
           });
    //     } else {
    //       // 处理错误情况
    //     }
    //   },
    //   fail: () => {
    //     // 处理网络错误
    //   }
    // });
  },


  /**
   * 模态框确认按钮点击事件
   */
  btn_confirm() {
    this.setData({
      showModal: false,
    });
    // 只有在添加成功时才跳转
    if (this.data.modalContent === '添加成功') {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  }
});