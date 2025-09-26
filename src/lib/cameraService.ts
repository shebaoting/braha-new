import { getXp2pManager } from './xp2pManager';

interface ActiveDevice {
  deviceId: string;
  xp2pManager: any; // 声明为 any 类型以简化，实际应为 IXp2pManager
}

class CameraService {
  private activeDevice: ActiveDevice | null = null;

  /**
   * 当进入摄像头实时监控页面并成功连接后，调用此方法进行注册
   * @param deviceId - 当前活动设备的 deviceId
   */
  public setActiveDevice(deviceId: string) {
    this.activeDevice = {
      deviceId,
      xp2pManager: getXp2pManager(),
    };
    console.log('[CameraService] A-ctive device set:', this.activeDevice.deviceId);
  }

  /**
   * 清除当前活动的设备信息，在退出监控页面时调用
   */
  public clearActiveDevice() {
    console.log('[CameraService] Active device cleared.');
    this.activeDevice = null;
  }

  /**
   * 获取当前活动的设备ID
   * @returns 当前设备ID或 null
   */
  public getActiveDeviceId(): string | null {
    return this.activeDevice ? this.activeDevice.deviceId : null;
  }

  /**
   * 全局发送指令的方法
   * 所有设置页面都应调用此方法来控制设备
   * @param cmd - 纯指令部分，例如 "UYTKZ,UP,1"
   * @returns Promise<any>
   */
  public sendCommand(cmd: string): Promise<any> {
    if (!this.activeDevice || !this.activeDevice.xp2pManager) {
      console.error('[CameraService] Error: No active device to send command to.');
      wx.showToast({ title: '设备未连接', icon: 'none' });
      return Promise.reject(new Error('No active device'));
    }

    // 统一添加 ",MYBABY" 后缀和腾讯云IoT P2P插件所需的前缀
    const commandString = `action=user_define&cmd=${cmd},MYBABY`;

    console.log('[CameraService] Sending command:', commandString);

    return this.activeDevice.xp2pManager.sendCommand(this.activeDevice.deviceId, commandString);
  }
}

// 导出单例
const cameraService = new CameraService();
export default cameraService;