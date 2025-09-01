// pages/index/systemSetting/video_set.ts

Page({
  data: {
    title: '',
    videoUrl: '',
    current: -1,
    imageList: [] as number[], // 用于图片列表循环
  },

  onLoad(options: any) {
    // 将从 options 获取的字符串参数转换为数字
    const currentOption = parseInt(options.title, 10);
    this.setData({
      current: currentOption,
    });

    // 如果是产品说明，则生成一个图片序号数组
    if (currentOption === 1) {
      const images: number[] = [];
      for (let i = 1; i <= 36; i++) {
        images.push(i);
      }
      this.setData({ imageList: images });
    }

    // 初始化 video 上下文
    wx.createVideoContext("myVideo", this);

    this.setVideo();
  },

  /**
   * 视频播放出错回调
   */
  videoErrorCallback(e: any) {
    console.error('video error:', e.detail.errMsg);
  },

  /**
   * 根据页面参数设置标题和视频URL
   */
  setVideo() {
    let newTitle = '';
    let newVideoUrl = '';

    switch (this.data.current) {
      case 1:
        newTitle = '产品说明';
        break;
      case 2:
        newTitle = '说明视频';
        newVideoUrl = 'https://braha.oss-cn-beijing.aliyuncs.com/app/video/shiyongshipin.mp4';
        break;
      case 3:
        newTitle = '安装视频';
        newVideoUrl = 'https://braha.oss-cn-beijing.aliyuncs.com/app/video/setupvideo.mp4';
        break;
      case 4:
        newTitle = '复位视频';
        newVideoUrl = 'https://braha.oss-cn-beijing.aliyuncs.com/app/video/fuweishipin.mp4';
        break;
      case 5:
        newTitle = '拆件视频';
        newVideoUrl = 'https://braha.oss-cn-beijing.aliyuncs.com/app/video/chaijianshipin.mp4';
        break;
    }

    this.setData({
      title: newTitle,
      videoUrl: newVideoUrl
    });
  },

  /**
   * 返回上一页
   */
  navigateBack() {
    wx.navigateBack();
  }
});