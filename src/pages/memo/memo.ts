// pages/memo/memo.ts

// 定义Banner和Product的数据结构
interface BannerItem {
  id: number;
  bannerImg: string;
}

interface ProductItem {
  id: number;
  productImg: string;
  productName: string;
  memo: string; // 用于跳转详情页的参数
}

Page({
  data: {
    bannerList: [] as BannerItem[],
    productList: [] as ProductItem[],
  },

  onLoad() {
    this.getBanner();
    this.getProduct();
  },
  onShow() {
    if (this.getTabBar() && this.getTabBar().init) {
      this.getTabBar().init()
    }
  },
  /**
   * 获取轮播图数据
   * 这里应替换为您项目的实际API请求
   */
  getBanner() {
    // 模拟API返回
    const mockBanners: BannerItem[] = [
      { id: 1, bannerImg: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/swiper/img_cp_sc.png' },
      { id: 2, bannerImg: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/swiper/img_cp_nbt.png' }
    ];
    this.setData({ bannerList: mockBanners });

    /*
    // 实际的 wx.request 调用示例
    wx.request({
      url: 'YOUR_API_ENDPOINT/getBanner',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ bannerList: res.data.data });
        }
      }
    });
    */
  },

  /**
   * 获取产品列表数据
   * 这里应替换为您项目的实际API请求
   */
  getProduct() {
    // 模拟API返回
    const mockProducts: ProductItem[] = [
        { id: 1, productName: '智能床', productImg: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/index/img_tc_nbt.png', memo: 'bed_memo_1' },
        { id: 2, productName: '智能摄像头', productImg: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/index/img_tc_nbt.png', memo: 'camera_memo_1' }
    ];
    this.setData({ productList: mockProducts });
    /*
    // 实际的 wx.request 调用示例
    wx.request({
      url: 'YOUR_API_ENDPOINT/getProductMemo',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ productList: res.data.data });
        }
      }
    });
    */
  },

  /**
   * 跳转到产品详情页
   */
  page_to(event: WechatMiniprogram.BaseEvent) {
    const memo = event.currentTarget.dataset.memo;
    if (memo) {
      wx.navigateTo({
        url: `/pages/memo/bed_detail?current=${encodeURIComponent(memo)}`
      });
    } else {
      wx.showToast({
        title: '产品信息错误',
        icon: 'none'
      });
    }
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '产品介绍',
      path: '/pages/memo/memo'
    };
  }
});