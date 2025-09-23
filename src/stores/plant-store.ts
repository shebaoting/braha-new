// stores/plant-store.ts
import { Store } from 'westore'; // 从 westore 导入 Store 类
import Plant from '../models/plant'; // 从 models 目录导入 Plant 类

class PlantStore extends Store {
  constructor() {
    super(); // 调用父类构造函数
    this.data = new Plant({}); // 初始化 Plant 实例作为 store 的数据
    console.log('PlantStore initialized:', this.data); // 打印初始化信息
  }

  // 异步初始化方法，用于获取和设置初始数据
  async init() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    // 获取菜单按钮的位置信息
    const menuInfo = wx.getMenuButtonBoundingClientRect();

    // 构造初始的 plant 数据对象
    const plantData = {
      systemInfo,
      pixelRatio1: 750 / systemInfo.windowWidth, // 计算 1rpx 像素值
      menuInfo,
      statusHeight: systemInfo.statusBarHeight * (750 / systemInfo.windowWidth), // 计算状态栏高度
      naviHeight: (menuInfo.top - systemInfo.statusBarHeight) * 2 + menuInfo.height * (750 / systemInfo.windowWidth), // 计算导航栏高度
      topHeight: (systemInfo.statusBarHeight + ((menuInfo.top - systemInfo.statusBarHeight) * 2 + menuInfo.height * (750 / systemInfo.windowWidth))) * (750 / systemInfo.windowWidth), // 计算顶部高度
      screenHeight: systemInfo.screenHeight * (750 / systemInfo.windowWidth), // 计算屏幕高度
      bottomHeight: (systemInfo.screenHeight - systemInfo.safeArea.bottom) * (750 / systemInfo.windowWidth) // 计算底部高度
    };

    // 更新 store 数据
    this.data.updateData(plantData);
    // 计算 adjustedTop
    this.calculateAdjustedTop();
    // 计算剩余高度
    this.calculateRemainingHeight();
    // 调用 update 方法更新 store
    this.update();
  }

  // 计算 adjustedTop 方法
  calculateAdjustedTop() {
    const { menuInfo } = this.data; // 从 store 数据中获取 menuInfo
    const tabHeight = 50; // 假设的 tab 高度
    const offset = (tabHeight - menuInfo.height) / 2; // 计算偏移量
    this.data.adjustedTop = menuInfo.top - offset; // 计算 adjustedTop 并更新 store 数据
    console.log('Adjusted top calculated:', this.data.adjustedTop); // 打印计算结果
  }

  // 计算剩余高度方法
  calculateRemainingHeight() {
    const { topHeight, bottomHeight, screenHeight } = this.data; // 从 store 数据中获取相关高度值
    this.data.remainingHeight = (screenHeight - topHeight - bottomHeight) / 2; // 计算剩余高度
    console.log('Remaining height calculated:', this.data.remainingHeight); // 打印计算结果
  }

  // 重写 update 方法，在调用父类方法后打印更新后的数据
  update() {
    super.update(); // 调用父类的 update 方法
    console.log('PlantStore data updated:', this.data); // 打印更新后的数据
  }
}

export default new PlantStore(); // 导出 PlantStore 实例
