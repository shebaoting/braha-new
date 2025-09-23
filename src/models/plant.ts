// models/plant.ts
class Plant {
  constructor(data) {
    this.systemInfo = data.systemInfo || {};
    this.pixelRatio1 = data.pixelRatio1 || 0;
    this.menuInfo = data.menuInfo || {};
    this.statusHeight = data.statusHeight || 0;
    this.naviHeight = data.naviHeight || 0;
    this.topHeight = data.topHeight || 0;
    this.screenHeight = data.screenHeight || 0;
    this.bottomHeight = data.bottomHeight || 0;
  }

  updateData(data) {
    Object.assign(this, data);
  }
}

export default Plant;
