// pages/msg/msg.ts

Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabList: [
      { name: '全部' },
      { name: '系统消息' },
      { name: '故障消息' },
    ],
    current: 0, // 当前激活的 tab 索引
  },

  /**
   * 切换 Tab
   */
  changeTab(event: WechatMiniprogram.BaseEvent) {
    const index = event.currentTarget.dataset.index;
    if (this.data.current !== index) {
      this.setData({
        current: index,
      });
      // 在这里可以添加获取不同类型消息的逻辑
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 页面加载时可以获取初始消息列表
  },
  onShow() {
    if (this.getTabBar() && this.getTabBar().init) {
      this.getTabBar().init()
    }
  },
  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '我的消息',
      path: '/pages/msg/msg'
    };
  }
});