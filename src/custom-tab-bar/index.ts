Component({
  data: {
    value: 0,
    tabBar: [
      { url: '/pages/index/index', label: '首页', name: 'houses', value: 0 },
      { url: '/pages/memo/memo', label: '介绍', name: 'application', value: 1 },
      { url: '/pages/msg/msg', label: '消息', name: 'notification', value: 2 },
      { url: '/pages/mine/mine', label: '我的', name: 'user-1', value: 3 }
    ],
    showBar: true,
  },
    methods: {
    // Tab 切换 (保持不变)
    onChange(event) {
      const index = event.detail.value;
      const targetTab = this.data.tabBar[index];
      if (targetTab && targetTab.url) {
        wx.switchTab({
          url: targetTab.url,
          success: () => { console.log(`已切换到 tabBar 页面: ${targetTab.url}`); },
          fail: (err) => { console.error(`切换 tabBar 页面 ${targetTab.url} 失败:`, err); }
        });
      } else {
        console.warn("onChange 事件触发，但对应的索引或 URL 无效:", index);
      }
    },
        // 初始化 TabBar 选中状态
    init() {
      const page = getCurrentPages().pop();
      if (page) {
        const route = `/${page.route}`;
        // 查找当前页面路由对应的 tabBar 项的索引
        const targetIndex = this.data.tabBar.findIndex(item => item.url === route);

        if (targetIndex !== -1) { // 如果当前页面是 tabBar 页面
           // 只有在当前选中的 value 与目标索引不同时才更新
           if (this.data.value !== targetIndex) {
              this.setData({ value: targetIndex });
              console.log(`TabBar init: 设置选中项到索引 ${targetIndex}`);
           } else {
               console.log(`TabBar init: 当前选中索引 ${this.data.value} 与页面 ${route} 匹配，无需更新。`);
           }
        } else {
          // 如果当前页面不是 tabBar 页面
          // 可以选择保留上一次的选中状态，或者设置为一个表示“未选中”的值（如 -1）
           // 检查当前 value 是否仍然是 tabbar 页面的索引，如果不是则不处理
           const currentValueInTabBar = this.data.tabBar.find(item => item.value === this.data.value);
           if (currentValueInTabBar && currentValueInTabBar.url !== route) {
               console.log(`TabBar init: Current value ${this.data.value} corresponds to a tabBar page, but the current page ${route} is not. Retaining value.`);
               // 或者设置为 -1
               // this.setData({ value: -1 });
           } else {
                console.log(`TabBar init: Current page ${route} is not a tabBar page. Value ${this.data.value} might be correct or default. Retaining value.`);
           }
        }
      } else {
      }
    }
}});