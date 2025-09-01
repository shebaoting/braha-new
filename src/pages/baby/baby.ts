// pages/baby/baby.ts
// @ts-nocheck
const app = getApp();

Page({
  data: {
    statusBarHeight: 0,
    babyList: [] as any[],
    chooseBaby: {} as any,
    memoList: [] as any[],
    dayShow: false, // 控制添加记录弹窗
    del_show: false, // 控制删除确认弹窗
    chooseDeeds: {} as any, // 待删除的记录

    icon_list: [
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/iconsg.png', name: '身高', bgColor: '#ed7e9e' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/tizhong.png', name: '体重', bgColor: '#6bcdaf' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/buru.png', name: '瓶喂母乳', bgColor: '#a772e7' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/naifen.png', name: '奶粉', bgColor: '#75bbf8' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/fushiyingyang.png', name: '辅食', bgColor: '#c87ee9' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/yinger.png', name: '头围', bgColor: '#f6ca5d' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/Thermometer.png', name: '体温', bgColor: '#6bcdaf' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/niaobu.png', name: '换尿布', bgColor: '#75bbf8' },
    ]
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 0,
    });
  },

  onShow() {
    this.getBaby();
  },

  async getBaby() {
    // 模拟API获取宝宝列表
    // const res = await this.$u.iotApi.getBabyList(...);
    const mockBabyList = [
      { babyid: 1, lovename: '小宝', field1: '男', field2: '1岁2个月', lastheight: 75, lastweight: 10 },
      { babyid: 2, lovename: '小美', field1: '女', field2: '2岁', lastheight: 85, lastweight: 12 },
    ];

    if (mockBabyList.length > 0) {
      this.setData({
        babyList: mockBabyList,
        chooseBaby: mockBabyList[0]
      });
      this.getMemoList(mockBabyList[0].babyid);
    } else {
      this.setData({
        babyList: [],
        chooseBaby: {},
        memoList: []
      });
    }
  },

  async getMemoList(babyid: number) {
      // 模拟API获取记录列表
      // const memo = await this.$u.iotApi.getBabyDayList({ babyid });
      const mockMemoList = [
        { id: 1, createtime: Date.now(), field1: '身高', field2: '75', describe: '长高高', nickName: '妈妈', imgList: ['http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/memo/buy_detail.jpg'] },
        { id: 2, createtime: Date.now() - 86400000, field1: '大事记', describe: '第一次叫爸爸', nickName: '爸爸', imgList: [] },
      ];
      this.setData({ memoList: mockMemoList });
  },

  onBabyChange(e: WechatMiniprogram.BaseEvent) {
    const index = e.detail.value;
    const selectedBaby = this.data.babyList[index];
    this.setData({ chooseBaby: selectedBaby });
    this.getMemoList(selectedBaby.babyid);
  },

  setBaby() {
    const params = Object.keys(this.data.chooseBaby).map(key => `${key}=${this.data.chooseBaby[key]}`).join('&');
    wx.navigateTo({ url: `/pages/baby/addBaby?${params}` });
  },

  addBaby() {
    wx.navigateTo({ url: '/pages/baby/addBaby' });
  },

  page_to(e: WechatMiniprogram.BaseEvent) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url });
  },

  showImg(e: WechatMiniprogram.BaseEvent) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({ urls: [url] });
  },

  show_del(e: WechatMiniprogram.BaseEvent) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
        title: '提示',
        content: '您确定要删除吗？',
        confirmColor: '#BDA01E',
        success: (res) => {
            if (res.confirm) {
                this.delDeeds_event(item);
            }
        }
    });
  },

  delDeeds_event(item: any) {
    // 模拟删除API
    // await this.$u.iotApi.delDeeds({ id: item.id });
    const newMemoList = this.data.memoList.filter(memo => memo.id !== item.id);
    this.setData({ memoList: newMemoList });
    wx.showToast({ title: '删除成功' });
  },

  showDayPopup() {
    this.setData({ dayShow: true });
  },

  hideDayPopup() {
    this.setData({ dayShow: false });
  },

  baby_day(e: WechatMiniprogram.BaseEvent) {
    const name = e.currentTarget.dataset.name;
    this.setData({ dayShow: false });
    wx.navigateTo({
      url: `/pages/baby/babyDiary?name=${name}&babyname=${this.data.chooseBaby.lovename}&babyid=${this.data.chooseBaby.babyid}`
    });
  }
});