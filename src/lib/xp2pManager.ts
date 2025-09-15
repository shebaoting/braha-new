import { getUserId } from '../utils/util';

let xp2pManager = null;

export const getXp2pManager = () => {
  if (!xp2pManager) {
    const xp2pPlugin = requirePlugin('xp2p');
    const iotExports = xp2pPlugin.iot;
    const app = getApp();

    iotExports?.setUserId?.(getUserId() || 'demo');

    if (app.pluginLogger && wx.getAccountInfoSync().miniProgram.envVersion === 'develop') {
      iotExports?.setPluginLogger?.(app.pluginLogger);
    }

    xp2pManager = iotExports.getXp2pManager();
    app.xp2pManager = xp2pManager; // 将实例挂载到全局

    app.logger?.log('xp2pManager Initialized', {
      P2PPlayerVersion: xp2pManager.P2PPlayerVersion,
      XP2PVersion: xp2pManager.XP2PVersion,
      uuid: xp2pManager.uuid,
    });
  }
  return xp2pManager;
};