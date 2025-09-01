Page({
  /**
   * 页面的初始数据
   */
  data: {},

  /**
   * 跳转到视频播放页面
   * @param event 点击事件对象
   */
  setVideo(event: WechatMiniprogram.BaseEvent) {
    // 从 data-type 属性中获取传递的参数
    const videoType = event.currentTarget.dataset.type;

    if (videoType) {
      wx.navigateTo({
        url: `/pages/video_set/video_set?title=${videoType}`
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 页面加载时可以执行的逻辑
  },
});